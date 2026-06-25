import { redis } from '.';
import { draftRepo } from '../repos/draft.repo';
import { submissionRepo } from '../repos/submission.repo';
import { AIService } from '../services/AI.service';
import { DRAFT_QUEUE_KEY, SUBMIT_QUEUE_KEY, type DraftJob, type submitJob } from './queue';

const hint_penalties: Record<number, number> = {
	0: 0,
	1: 5,
	2: 10,
	3: 15
};
let isRunning = false;
export async function runDraftWorker(draftWorkerClient: any) {
	while (true) {
		try {
			const jobData = await draftWorkerClient.brPop(DRAFT_QUEUE_KEY, 0);
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
			console.log('Draft Background worker job failed:', error);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}

export async function runSubmissionWorker(submissionWorkerClient: any) {
	while (true) {
		try {
			const jobData = await submissionWorkerClient.brPop(SUBMIT_QUEUE_KEY, 0);
			if (jobData && jobData.element) {
				const job: submitJob = JSON.parse(jobData.element);
				console.log(`AI evaluation started for user:${job.userId} on problem:${job.problemId}`);
				const statusKey = `submission:status:${job.userId}:${job.problemId}`;
				const draftKey = `draft:${job.userId}:${job.problemId}`;
				const [draftCached, problemCached] = await Promise.all([
					redis.get(draftKey),
					redis.get(`problem:${job.problemId}`)
				]);
				const draft = draftCached ? JSON.parse(draftCached) : null;
				const problem = problemCached ? JSON.parse(problemCached) : null;
				if (!draft || !problem)
					throw new Error('Required problem or draft details missing for evaluation!');
				const result = await AIService.evaluatesubmission(problem, draft);
				const penaltyApplied = hint_penalties[draft.hintsUsed] ?? 0;
				const finalScore = Math.max(0, result.aiBaseScore - penaltyApplied);
				await submissionRepo.saveSubmission(
					{
						userId: job.userId,
						problemId: job.problemId,
						hintsUsed: draft.hintsUsed,
						penaltyApplied,
						finalScore,
						mistakeTags: result.mistakeTags,
						thinkingPatterns: result.thinkingPatterns
					},
					{
						understanding: draft.understanding,
						breakdown: draft.breakdown,
						approach: draft.approach,
						solution: draft.solution,
						reflection: draft.reflection,
						understandingScore: result.stepScores.understanding,
						breakdownScore: result.stepScores.breakdown,
						approachScore: result.stepScores.approach,
						solutionScore: result.stepScores.solution,
						reflectionScore: result.stepScores.reflection
					},
					{
						expertUnderstanding: result.expertComparison.expertUnderstanding,
						expertReasoningFlow: result.expertComparison.expertReasoningFlow,
						strengths: result.feedback.strengths,
						weaknesses: result.feedback.weaknesses,
						howToImprove: result.feedback.howToImprove
					}
				);
				await redis.set(statusKey, 'completed', { expiration: { type: 'EX', value: 3600 } });
				console.log(`AI Evaluation completed and postgres updated for user: ${job.userId}`);
			}
		} catch (error) {
			console.log('Submission background worker job failed: ', error);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}

export async function backgroundWorker() {
	if (isRunning) return;
	isRunning = true;

	// Create two dedicated duplicate clients for the two queues
	const draftWorkerClient = redis.duplicate();
	const submissionWorkerClient = redis.duplicate();

	try {
		await Promise.all([draftWorkerClient.connect(), submissionWorkerClient.connect()]);
		console.log('Worker connections established successfully.');
	} catch (error) {
		console.error('Failed to connect workers: ', error);
		isRunning = false;
		return;
	}

	// Start both worker loops in parallel
	runDraftWorker(draftWorkerClient).catch((err) => console.error(err));
	runSubmissionWorker(submissionWorkerClient).catch((err) => console.error(err));
}
