import type { draft, newDraft } from '../db/schema';
import { draftRepo } from '../repos/draft.repo';

export const draftService = {
	getDraft: async (userId: string, problemId: string): Promise<draft | null> => {
		return await draftRepo.getDraft(userId, problemId);
	},
	saveDraft: async (
		userId: string,
		problemId: string,
		stepName: string,
		content: string,
		isHintUsed: boolean
	): Promise<newDraft> => {
		return await draftRepo.saveDraft(
			userId,
			problemId,
			stepName,
			content,
			isHintUsed,
			new Date(Date.now())
		);
	}
};
