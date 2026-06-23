import { prisma } from '../../../../prisma';

export const draftRepo = {
	saveDraft: async (
		userId: string,
		problemId: string,
		stepName: string,
		content: string,
		isHintUsed: boolean,
		updatedAt: Date
	) => {
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
				updatedAt,
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
	},
	getDraft: async (userId: string, problemId: string) => {
		return await prisma.draft.findUnique({
			where: {
				userId_problemId: {
					userId,
					problemId
				}
			}
		});
	}
};
