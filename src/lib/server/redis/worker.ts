import { redis } from '.';
import { draftRepo } from '../repos/draft.repo';
import type { DraftJob } from './queue';

const DRAFT_QUEUE_KEY = 'queue:draft-saves';

let isRunning = false;
export async function backgroundWorker() {
	if (isRunning) return;
	isRunning = true;
	const workerClient = redis.duplicate();

	try {
		await workerClient.connect();
		console.log('Background worker connected via Worker client!');
	} catch (error) {
		console.error('Failed to connect worker client: ', error);
		isRunning = false;
		return;
	}

	console.log('Background worker started and listening for jobs...');
	while (true) {
		try {
			const jobData = await workerClient.brPop(DRAFT_QUEUE_KEY, 0);
			if (jobData && jobData.element) {
				const job: DraftJob = JSON.parse(jobData.element);
				console.log(`Processing draft update for user: ${job.userId}`);
				await draftRepo.saveDraft(
					job.userId,
					job.problemId,
					job.activeStep,
					job.content,
					job.isHintUsed
				);
				console.log(`Postgres database successfully updated for user ${job.userId}`);
			}
		} catch (error) {
			console.log('Background worker job failed:', error);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}
