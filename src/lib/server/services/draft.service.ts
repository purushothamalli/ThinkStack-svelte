import type { draft, newDraft } from '../db/schema';
import { redis } from '../redis';
import { pushDraftJob, type DraftJob } from '../redis/queue';
import { draftRepo } from '../repos/draft.repo';

export const draftService = {
	getDraft: async (userId: string, problemId: string): Promise<draft | null> => {
		const cacheKey = `draft:${userId}:${problemId}`;
		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				console.log(`Draft cache hit: ${cacheKey}`);
				return JSON.parse(cached);
			}
		} catch (error) {
			console.log('Redis fetch error: ', error);
		}
		console.log(`Draft cache miss! Fetching from postgres: ${cacheKey}`);
		const draft = await draftRepo.getDraft(userId, problemId);
		if (draft) {
			try {
				await redis.set(cacheKey, JSON.stringify(draft), {
					expiration: { type: 'EX', value: 86400 }
				});
			} catch (error) {
				console.log('Redis draft set error: ', error);
			}
		}
		return draft;
	},
	saveDraft: async (
		userId: string,
		problemId: string,
		stepName: 'understanding' | 'breakdown' | 'approach' | 'solution' | 'reflection',
		content: string,
		isHintUsed: boolean
	): Promise<newDraft> => {
		const cacheKey = `draft:${userId}:${problemId}`;
		let draft;
		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				console.log(`Draft cache hit: ${cacheKey}`);
				draft = JSON.parse(cached);
			}
		} catch (error) {
			console.log('Redis fetch error: ', error);
		}
		if (!draft) {
			const dbDraft = await draftRepo.getDraft(userId, problemId);
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
			await redis.set(cacheKey, JSON.stringify(draft), {
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
		await pushDraftJob(job);
		return draft;
	}
};
