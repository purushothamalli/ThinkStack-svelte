import type { Prisma } from '@prisma/client';
import type { difficultyLevel } from '../db/schema';
import { redis } from '../redis';
import { problemRepo, type selectProblems } from '../repos/problem.repo';

type problem = Prisma.ProblemUncheckedCreateInput;

export const problemService = {
	getproblems: async (difficulty?: difficultyLevel): selectProblems => {
		const cacheKey = difficulty ? `problems:difficulty:${difficulty}` : 'problems:all';
		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				console.log(`Cache hit! Loaded ${cacheKey} from redis!`);
				return JSON.parse(cached);
			}
		} catch (error) {
			console.error('Redis fetch error: ', error);
		}
		console.log(`Cache miss! Fetching ${cacheKey} from postgreSQL...`);
		const problems = await problemRepo.findAll(difficulty);
		try {
			await redis.set(cacheKey, JSON.stringify(problems), {
				expiration: { type: 'EX', value: 3600 }
			});
		} catch (error) {
			console.log('Redis save error: ', error);
		}
		return problems;
	},
	getProblem: async (problemId: string): Promise<problem | null> => {
		const cacheKey = `problem:${problemId}`;
		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				console.log(`Cache hit! Loaded ${cacheKey} from redis!`);
				return JSON.parse(cached);
			}
		} catch (error) {
			console.log('Redis fetch error: ', error);
		}
		console.log(`Cache miss! Fetching ${cacheKey} from postgreSQL...`);
		const problem = await problemRepo.findById(problemId);
		try {
			await redis.set(cacheKey, JSON.stringify(problem), {
				expiration: { type: 'EX', value: 3600 }
			});
		} catch (error) {
			console.log('Redis save error: ', error);
		}
		return problem;
	}
};
