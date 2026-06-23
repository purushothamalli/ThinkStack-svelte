import type { difficultyLevel } from '../db/schema';
import { problemRepo, type selectProblems } from '../repos/problem.repo';

export const problemService = {
	getproblems: async (difficulty?: difficultyLevel): selectProblems => {
		return await problemRepo.findAll(difficulty);
	},
	getProblem: async (problemId: string) => {
		return await problemRepo.findById(problemId);
	}
};
