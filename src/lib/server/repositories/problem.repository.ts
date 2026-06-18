import { eq } from 'drizzle-orm';
import { db } from '../db';
import { problems, type difficultyLevel, type problem } from '../db/schema';

export type selectProblems = Promise<
	Pick<problem, 'id' | 'title' | 'description' | 'category' | 'difficulty'>[]
>;

export const problemRepository = {
	findAll: async (difficulty?: difficultyLevel): selectProblems => {
		if (difficulty)
			return await db
				.select({
					id: problems.id,
					title: problems.title,
					description: problems.description,
					category: problems.category,
					difficulty: problems.difficulty
				})
				.from(problems)
				.where(eq(problems.difficulty, difficulty));
		else
			return await db
				.select({
					id: problems.id,
					title: problems.title,
					description: problems.description,
					category: problems.category,
					difficulty: problems.difficulty
				})
				.from(problems);
	},
	findById: async (problemId: string): Promise<problem> => {
		return (await db.select().from(problems).where(eq(problems.id, problemId)))[0];
	}
};
