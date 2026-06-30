import { prisma } from '../../../../prisma';
import type { Prisma, Problem, difficultyEnum } from '@prisma/client';

export type SelectProblems = Promise<
	Pick<Problem, 'id' | 'title' | 'description' | 'category' | 'difficulty'>[]
>;

export interface IProblemRepository {
	findAll(difficulty?: difficultyEnum): SelectProblems;
	findById(problemId: string): Promise<Problem | null>;
}

class PrismaProblemRepository implements IProblemRepository {
	public async findAll(difficulty?: difficultyEnum): SelectProblems {
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
	}
	public async findById(problemId: string): Promise<Problem | null> {
		return await prisma.problem.findUnique({
			where: { id: problemId }
		});
	}
}

export const problemRepo: IProblemRepository = new PrismaProblemRepository();

// export const problemRepo = {
// 	findAll: async (difficulty?: difficultyEnum): SelectProblems => {
// 		const config: Prisma.ProblemFindManyArgs = {
// 			select: {
// 				id: true,
// 				title: true,
// 				description: true,
// 				category: true,
// 				difficulty: true
// 			}
// 		};
// 		if (difficulty) config.where = { difficulty };

// 		return await prisma.problem.findMany(config);
// 	},
// 	findById: async (problemId: string): Promise<Problem | null> => {
// 		return await prisma.problem.findUnique({
// 			where: { id: problemId }
// 		});
// 	}
// };
