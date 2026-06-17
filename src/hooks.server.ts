import type { Handle } from '@sveltejs/kit';
import { jwtVerify } from 'jose';
import { ACCESS_TOKEN_SECRET } from '$env/static/private';
import { userRepository } from '$lib/server/repositories/user.repository';
import { authService } from '$lib/server/services/auth.service';
import { setCookies } from '$lib/server/utils/cookies';

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
			const foundUser = await userRepository.findById(userId);
			if (foundUser) {
				const { passwordHash, ...user } = foundUser;
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
			const foundUser = await userRepository.findById(userId);
			if (foundUser) {
				const { passwordHash, ...user } = foundUser;
				event.locals.user = user;
				event.locals.session = { id: sessionId as string };
			}
		}
	} catch (error) {
		console.error('Hook error:', error);
	}
	return resolve(event);
};
