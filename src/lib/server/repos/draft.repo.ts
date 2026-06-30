import type { Draft } from '@prisma/client';
import { prisma } from '../../../../prisma';

export interface IDraftRepository {
	saveDraft(
		userId: string,
		problemId: string,
		stepName: string,
		content: string,
		isHintUsed: boolean
	): Promise<Draft>;
	getDraft(userId: string, problemId: string): Promise<Draft | null>;
}

class PrismaDraftRepository implements IDraftRepository {
	public async saveDraft(
		userId: string,
		problemId: string,
		stepName: string,
		content: string,
		isHintUsed: boolean
	): Promise<Draft> {
		return await prisma.draft.upsert({
			where: {
				userId_problemId: {
					userId,
					problemId
				}
			},
			update: {
				currentStep: stepName,
				[stepName]: content,
				hintsUsed: isHintUsed ? { increment: 1 } : undefined
			},
			create: {
				userId,
				problemId,
				currentStep: stepName,
				[stepName]: content,
				hintsUsed: isHintUsed ? 1 : 0
			}
		});
	}
	public async getDraft(userId: string, problemId: string): Promise<Draft | null> {
		return await prisma.draft.findUnique({
			where: {
				userId_problemId: {
					userId,
					problemId
				}
			}
		});
	}
}

export const draftRepo: IDraftRepository = new PrismaDraftRepository();

// export const draftRepo = {
// 	saveDraft: async (
// 		userId: string,
// 		problemId: string,
// 		stepName: string,
// 		content: string,
// 		isHintUsed: boolean
// 	) => {
// 		return await prisma.draft.upsert({
// 			where: {
// 				userId_problemId: {
// 					userId,
// 					problemId
// 				}
// 			},
// 			update: {
// 				currentStep: stepName,
// 				[stepName]: content,
// 				hintsUsed: isHintUsed ? { increment: 1 } : undefined
// 			},
// 			create: {
// 				userId,
// 				problemId,
// 				currentStep: stepName,
// 				[stepName]: content,
// 				hintsUsed: isHintUsed ? 1 : 0
// 			}
// 		});
// 	},
// 	getDraft: async (userId: string, problemId: string) => {
// 		return await prisma.draft.findUnique({
// 			where: {
// 				userId_problemId: {
// 					userId,
// 					problemId
// 				}
// 			}
// 		});
// 	}
// };
