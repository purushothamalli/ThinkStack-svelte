import { prisma } from '../../../../prisma';
import type { Prisma, Problem, difficultyEnum } from '@prisma/client';

export type selectProblems = Promise<
	Pick<Problem, 'id' | 'title' | 'description' | 'category' | 'difficulty'>[]
>;

export const problemRepo = {
	findAll: async (difficulty?: difficultyEnum): selectProblems => {
		const config: Prisma.ProblemFindManyArgs = {
			select: {
				id: true,
				title: true,
				description: true,
				category: true,
				difficulty: true
			}
		};
		if (difficulty) config.where = { difficulty };

		return await prisma.problem.findMany(config);
	},
	findById: async (problemId: string): Promise<Problem | null> => {
		return await prisma.problem.findUnique({
			where: { id: problemId }
		});
	}
};
