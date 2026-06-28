import type { Handle } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { ACCESS_TOKEN_SECRET } from '$env/static/private';
import { userRepo } from '$lib/server/repos/user.repo';
import { authService } from '$lib/server/services/auth.service';
import { deleteCookies, setCookies } from '$lib/server/utils/cookies';
import { redis } from '$lib/server/redis';

const getUser = async (userId: string) => {
	const cacheKey = `user:session:${userId}`;
	let user = null;
	try {
		if (import.meta.env.MODE !== 'test') {
			const cachedUser = await redis.get(cacheKey);
			if (cachedUser) {
				console.log('Session Cache hit for user: ', cacheKey);
				user = JSON.parse(cachedUser);
			}
		}
	} catch (error) {
		console.log('Redis Fetch error: ', error);
	}
	if (!user) {
		console.log('Session cache miss for user: ', cacheKey);
		const foundUser = await userRepo.findById(userId);
		if (foundUser) {
			const { passwordHash, ...userPayload } = foundUser;
			void passwordHash;
			user = userPayload;
			try {
				if (import.meta.env.MODE !== 'test') {
					await redis.set(cacheKey, JSON.stringify(user), {
						expiration: { type: 'EX', value: 3600 }
					});
				}
			} catch (error) {
				console.log('Redis save error: ', error);
			}
		}
	}
	return user;
};

export const handle: Handle = async ({ resolve, event }) => {
	const accessToken = event.cookies.get('accessToken');
	const refreshToken = event.cookies.get('refreshToken');
	const accessTokenSecret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
	event.locals.user = null;
	event.locals.session = null;
	try {
		if (accessToken) {
			const { payload } = await jwtVerify(accessToken, accessTokenSecret);
			const userId = payload.userId as string;
			const sessionId = payload.sessionId as string;
			const user = await getUser(userId);
			if (user) {
				event.locals.user = user;
				event.locals.session = { id: sessionId as string };
			}
		} else if (refreshToken) {
			const userAgent = event.request.headers.get('user-agent') || '';
			const tokens = await authService.refresh(refreshToken, userAgent);
			setCookies(event.cookies, tokens.accessToken, tokens.refreshToken);
			const { payload } = await jwtVerify(tokens.accessToken, accessTokenSecret);
			const userId = payload.userId as string;
			const sessionId = payload.sessionId as string;
			const user = await getUser(userId);
			if (user) {
				event.locals.user = user;
				event.locals.session = { id: sessionId as string };
			}
		}
	} catch (error) {
		console.error('Hook error:', error);
		deleteCookies(event.cookies);
	}
	return resolve(event);
};
