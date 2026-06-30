import { redis } from '../redis';
import { QueueService, type IQueueService } from '../redis/queue';
import {
	submissionRepo,
	type FullSubmission,
	type UserStats,
	type SubmissionWithProblem,
	type ISubmissionRepository
} from '../repos/submission.repo';

interface ISubmissionService {
	submitSolution(userId: string, problemId: string): Promise<{ status: string }>;
	getLatestSubmission(userId: string, problemId: string): Promise<FullSubmission | null>;
	getUserDashboardData(
		userId: string
	): Promise<{ stats: UserStats; submissions: SubmissionWithProblem[] }>;
}

class SubmissionServiceImplementation implements ISubmissionService {
	constructor(
		private readonly submissionRepo: ISubmissionRepository,
		private readonly QueueService: IQueueService,
		private readonly redisClient: typeof redis
	) {}
	public async submitSolution(userId: string, problemId: string): Promise<{ status: string }> {
		const statusKey = `submission:status:${userId}:${problemId}`;
		await this.redisClient.set(statusKey, 'evaluating', { expiration: { type: 'EX', value: 600 } });
		await this.QueueService.pushSubmitJob({ userId, problemId });
		return { status: 'queued' };
	}
	public async getLatestSubmission(
		userId: string,
		problemId: string
	): Promise<FullSubmission | null> {
		return await this.submissionRepo.getSubmission(userId, problemId);
	}
	public async getUserDashboardData(
		userId: string
	): Promise<{ stats: UserStats; submissions: SubmissionWithProblem[] }> {
		const data = await Promise.all([
			this.submissionRepo.getUserStats(userId),
			this.submissionRepo.getUserSubmissions(userId)
		]);
		const stats = {
			...data[0]
		};
		return { stats, submissions: data[1] };
	}
}

export const submissionService: ISubmissionService = new SubmissionServiceImplementation(
	submissionRepo,
	QueueService,
	redis
);

// export const submissionService = {
// 	submitSolution: async (userId: string, problemId: string) => {
// 		const statusKey = `submission:status:${userId}:${problemId}`;
// 		await redis.set(statusKey, 'evaluating', { expiration: { type: 'EX', value: 600 } });
// 		await pushSubmitJob({ userId, problemId });
// 		return { status: 'queued' };
// 	},
// 	getLatestSubmission: async (userId: string, problemId: string) => {
// 		return await submissionRepo.getSubmission(userId, problemId);
// 	},
// 	getUserDashboardData: async (
// 		userId: string
// 	): Promise<{ stats: UserStats; submissions: SubmissionWithProblem[] }> => {
// 		const data = await Promise.all([
// 			submissionRepo.getUserStats(userId),
// 			submissionRepo.getUserSubmissions(userId)
// 		]);
// 		const stats = {
// 			...data[0]
// 		};
// 		return { stats, submissions: data[1] };
// 	}
// };
