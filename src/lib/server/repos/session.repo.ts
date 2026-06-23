import { prisma } from '../../../../prisma';
import type { Prisma } from '@prisma/client';

type newSession = Prisma.SessionUncheckedCreateInput;

export const sessionRepo = {
	findWithUser: async (sessionId: string) => {
		return await prisma.session.findUnique({
			where: { id: sessionId },
			include: {
				user: {
					omit: { passwordHash: true }
				}
			}
		});
	},
	createSession: async (newSession: newSession) => {
		return await prisma.session.create({
			data: newSession
		});
	},
	updateRefreshToken: async (sessionId: string, newToken: string, newExpiresAt: Date) => {
		return await prisma.session.update({
			where: { id: sessionId },
			data: {
				refreshTokenHash: newToken,
				expiresAt: newExpiresAt
			}
		});
	},
	deleteSession: async (sessionId: string) => {
		return await prisma.session.delete({
			where: { id: sessionId }
		});
	},
	deleteAllUserSessions: async (userId: string) => {
		return await prisma.session.deleteMany({
			where: { userId }
		});
	}
};
