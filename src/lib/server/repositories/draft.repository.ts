import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { drafts, type draft, type newDraft } from '../db/schema';

export const draftRepository = {
	saveDraft: async (
		userId: string,
		problemId: string,
		stepName: string,
		content: string,
		isHintUsed: boolean,
		updatedAt: Date
	): Promise<newDraft> => {
		const draft = (
			await db
				.select()
				.from(drafts)
				.where(and(eq(drafts.userId, userId), eq(drafts.problemId, problemId)))
		)[0];
		if (draft) {
			const hintsUsed = isHintUsed ? draft.hintsUsed + 1 : draft.hintsUsed;
			return (
				await db
					.update(drafts)
					.set({ currentStep: stepName, [stepName]: content, updatedAt, hintsUsed })
					.returning()
			)[0];
		} else {
			const hintsUsed = isHintUsed ? 1 : 0;
			return (
				await db
					.insert(drafts)
					.values({ userId, problemId, currentStep: stepName, [stepName]: content, hintsUsed })
					.returning()
			)[0];
		}
	},
	getDraft: async (userId: string, problemId: string): Promise<draft> => {
		return (
			await db
				.select()
				.from(drafts)
				.where(and(eq(drafts.userId, userId), eq(drafts.problemId, problemId)))
		)[0];
	}
};
