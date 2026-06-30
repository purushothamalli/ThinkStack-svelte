import { redis } from '.';

export interface DraftJob {
	userId: string;
	problemId: string;
	activeStep: 'understanding' | 'breakdown' | 'approach' | 'solution' | 'reflection';
	content: string;
	isHintUsed: boolean;
}
export interface submitJob {
	userId: string;
	problemId: string;
}
export interface IQueueService {
	pushDraftJob(job: DraftJob): Promise<void>;
	pushSubmitJob(job: submitJob): Promise<void>;
}

class QueueServiceImplementation implements IQueueService {
	constructor(private readonly redisClient: typeof redis) {}
	private readonly DRAFT_QUEUE_KEY = 'queue:draft-saves';
	private readonly SUBMIT_QUEUE_KEY = 'queue:evaluations';
	public async pushDraftJob(job: DraftJob): Promise<void> {
		try {
			await this.redisClient.lPush(this.DRAFT_QUEUE_KEY, JSON.stringify(job));
			console.log(`Draft Queued for user: ${job.userId} on problem: ${job.problemId}`);
		} catch (error) {
			console.log('Failed to push Draft job into redis queue: ', error);
			// eslint-disable-next-line preserve-caught-error
			throw new Error('Queue submission failed!');
		}
	}

	public async pushSubmitJob(job: submitJob): Promise<void> {
		try {
			await this.redisClient.lPush(this.SUBMIT_QUEUE_KEY, JSON.stringify(job));
			console.log(`Submission Queued for user: ${job.userId} on problem: ${job.problemId}`);
		} catch (error) {
			console.log('Faild to push Submission job into redis queue: ', error);
			// eslint-disable-next-line preserve-caught-error
			throw new Error('Queue submission failed');
		}
	}
}

export const QueueService: IQueueService = new QueueServiceImplementation(redis);

// export const DRAFT_QUEUE_KEY = 'queue:draft-saves';
// export const SUBMIT_QUEUE_KEY = 'queue:evaluations';

// export async function pushDraftJob(job: DraftJob): Promise<void> {
// 	try {
// 		await redis.lPush(DRAFT_QUEUE_KEY, JSON.stringify(job));
// 		console.log(`Draft Queued for user: ${job.userId} on problem: ${job.problemId}`);
// 	} catch (error) {
// 		console.log('Failed to push Draft job into redis queue: ', error);
// 		// eslint-disable-next-line preserve-caught-error
// 		throw new Error('Queue submission failed!');
// 	}
// }

// export async function pushSubmitJob(job: submitJob): Promise<void> {
// 	try {
// 		await redis.lPush(SUBMIT_QUEUE_KEY, JSON.stringify(job));
// 		console.log(`Submission Queued for user: ${job.userId} on problem: ${job.problemId}`);
// 	} catch (error) {
// 		console.log('Faild to push Submission job into redis queue: ', error);
// 		// eslint-disable-next-line preserve-caught-error
// 		throw new Error('Queue submission failed');
// 	}
// }
