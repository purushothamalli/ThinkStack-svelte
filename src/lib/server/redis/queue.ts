import { redis } from '.';

export interface DraftJob {
	userId: string;
	problemId: string;
	activeStep: 'understanding' | 'breakdown' | 'approach' | 'solution' | 'reflection';
	content: string;
	isHintUsed: boolean;
}

const DRAFT_QUEUE_KEY = 'queue:draft-saves';

export async function pushDraftJob(job: DraftJob): Promise<void> {
	try {
		await redis.lPush(DRAFT_QUEUE_KEY, JSON.stringify(job));
		console.log(`Job Queued for user: ${job.userId} on problem: ${job.problemId}`);
	} catch (error) {
		console.log('Failed to push job into redis queue: ', error);
		// eslint-disable-next-line preserve-caught-error
		throw new Error('Queue submission failed!');
	}
}
