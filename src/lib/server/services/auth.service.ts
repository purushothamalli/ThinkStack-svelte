import { jwtVerify, SignJWT } from 'jose';
import { userRepository } from '../repositories/user.repository';
import bcrypt from 'bcrypt';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '$env/static/private';
import { sessionRepository } from '../repositories/session.repository';
import crypto from 'crypto';
import type { user } from '../db/schema';

type Tokens = { accessToken: string; refreshToken: string };
type userWithTokens = {
	user: Omit<user, 'passwordHash'>;
	accessToken: string;
	refreshToken: string;
};

const hashPassword = async (password: string): Promise<string> => {
	const salt = await bcrypt.genSalt(10);
	return await bcrypt.hash(password, salt);
};

const hashToken = (token: string): string => {
	return crypto.createHash('sha256').update(token).digest('hex');
};

const accessTokenSecret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
const refreshTokenSecret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);

const createAccessToken = async (userId: string, sessionId: string): Promise<string> => {
	return await new SignJWT({ userId, sessionId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('15m')
		.sign(accessTokenSecret);
};
const createRefreshToken = async (userId: string, sessionId: string): Promise<string> => {
	return await new SignJWT({ userId, sessionId })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(refreshTokenSecret);
};

const createTokensAndSession = async (userId: string, userAgent: string): Promise<Tokens> => {
	const sessionId = crypto.randomUUID();
	const accessToken = await createAccessToken(userId, sessionId);
	const refreshToken = await createRefreshToken(userId, sessionId);
	const refreshTokenHash = await hashToken(refreshToken);
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
	await sessionRepository.createSession({
		id: sessionId,
		userId: userId,
		refreshTokenHash,
		expiresAt,
		userAgent
	});
	return { accessToken, refreshToken };
};

export const authService = {
	register: async (
		firstName: string,
		lastName: string,
		email: string,
		password: string,
		userAgent: string
	): Promise<userWithTokens> => {
		const existing = await userRepository.findByEmail(email);
		if (existing) throw new Error('Email already exists!');
		const passwordHash = await hashPassword(password);
		const user = await userRepository.createUser({
			firstName,
			lastName,
			email,
			passwordHash
		});
		const { accessToken, refreshToken } = await createTokensAndSession(user.id, userAgent);
		return {
			user,
			accessToken,
			refreshToken
		};
	},
	login: async (email: string, password: string, userAgent: string): Promise<userWithTokens> => {
		const existingUser = await userRepository.findByEmail(email);
		if (!existingUser) throw new Error('Invalid credentials!');
		const { passwordHash, ...user } = existingUser;
		const match = await bcrypt.compare(password, passwordHash);
		if (!match) throw new Error('Invalid credentials!');
		const { accessToken, refreshToken } = await createTokensAndSession(user.id, userAgent);
		return {
			user,
			accessToken,
			refreshToken
		};
	},
	refresh: async (oldRefreshToken: string, userAgent: string): Promise<Tokens> => {
		const { payload } = await jwtVerify(oldRefreshToken, refreshTokenSecret);
		const userId = payload.userId as string;
		const sessionId = payload.sessionId as string;
		const session = await sessionRepository.findWithUser(sessionId);
		if (!session) throw new Error("Session doesn't exist!");
		const oldRefreshTokenHash = await hashToken(oldRefreshToken);
		if (oldRefreshTokenHash !== session.refreshTokenHash) {
			//Possible replay attack!
			await sessionRepository.deleteSession(session.id);
			throw new Error('Invalid refresh Token, deleting all the sessions related to this token!');
		}
		if (session.userAgent !== userAgent)
			console.log(session.userAgent, userAgent, 'UserAgent Mismatch!!!!!!');
		if (session.expiresAt.getTime() < Date.now()) throw new Error('Session expired, login again!');
		const accessToken = await createAccessToken(userId, sessionId);
		const refreshToken = await createRefreshToken(userId, sessionId);
		const refreshTokenHash = await hashToken(refreshToken);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		await sessionRepository.updateRefreshToken(sessionId, refreshTokenHash, expiresAt);
		return { accessToken, refreshToken };
	},
	logout: async (sessionId: string): Promise<void> => {
		await sessionRepository.deleteSession(sessionId);
	},

	logoutAllDevices: async (userId: string): Promise<void> => {
		await sessionRepository.deleteAllUserSessions(userId);
	}
};
