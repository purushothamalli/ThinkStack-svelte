import type { draft, newDraft } from '../db/schema';
import { draftRepository } from '../repositories/draft.repository';

export const draftService = {
	getDraft: async (userId: string, problemId: string): Promise<draft> => {
		return await draftRepository.getDraft(userId, problemId);
	},
	saveDraft: async (
		userId: string,
		problemId: string,
		stepName: string,
		content: string,
		isHintUsed: boolean
	): Promise<newDraft> => {
		return await draftRepository.saveDraft(
			userId,
			problemId,
			stepName,
			content,
			isHintUsed,
			new Date(Date.now())
		);
	}
};
