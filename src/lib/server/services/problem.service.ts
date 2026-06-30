import type { Problem } from '@prisma/client';
import type { difficultyLevel } from '../db/schema';
import { problemRepo, type IProblemRepository, type SelectProblems } from '../repos/problem.repo';
import { Cache } from '../decorators/cache';

interface IProblemService {
	getProblems(difficulty?: difficultyLevel): SelectProblems;
	getProblem(problemId: string): Promise<Problem | null>;
}

class ProblemServiceImplementation implements IProblemService {
	constructor(private readonly problemRepo: IProblemRepository) {}
	@Cache('problems', 3600)
	public async getProblems(difficulty?: difficultyLevel): SelectProblems {
		return await this.problemRepo.findAll(difficulty);
	}
	@Cache('problem', 3600)
	public async getProblem(problemId: string): Promise<Problem | null> {
		return await this.problemRepo.findById(problemId);
	}
}

export const problemService: IProblemService = new ProblemServiceImplementation(problemRepo);

// export const problemService = {
// 	getproblems: async (difficulty?: difficultyLevel): SelectProblems => {
// 		const cacheKey = difficulty ? `problems:difficulty:${difficulty}` : 'problems:all';
// 		try {
// 			const cached = await redis.get(cacheKey);
// 			if (cached) {
// 				console.log(`Cache hit! Loaded ${cacheKey} from redis!`);
// 				return JSON.parse(cached);
// 			}
// 		} catch (error) {
// 			console.error('Redis fetch error: ', error);
// 		}
// 		console.log(`Cache miss! Fetching ${cacheKey} from postgreSQL...`);
// 		const problems = await problemRepo.findAll(difficulty);
// 		try {
// 			await redis.set(cacheKey, JSON.stringify(problems), {
// 				expiration: { type: 'EX', value: 3600 }
// 			});
// 		} catch (error) {
// 			console.log('Redis save error: ', error);
// 		}
// 		return problems;
// 	},
// 	getProblem: async (problemId: string): Promise<Problem | null> => {
// 		const cacheKey = `problem:${problemId}`;
// 		try {
// 			const cached = await redis.get(cacheKey);
// 			if (cached) {
// 				console.log(`Cache hit! Loaded ${cacheKey} from redis!`);
// 				return JSON.parse(cached);
// 			}
// 		} catch (error) {
// 			console.log('Redis fetch error: ', error);
// 		}
// 		console.log(`Cache miss! Fetching ${cacheKey} from postgreSQL...`);
// 		const problem = await problemRepo.findById(problemId);
// 		try {
// 			await redis.set(cacheKey, JSON.stringify(problem), {
// 				expiration: { type: 'EX', value: 3600 }
// 			});
// 		} catch (error) {
// 			console.log('Redis save error: ', error);
// 		}
// 		return problem;
// 	}
// };
