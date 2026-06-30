import type { Problem } from '@prisma/client';
import type { difficultyLevel } from '../db/schema';
import { redis } from '../redis';
import { problemRepo, type IProblemRepository, type SelectProblems } from '../repos/problem.repo';

interface IProblemService {
	getProblems(difficulty?: difficultyLevel): SelectProblems;
	getProblem(problemId: string): Promise<Problem | null>;
}

class ProblemServiceImplementation implements IProblemService {
	constructor(
		private readonly problemRepo: IProblemRepository,
		private readonly redisClient: typeof redis
	) {}
	public async getProblems(difficulty?: difficultyLevel): SelectProblems {
		const cacheKey = difficulty ? `problems:difficulty:${difficulty}` : 'problems:all';
		try {
			const cached = await this.redisClient.get(cacheKey);
			if (cached) {
				console.log(`Cache hit! Loaded ${cacheKey} from redis!`);
				return JSON.parse(cached);
			}
		} catch (error) {
			console.error('Redis fetch error: ', error);
		}
		console.log(`Cache miss! Fetching ${cacheKey} from postgreSQL...`);
		const problems = await this.problemRepo.findAll(difficulty);
		try {
			await this.redisClient.set(cacheKey, JSON.stringify(problems), {
				expiration: { type: 'EX', value: 3600 }
			});
		} catch (error) {
			console.log('Redis save error: ', error);
		}
		return problems;
	}
	public async getProblem(problemId: string): Promise<Problem | null> {
		const cacheKey = `problem:${problemId}`;
		try {
			const cached = await this.redisClient.get(cacheKey);
			if (cached) {
				console.log(`Cache hit! Loaded ${cacheKey} from redis!`);
				return JSON.parse(cached);
			}
		} catch (error) {
			console.log('Redis fetch error: ', error);
		}
		console.log(`Cache miss! Fetching ${cacheKey} from postgreSQL...`);
		const problem = await this.problemRepo.findById(problemId);
		try {
			await this.redisClient.set(cacheKey, JSON.stringify(problem), {
				expiration: { type: 'EX', value: 3600 }
			});
		} catch (error) {
			console.log('Redis save error: ', error);
		}
		return problem;
	}
}

export const problemService: IProblemService = new ProblemServiceImplementation(problemRepo, redis);

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
