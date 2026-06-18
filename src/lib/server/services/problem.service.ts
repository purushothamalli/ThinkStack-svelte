import type { difficultyLevel } from '../db/schema';
import { problemRepository, type selectProblems } from '../repositories/problem.repository';

export const problemService = {
	getproblems: async (difficulty?: difficultyLevel): selectProblems => {
		return await problemRepository.findAll(difficulty);
	},
	getProblem: async (problemId: string) => {
		return await problemRepository.findById(problemId);
	}
};
