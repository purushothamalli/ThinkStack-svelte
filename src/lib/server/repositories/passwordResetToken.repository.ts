import { and, eq, gt } from 'drizzle-orm';
import { db } from '../db';
import {
	passwordResetTokens,
	type newPasswordResetToken,
	type passwordResetToken
} from '../db/schema';

export const passwordResetTokenRepository = {
	createPasswordResetToken: async (data: newPasswordResetToken): Promise<newPasswordResetToken> => {
		return (await db.insert(passwordResetTokens).values(data).returning())[0];
	},
	findActiveByHash: async (tokenHash: string): Promise<passwordResetToken> => {
		return (
			await db
				.select()
				.from(passwordResetTokens)
				.where(
					and(
						eq(passwordResetTokens.tokenHash, tokenHash),
						gt(passwordResetTokens.expiresAt, new Date(Date.now()))
					)
				)
		)[0];
	},
	deleteByUserId: async (userId: string): Promise<passwordResetToken> => {
		return (
			await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId)).returning()
		)[0];
	},
	deletePasswordToken: async (tokenEntryId: string): Promise<passwordResetToken> => {
		return (
			await db
				.delete(passwordResetTokens)
				.where(eq(passwordResetTokens.id, tokenEntryId))
				.returning()
		)[0];
	}
};
