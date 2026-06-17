import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, type newSession, type Session } from '../db/schema';

export const sessionRepository = {
	findWithUser: async (
		sessionId: string
	): Promise<
		| {
				id: string;
				createdAt: Date | null;
				userId: string;
				refreshTokenHash: string;
				expiresAt: Date;
				userAgent: string | null;
				user: {
					id: string;
					firstName: string;
					lastName: string;
					email: string;
					passwordHash: string;
					profilePic: string | null;
					createdAt: Date;
				};
		  }
		| undefined
	> => {
		return await db.query.sessions.findFirst({
			where: (sessions, { eq }) => eq(sessions.id, sessionId),
			with: {
				user: true
			}
		});
	},
	createSession: async (data: newSession): Promise<newSession> => {
		return (await db.insert(sessions).values(data).returning())[0];
	},
	updateRefreshToken: async (
		sessionId: string,
		newToken: string,
		newExpiresAt: Date
	): Promise<Session> => {
		return (
			await db
				.update(sessions)
				.set({ refreshTokenHash: newToken, expiresAt: newExpiresAt })
				.where(eq(sessions.id, sessionId))
				.returning()
		)[0];
	},
	deleteSession: async (sessionId: string): Promise<Session> => {
		return (await db.delete(sessions).where(eq(sessions.id, sessionId)).returning())[0];
	},
	deleteAllUserSessions: async (userId: string): Promise<Session[]> => {
		return await db.delete(sessions).where(eq(sessions.userId, userId)).returning();
	}
};
