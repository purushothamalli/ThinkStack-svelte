import type { Draft } from '@prisma/client';
import { redis } from '../redis';
import { QueueService, type DraftJob, type IQueueService } from '../redis/queue';
import { draftRepo, type IDraftRepository } from '../repos/draft.repo';
import { Cache } from '../decorators/cache';

type steps = 'understanding' | 'breakdown' | 'approach' | 'solution' | 'reflection';

interface IDraftService {
	getDraft(userId: string, problemId: string): Promise<Draft | null>;
	saveDraft(
		userId: string,
		problemId: string,
		stepName: steps,
		content: string,
		isHintUsed: boolean
	): Promise<Draft>;
}

class DraftServiceImplementation implements IDraftService {
	constructor(
		private readonly QueueService: IQueueService,
		private readonly draftRepo: IDraftRepository,
		private readonly redisClient: typeof redis
	) {}
	@Cache('draft', 86400)
	public async getDraft(userId: string, problemId: string): Promise<Draft | null> {
		return await this.draftRepo.getDraft(userId, problemId);
	}
	public async saveDraft(
		userId: string,
		problemId: string,
		stepName: 'understanding' | 'breakdown' | 'approach' | 'solution' | 'reflection',
		content: string,
		isHintUsed: boolean
	): Promise<Draft> {
		const cacheKey = `draft:${userId}:${problemId}`;
		let draft;
		try {
			const cached = await this.redisClient.get(cacheKey);
			if (cached) {
				console.log(`Draft cache hit: ${cacheKey}`);
				draft = JSON.parse(cached);
			}
		} catch (error) {
			console.log('Redis fetch error: ', error);
		}
		if (!draft) {
			const dbDraft = await this.draftRepo.getDraft(userId, problemId);
			if (dbDraft) draft = dbDraft;
			else {
				draft = {
					userId,
					problemId,
					currentStep: stepName,
					hintsUsed: 0,
					understanding: '',
					breakdown: '',
					approach: '',
					solution: '',
					reflection: '',
					updatedAt: new Date(Date.now())
				};
			}
		}
		draft.currentStep = stepName;
		draft[stepName] = content;
		if (isHintUsed) draft.hintsUsed += 1;
		draft.updatedAt = new Date(Date.now());
		try {
			await this.redisClient.set(cacheKey, JSON.stringify(draft), {
				expiration: { type: 'EX', value: 86400 }
			});
			console.log(`Cache updated draft for user: ${userId}`);
		} catch (error) {
			console.error('Redis draft save error: ', error);
		}
		const job: DraftJob = {
			userId,
			problemId,
			activeStep: stepName,
			content,
			isHintUsed
		};
		await this.QueueService.pushDraftJob(job);
		return draft;
	}
}

export const draftService: IDraftService = new DraftServiceImplementation(
	QueueService,
	draftRepo,
	redis
);

// export const draftService = {
// 	getDraft: async (userId: string, problemId: string): Promise<Draft | null> => {
// 		const cacheKey = `draft:${userId}:${problemId}`;
// 		try {
// 			const cached = await redis.get(cacheKey);
// 			if (cached) {
// 				console.log(`Draft cache hit: ${cacheKey}`);
// 				return JSON.parse(cached);
// 			}
// 		} catch (error) {
// 			console.log('Redis fetch error: ', error);
// 		}
// 		console.log(`Draft cache miss! Fetching from postgres: ${cacheKey}`);
// 		const draft = await draftRepo.getDraft(userId, problemId);
// 		if (draft) {
// 			try {
// 				await redis.set(cacheKey, JSON.stringify(draft), {
// 					expiration: { type: 'EX', value: 86400 }
// 				});
// 			} catch (error) {
// 				console.log('Redis draft set error: ', error);
// 			}
// 		}
// 		return draft;
// 	},
// 	saveDraft: async (
// 		userId: string,
// 		problemId: string,
// 		stepName: 'understanding' | 'breakdown' | 'approach' | 'solution' | 'reflection',
// 		content: string,
// 		isHintUsed: boolean
// 	): Promise<Draft> => {
// 		const cacheKey = `draft:${userId}:${problemId}`;
// 		let draft;
// 		try {
// 			const cached = await redis.get(cacheKey);
// 			if (cached) {
// 				console.log(`Draft cache hit: ${cacheKey}`);
// 				draft = JSON.parse(cached);
// 			}
// 		} catch (error) {
// 			console.log('Redis fetch error: ', error);
// 		}
// 		if (!draft) {
// 			const dbDraft = await draftRepo.getDraft(userId, problemId);
// 			if (dbDraft) draft = dbDraft;
// 			else {
// 				draft = {
// 					userId,
// 					problemId,
// 					currentStep: stepName,
// 					hintsUsed: 0,
// 					understanding: '',
// 					breakdown: '',
// 					approach: '',
// 					solution: '',
// 					reflection: '',
// 					updatedAt: new Date(Date.now())
// 				};
// 			}
// 		}
// 		draft.currentStep = stepName;
// 		draft[stepName] = content;
// 		if (isHintUsed) draft.hintsUsed += 1;
// 		draft.updatedAt = new Date(Date.now());
// 		try {
// 			await redis.set(cacheKey, JSON.stringify(draft), {
// 				expiration: { type: 'EX', value: 86400 }
// 			});
// 			console.log(`Cache updated draft for user: ${userId}`);
// 		} catch (error) {
// 			console.error('Redis draft save error: ', error);
// 		}
// 		const job: DraftJob = {
// 			userId,
// 			problemId,
// 			activeStep: stepName,
// 			content,
// 			isHintUsed
// 		};
// 		await pushDraftJob(job);
// 		return draft;
// 	}
// };
