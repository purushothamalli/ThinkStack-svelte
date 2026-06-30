import { redis } from '.';
import { draftRepo, type IDraftRepository } from '../repos/draft.repo';
import { submissionRepo, type ISubmissionRepository } from '../repos/submission.repo';
import { aIService, type IAIService } from '../services/AI.service';
import { calculateFinalScore } from '../utils/scoring';
import { type DraftJob, type submitJob } from './queue';

interface IBackgroundWorker {
	start(): Promise<void>;
}

class backgroundWorkerImplementation implements IBackgroundWorker {
	private isRunning = false;
	private readonly DRAFT_QUEUE_KEY = 'queue:draft-saves';
	private readonly SUBMIT_QUEUE_KEY = 'queue:evaluations';
	constructor(
		private readonly draftRepo: IDraftRepository,
		private readonly submissionRepo: ISubmissionRepository,
		private readonly aIService: IAIService,
		private readonly redisClient: typeof redis
	) {}
	private async runDraftWorker(draftWorkerClient: typeof redis) {
		while (true) {
			try {
				const jobData = await draftWorkerClient.brPop(this.DRAFT_QUEUE_KEY, 0);
				if (jobData && jobData.element) {
					const job: DraftJob = JSON.parse(jobData.element);
					console.log(`Processing draft update for user: ${job.userId}`);
					await this.draftRepo.saveDraft(
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

	private async runSubmissionWorker(submissionWorkerClient: typeof redis) {
		while (true) {
			try {
				const jobData = await submissionWorkerClient.brPop(this.SUBMIT_QUEUE_KEY, 0);
				if (jobData && jobData.element) {
					const job: submitJob = JSON.parse(jobData.element);
					console.log(`AI evaluation started for user:${job.userId} on problem:${job.problemId}`);
					const statusKey = `submission:status:${job.userId}:${job.problemId}`;
					const draftKey = `draft:${job.userId}:${job.problemId}`;
					const [draftCached, problemCached] = await Promise.all([
						this.redisClient.get(draftKey),
						this.redisClient.get(`problem:${job.problemId}`)
					]);
					const draft = draftCached ? JSON.parse(draftCached) : null;
					const problem = problemCached ? JSON.parse(problemCached) : null;
					if (!draft || !problem)
						throw new Error('Required problem or draft details missing for evaluation!');
					const result = await this.aIService.evaluateSubmission(problem, draft);
					const { hintPenalty: penaltyApplied, finalScore } = calculateFinalScore(
						result.aiBaseScore,
						draft.hintsUsed ?? 0
					);
					await this.submissionRepo.saveSubmission(
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
					await this.redisClient.set(statusKey, 'completed', {
						expiration: { type: 'EX', value: 3600 }
					});
					console.log(`AI Evaluation completed and postgres updated for user: ${job.userId}`);
				}
			} catch (error) {
				console.log('Submission background worker job failed: ', error);
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		}
	}
	public async start(): Promise<void> {
		if (this.isRunning) return;
		this.isRunning = true;
		const draftWorkerClient: typeof redis = this.redisClient.duplicate();
		const submissionWorkerClient: typeof redis = this.redisClient.duplicate();

		try {
			await Promise.all([draftWorkerClient.connect(), submissionWorkerClient.connect()]);
			console.log('Worker connections established successfully.');
		} catch (error) {
			console.error('Failed to connect workers: ', error);
			this.isRunning = false;
			return;
		}
		this.runDraftWorker(draftWorkerClient).catch((err) => console.error(err));
		this.runSubmissionWorker(submissionWorkerClient).catch((err) => console.error(err));
	}
}

export const backgroundWorker: IBackgroundWorker = new backgroundWorkerImplementation(
	draftRepo,
	submissionRepo,
	aIService,
	redis
);

// let isRunning = false;
// const DRAFT_QUEUE_KEY = 'queue:draft-saves';
// const SUBMIT_QUEUE_KEY = 'queue:evaluations';
// export async function runDraftWorker(draftWorkerClient: any) {
// 	while (true) {
// 		try {
// 			const jobData = await draftWorkerClient.brPop(DRAFT_QUEUE_KEY, 0);
// 			if (jobData && jobData.element) {
// 				const job: DraftJob = JSON.parse(jobData.element);
// 				console.log(`Processing draft update for user: ${job.userId}`);
// 				await draftRepo.saveDraft(
// 					job.userId,
// 					job.problemId,
// 					job.activeStep,
// 					job.content,
// 					job.isHintUsed
// 				);
// 				console.log(`Postgres database successfully updated for user ${job.userId}`);
// 			}
// 		} catch (error) {
// 			console.log('Draft Background worker job failed:', error);
// 			await new Promise((resolve) => setTimeout(resolve, 1000));
// 		}
// 	}
// }

// export async function runSubmissionWorker(submissionWorkerClient: any) {
// 	while (true) {
// 		try {
// 			const jobData = await submissionWorkerClient.brPop(SUBMIT_QUEUE_KEY, 0);
// 			if (jobData && jobData.element) {
// 				const job: submitJob = JSON.parse(jobData.element);
// 				console.log(`AI evaluation started for user:${job.userId} on problem:${job.problemId}`);
// 				const statusKey = `submission:status:${job.userId}:${job.problemId}`;
// 				const draftKey = `draft:${job.userId}:${job.problemId}`;
// 				const [draftCached, problemCached] = await Promise.all([
// 					redis.get(draftKey),
// 					redis.get(`problem:${job.problemId}`)
// 				]);
// 				const draft = draftCached ? JSON.parse(draftCached) : null;
// 				const problem = problemCached ? JSON.parse(problemCached) : null;
// 				if (!draft || !problem)
// 					throw new Error('Required problem or draft details missing for evaluation!');
// 				const result = await aIService.evaluateSubmission(problem, draft);
// 				const { hintPenalty: penaltyApplied, finalScore } = calculateFinalScore(
// 					result.aiBaseScore,
// 					draft.hintsUsed ?? 0
// 				);
// 				await submissionRepo.saveSubmission(
// 					{
// 						userId: job.userId,
// 						problemId: job.problemId,
// 						hintsUsed: draft.hintsUsed,
// 						penaltyApplied,
// 						finalScore,
// 						mistakeTags: result.mistakeTags,
// 						thinkingPatterns: result.thinkingPatterns
// 					},
// 					{
// 						understanding: draft.understanding,
// 						breakdown: draft.breakdown,
// 						approach: draft.approach,
// 						solution: draft.solution,
// 						reflection: draft.reflection,
// 						understandingScore: result.stepScores.understanding,
// 						breakdownScore: result.stepScores.breakdown,
// 						approachScore: result.stepScores.approach,
// 						solutionScore: result.stepScores.solution,
// 						reflectionScore: result.stepScores.reflection
// 					},
// 					{
// 						expertUnderstanding: result.expertComparison.expertUnderstanding,
// 						expertReasoningFlow: result.expertComparison.expertReasoningFlow,
// 						strengths: result.feedback.strengths,
// 						weaknesses: result.feedback.weaknesses,
// 						howToImprove: result.feedback.howToImprove
// 					}
// 				);
// 				await redis.set(statusKey, 'completed', { expiration: { type: 'EX', value: 3600 } });
// 				console.log(`AI Evaluation completed and postgres updated for user: ${job.userId}`);
// 			}
// 		} catch (error) {
// 			console.log('Submission background worker job failed: ', error);
// 			await new Promise((resolve) => setTimeout(resolve, 1000));
// 		}
// 	}
// }

// export async function backgroundWorker() {
// 	if (isRunning) return;
// 	isRunning = true;

// 	// Create two dedicated duplicate clients for the two queues
// 	const draftWorkerClient = redis.duplicate();
// 	const submissionWorkerClient = redis.duplicate();

// 	try {
// 		await Promise.all([draftWorkerClient.connect(), submissionWorkerClient.connect()]);
// 		console.log('Worker connections established successfully.');
// 	} catch (error) {
// 		console.error('Failed to connect workers: ', error);
// 		isRunning = false;
// 		return;
// 	}

// 	// Start both worker loops in parallel
// 	runDraftWorker(draftWorkerClient).catch((err) => console.error(err));
// 	runSubmissionWorker(submissionWorkerClient).catch((err) => console.error(err));
// }
