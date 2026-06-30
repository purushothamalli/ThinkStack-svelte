import { jwtVerify, SignJWT } from 'jose';
import { userRepo, type IUserRepository } from '../repos/user.repo';
import bcrypt from 'bcrypt';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '$env/static/private';
import { sessionRepo, type ISessionRepository } from '../repos/session.repo';
import crypto from 'crypto';
import type { user } from '../db/schema';
import { emailService, type IEmailService } from './email.service';
import {
	passwordResetTokenRepo,
	type IPasswordResetTokenRepository
} from '../repos/passwordResetToken.repo';
import { redis } from '../redis';

type Tokens = { accessToken: string; refreshToken: string };
type UserWithTokens = {
	user: Omit<user, 'passwordHash'>;
	accessToken: string;
	refreshToken: string;
};
type SuccessState = { Success: boolean };

interface IAuthService {
	register(
		firstName: string,
		lastName: string,
		email: string,
		password: string,
		userAgent: string
	): Promise<UserWithTokens>;
	login(email: string, password: string, userAgent: string): Promise<UserWithTokens>;
	forgotPassword(email: string): Promise<SuccessState>;
	resetPassword(plainToken: string, newPassword: string): Promise<SuccessState>;
	changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string
	): Promise<SuccessState>;
	refresh(oldRefreshToken: string, userAgent: string): Promise<Tokens>;
	logout(sessionId: string, userId?: string): Promise<void>;
	logoutAllDevices(userId: string): Promise<void>;
}

class AuthServiceImplementation implements IAuthService {
	constructor(
		private readonly userRepo: IUserRepository,
		private readonly sessionRepo: ISessionRepository,
		private readonly passwordResetTokenRepo: IPasswordResetTokenRepository,
		private readonly emailService: IEmailService,
		private readonly redisClient: typeof redis
	) {}
	private readonly accessTokenSecret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
	private readonly refreshTokenSecret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);
	private async hashPassword(password: string): Promise<string> {
		const salt = await bcrypt.genSalt(10);
		return await bcrypt.hash(password, salt);
	}
	private hashToken(token: string): string {
		return crypto.createHash('sha256').update(token).digest('hex');
	}
	private async createAccessToken(userId: string, sessionId: string): Promise<string> {
		return await new SignJWT({ userId, sessionId })
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuedAt()
			.setExpirationTime('15m')
			.sign(this.accessTokenSecret);
	}
	private async createRefreshToken(userId: string, sessionId: string): Promise<string> {
		return await new SignJWT({ userId, sessionId })
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuedAt()
			.setExpirationTime('7d')
			.sign(this.refreshTokenSecret);
	}
	private async createTokensAndSession(userId: string, userAgent: string): Promise<Tokens> {
		const sessionId = crypto.randomUUID();
		const accessToken = await this.createAccessToken(userId, sessionId);
		const refreshToken = await this.createRefreshToken(userId, sessionId);
		const refreshTokenHash = this.hashToken(refreshToken);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		await this.sessionRepo.createSession({
			id: sessionId,
			userId: userId,
			refreshTokenHash,
			expiresAt,
			userAgent
		});
		return { accessToken, refreshToken };
	}
	public async register(
		firstName: string,
		lastName: string,
		email: string,
		password: string,
		userAgent: string
	): Promise<UserWithTokens> {
		const existing = await this.userRepo.findByEmail(email);
		if (existing) throw new Error('Email already exists!');
		const passwordHash = await this.hashPassword(password);
		const user = await this.userRepo.createUser({
			firstName,
			lastName,
			email,
			passwordHash
		});
		const { accessToken, refreshToken } = await this.createTokensAndSession(user.id, userAgent);
		return {
			user,
			accessToken,
			refreshToken
		};
	}
	public async login(email: string, password: string, userAgent: string): Promise<UserWithTokens> {
		const existingUser = await this.userRepo.findByEmail(email);
		if (!existingUser) throw new Error('Invalid credentials!');
		const { passwordHash, ...user } = existingUser;
		const match = await bcrypt.compare(password, passwordHash);
		if (!match) throw new Error('Invalid credentials!');
		const { accessToken, refreshToken } = await this.createTokensAndSession(user.id, userAgent);
		return {
			user,
			accessToken,
			refreshToken
		};
	}
	public async forgotPassword(email: string): Promise<SuccessState> {
		const user = await this.userRepo.findByEmail(email);
		if (!user) throw new Error('Email is not registered!');
		const token = crypto
			.createHash('sha256')
			.update(crypto.randomBytes(32).toString('hex'))
			.digest('hex');
		const tokenHash = this.hashToken(token);
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
		await this.passwordResetTokenRepo.createPasswordResetToken({
			userId: user.id,
			tokenHash,
			expiresAt
		});
		this.emailService.sendResetEmail(email, token);
		return { Success: true };
	}
	public async resetPassword(plainToken: string, newPassword: string): Promise<SuccessState> {
		const hashedToken = this.hashToken(plainToken);
		const match = await this.passwordResetTokenRepo.findActiveByHash(hashedToken);
		if (!match) throw new Error('Invalid or expired Token!');
		const passwordHash = await this.hashPassword(newPassword);
		await this.userRepo.updatePassword(match.userId, passwordHash);
		await this.passwordResetTokenRepo.deletePasswordToken(match.id);
		await this.logoutAllDevices(match.userId);
		return { Success: true };
	}
	public async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string
	): Promise<SuccessState> {
		const user = await this.userRepo.findById(userId);
		if (!user) throw new Error("User doesn't exist!");
		const match = await bcrypt.compare(currentPassword, user.passwordHash);
		if (!match) throw new Error('Invalid credentials!');
		const newPasswordHash = await this.hashPassword(newPassword);
		await this.userRepo.updatePassword(user.id, newPasswordHash);
		await this.logoutAllDevices(user.id);
		return { Success: true };
	}
	public async refresh(oldRefreshToken: string, userAgent: string): Promise<Tokens> {
		const { payload } = await jwtVerify(oldRefreshToken, this.refreshTokenSecret);
		const userId = payload.userId as string;
		const sessionId = payload.sessionId as string;
		const session = await this.sessionRepo.findWithUser(sessionId);
		if (!session) throw new Error("Session doesn't exist!");
		const oldRefreshTokenHash = this.hashToken(oldRefreshToken);
		if (oldRefreshTokenHash !== session.refreshTokenHash) {
			//Possible replay attack!
			await this.sessionRepo.deleteSession(session.id);
			throw new Error('Invalid refresh Token, deleting all the sessions related to this token!');
		}
		if (session.userAgent !== userAgent)
			console.log(session.userAgent, userAgent, 'UserAgent Mismatch!!!!!!');
		if (session.expiresAt.getTime() < Date.now()) throw new Error('Session expired, login again!');
		const accessToken = await this.createAccessToken(userId, sessionId);
		const refreshToken = await this.createRefreshToken(userId, sessionId);
		const refreshTokenHash = this.hashToken(refreshToken);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		await this.sessionRepo.updateRefreshToken(sessionId, refreshTokenHash, expiresAt);
		return { accessToken, refreshToken };
	}
	public async logout(sessionId: string, userId?: string): Promise<void> {
		await this.sessionRepo.deleteSession(sessionId);
		if (userId) {
			try {
				await this.redisClient.del(`user:session:${userId}`);
				console.log('Invalidated session cache for user: ' + userId);
			} catch (error) {
				console.log('Redis delete error: ', error);
			}
		}
	}
	public async logoutAllDevices(userId: string): Promise<void> {
		await this.sessionRepo.deleteAllUserSessions(userId);
		try {
			await this.redisClient.del(`user:session:${userId}`);
			console.log('Invalidated session cache for user: ' + userId);
		} catch (error) {
			console.log('Redis delete error: ', error);
		}
	}
}

export const authService: IAuthService = new AuthServiceImplementation(
	userRepo,
	sessionRepo,
	passwordResetTokenRepo,
	emailService,
	redis
);

// const hashPassword = async (password: string): Promise<string> => {
// 	const salt = await bcrypt.genSalt(10);
// 	return await bcrypt.hash(password, salt);
// };

// const hashToken = (token: string): string => {
// 	return crypto.createHash('sha256').update(token).digest('hex');
// };

// const accessTokenSecret = new TextEncoder().encode(ACCESS_TOKEN_SECRET);
// const refreshTokenSecret = new TextEncoder().encode(REFRESH_TOKEN_SECRET);

// const createAccessToken = async (userId: string, sessionId: string): Promise<string> => {
// 	return await new SignJWT({ userId, sessionId })
// 		.setProtectedHeader({ alg: 'HS256' })
// 		.setIssuedAt()
// 		.setExpirationTime('15m')
// 		.sign(accessTokenSecret);
// };
// const createRefreshToken = async (userId: string, sessionId: string): Promise<string> => {
// 	return await new SignJWT({ userId, sessionId })
// 		.setProtectedHeader({ alg: 'HS256' })
// 		.setIssuedAt()
// 		.setExpirationTime('7d')
// 		.sign(refreshTokenSecret);
// };

// const createTokensAndSession = async (userId: string, userAgent: string): Promise<Tokens> => {
// 	const sessionId = crypto.randomUUID();
// 	const accessToken = await createAccessToken(userId, sessionId);
// 	const refreshToken = await createRefreshToken(userId, sessionId);
// 	const refreshTokenHash = await hashToken(refreshToken);
// 	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
// 	await sessionRepo.createSession({
// 		id: sessionId,
// 		userId: userId,
// 		refreshTokenHash,
// 		expiresAt,
// 		userAgent
// 	});
// 	return { accessToken, refreshToken };
// };

// export const authService = {
// 	register: async (
// 		firstName: string,
// 		lastName: string,
// 		email: string,
// 		password: string,
// 		userAgent: string
// 	): Promise<UserWithTokens> => {
// 		const existing = await userRepo.findByEmail(email);
// 		if (existing) throw new Error('Email already exists!');
// 		const passwordHash = await hashPassword(password);
// 		const user = await userRepo.createUser({
// 			firstName,
// 			lastName,
// 			email,
// 			passwordHash
// 		});
// 		const { accessToken, refreshToken } = await createTokensAndSession(user.id, userAgent);
// 		return {
// 			user,
// 			accessToken,
// 			refreshToken
// 		};
// 	},
// 	login: async (email: string, password: string, userAgent: string): Promise<UserWithTokens> => {
// 		const existingUser = await userRepo.findByEmail(email);
// 		if (!existingUser) throw new Error('Invalid credentials!');
// 		const { passwordHash, ...user } = existingUser;
// 		const match = await bcrypt.compare(password, passwordHash);
// 		if (!match) throw new Error('Invalid credentials!');
// 		const { accessToken, refreshToken } = await createTokensAndSession(user.id, userAgent);
// 		return {
// 			user,
// 			accessToken,
// 			refreshToken
// 		};
// 	},
// 	forgotPassword: async (email: string): Promise<SuccessState> => {
// 		const user = await userRepo.findByEmail(email);
// 		if (!user) throw new Error('Email is not registered!');
// 		const token = crypto
// 			.createHash('sha256')
// 			.update(crypto.randomBytes(32).toString('hex'))
// 			.digest('hex');
// 		const tokenHash = hashToken(token);
// 		const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
// 		await passwordResetTokenRepo.createPasswordResetToken({
// 			userId: user.id,
// 			tokenHash,
// 			expiresAt
// 		});
// 		emailService.sendResetEmail(email, token);
// 		return { Success: true };
// 	},
// 	resetPassword: async (plainToken: string, newPassword: string): Promise<SuccessState> => {
// 		const hashedToken = hashToken(plainToken);
// 		const match = await passwordResetTokenRepo.findActiveByHash(hashedToken);
// 		if (!match) throw new Error('Invalid or expired Token!');
// 		const passwordHash = await hashPassword(newPassword);
// 		await userRepo.updatePassword(match.userId, passwordHash);
// 		await passwordResetTokenRepo.deletePasswordToken(match.id);
// 		await authService.logoutAllDevices(match.userId);
// 		return { Success: true };
// 	},
// 	changePassword: async (
// 		userId: string,
// 		currentPassword: string,
// 		newPassword: string
// 	): Promise<SuccessState> => {
// 		const user = await userRepo.findById(userId);
// 		if (!user) throw new Error("User doesn't exist!");
// 		const match = await bcrypt.compare(currentPassword, user.passwordHash);
// 		if (!match) throw new Error('Invalid credentials!');
// 		const newPasswordHash = await hashPassword(newPassword);
// 		await userRepo.updatePassword(user.id, newPasswordHash);
// 		await authService.logoutAllDevices(user.id);
// 		return { Success: true };
// 	},
// 	refresh: async (oldRefreshToken: string, userAgent: string): Promise<Tokens> => {
// 		const { payload } = await jwtVerify(oldRefreshToken, refreshTokenSecret);
// 		const userId = payload.userId as string;
// 		const sessionId = payload.sessionId as string;
// 		const session = await sessionRepo.findWithUser(sessionId);
// 		if (!session) throw new Error("Session doesn't exist!");
// 		const oldRefreshTokenHash = await hashToken(oldRefreshToken);
// 		if (oldRefreshTokenHash !== session.refreshTokenHash) {
// 			//Possible replay attack!
// 			await sessionRepo.deleteSession(session.id);
// 			throw new Error('Invalid refresh Token, deleting all the sessions related to this token!');
// 		}
// 		if (session.userAgent !== userAgent)
// 			console.log(session.userAgent, userAgent, 'UserAgent Mismatch!!!!!!');
// 		if (session.expiresAt.getTime() < Date.now()) throw new Error('Session expired, login again!');
// 		const accessToken = await createAccessToken(userId, sessionId);
// 		const refreshToken = await createRefreshToken(userId, sessionId);
// 		const refreshTokenHash = await hashToken(refreshToken);
// 		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
// 		await sessionRepo.updateRefreshToken(sessionId, refreshTokenHash, expiresAt);
// 		return { accessToken, refreshToken };
// 	},
// 	logout: async (sessionId: string, userId?: string): Promise<void> => {
// 		await sessionRepo.deleteSession(sessionId);
// 		if (userId) {
// 			try {
// 				await redis.del(`user:session:${userId}`);
// 				console.log('Invalidated session cache for user: ' + userId);
// 			} catch (error) {
// 				console.log('Redis delete error: ', error);
// 			}
// 		}
// 	},

// 	logoutAllDevices: async (userId: string): Promise<void> => {
// 		await sessionRepo.deleteAllUserSessions(userId);
// 		try {
// 			await redis.del(`user:session:${userId}`);
// 			console.log('Invalidated session cache for user: ' + userId);
// 		} catch (error) {
// 			console.log('Redis delete error: ', error);
// 		}
// 	}
// };
