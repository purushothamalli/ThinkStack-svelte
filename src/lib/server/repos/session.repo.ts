import { prisma } from '../../../../prisma';
import type { Prisma, Session } from '@prisma/client';

type NewSession = Prisma.SessionUncheckedCreateInput;

type SessionWithUser = Prisma.SessionGetPayload<{
	include: {
		user: {
			omit: { passwordHash: true };
		};
	};
}>;

export interface ISessionRepository {
	findWithUser(sessionId: string): Promise<SessionWithUser | null>;
	createSession(newSession: NewSession): Promise<Session>;
	updateRefreshToken(sessionId: string, newToken: string, newExpiresAt: Date): Promise<Session>;
	deleteSession(sessionId: string): Promise<Session>;
	deleteAllUserSessions(userId: string): Promise<void>;
}

class PrismaSessionRepository implements ISessionRepository {
	public async findWithUser(sessionId: string): Promise<SessionWithUser | null> {
		return await prisma.session.findUnique({
			where: { id: sessionId },
			include: {
				user: {
					omit: { passwordHash: true }
				}
			}
		});
	}
	public async createSession(newSession: NewSession): Promise<Session> {
		return await prisma.session.create({
			data: newSession
		});
	}
	public async updateRefreshToken(
		sessionId: string,
		newToken: string,
		newExpiresAt: Date
	): Promise<Session> {
		return await prisma.session.update({
			where: { id: sessionId },
			data: {
				refreshTokenHash: newToken,
				expiresAt: newExpiresAt
			}
		});
	}
	public async deleteSession(sessionId: string): Promise<Session> {
		return await prisma.session.delete({
			where: { id: sessionId }
		});
	}
	public async deleteAllUserSessions(userId: string): Promise<void> {
		await prisma.session.deleteMany({
			where: { userId }
		});
	}
}

export const sessionRepo: ISessionRepository = new PrismaSessionRepository();

// export const sessionRepo = {
// 	findWithUser: async (sessionId: string) => {
// 		return await prisma.session.findUnique({
// 			where: { id: sessionId },
// 			include: {
// 				user: {
// 					omit: { passwordHash: true }
// 				}
// 			}
// 		});
// 	},
// 	createSession: async (newSession: NewSession) => {
// 		return await prisma.session.create({
// 			data: newSession
// 		});
// 	},
// 	updateRefreshToken: async (sessionId: string, newToken: string, newExpiresAt: Date) => {
// 		return await prisma.session.update({
// 			where: { id: sessionId },
// 			data: {
// 				refreshTokenHash: newToken,
// 				expiresAt: newExpiresAt
// 			}
// 		});
// 	},
// 	deleteSession: async (sessionId: string) => {
// 		return await prisma.session.delete({
// 			where: { id: sessionId }
// 		});
// 	},
// 	deleteAllUserSessions: async (userId: string) => {
// 		return await prisma.session.deleteMany({
// 			where: { userId }
// 		});
// 	}
// };
