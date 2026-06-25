import type { submission } from '../db/schema';
import { redis } from '../redis';
import { pushSubmitJob } from '../redis/queue';
import { submissionRepo } from '../repos/submission.repo';

export const submissionService = {
	submitSolution: async (userId: string, problemId: string) => {
		const statusKey = `submission:status:${userId}:${problemId}`;
		await redis.set(statusKey, 'evaluating', { expiration: { type: 'EX', value: 600 } });
		await pushSubmitJob({ userId, problemId });
		return { status: 'queued' };
	},
	getLatestSubmission: async (userId: string, problemId: string) => {
		return await submissionRepo.getSubmission(userId, problemId);
	},
	getUserDashboardData: async (userId: string) => {
		const data = await Promise.all([
			submissionRepo.getUserStats(userId),
			submissionRepo.getUserSubmissions(userId)
		]);
		const stats = {
			...data[0]
		};
		return { stats, submissions: data[1] };
	}
};
