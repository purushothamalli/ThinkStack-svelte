import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, type newSession } from '../db/schema';

export const sessionRepository = {
	findWithUser: async (sessionId: string) => {
		return await db.query.sessions.findFirst({
			where: (sessions, { eq }) => eq(sessions.id, sessionId),
			with: {
				user: true
			}
		});
	},
	createSession: async (data: newSession) => {
		return (await db.insert(sessions).values(data).returning())[0];
	},
	updateRefreshToken: async (sessionId: string, newToken: string, newExpiresAt: Date) => {
		return (
			await db
				.update(sessions)
				.set({ refreshTokenHash: newToken, expiresAt: newExpiresAt })
				.where(eq(sessions.id, sessionId))
				.returning()
		)[0];
	},
	deleteSession: async (sessionId: string) => {
		return (await db.delete(sessions).where(eq(sessions.id, sessionId)).returning())[0];
	},
	deleteAllUserSessions: async (userId: string) => {
		return await db.delete(sessions).where(eq(sessions.userId, userId));
	}
};
