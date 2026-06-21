import type { submission } from '../db/schema';
import { submissionRepository } from '../repositories/submission.repository';
import { AIService } from './AI.service';
import { draftService } from './draft.service';
import { problemService } from './problem.service';

const HINT_PENALTIES: Record<number, number> = {
	0: 0,
	1: 5,
	2: 10,
	3: 15
};

export const submissionService = {
	submitSolution: async (userId: string, problemId: string): Promise<submission> => {
		const data = await Promise.all([
			draftService.getDraft(userId, problemId),
			problemService.getProblem(problemId)
		]);
		const draft = data[0];
		const problem = data[1];
		if (!draft || !problem) throw new Error('No active draft found!');
		const res = await AIService.evaluatesubmission(problem, draft);
		const penaltyApplied = HINT_PENALTIES[draft.hintsUsed] ?? 0;
		const finalScore = Math.max(0, res.aiBaseScore - penaltyApplied);

		return await submissionRepository.saveSubmission(
			{
				userId,
				problemId,
				hintsUsed: draft.hintsUsed,
				penaltyApplied,
				finalScore,
				mistakeTags: res.mistakeTags,
				thinkingPatterns: res.thinkingPatterns
			},
			{
				understanding: draft.understanding,
				breakdown: draft.breakdown,
				approach: draft.approach,
				solution: draft.solution,
				reflection: draft.reflection,
				understandingScore: res.stepScores.understanding,
				breakdownScore: res.stepScores.breakdown,
				approachScore: res.stepScores.approach,
				solutionScore: res.stepScores.solution,
				reflectionScore: res.stepScores.reflection
			},
			{
				expertUnderstanding: res.expertComparison.expertUnderstanding,
				expertReasoningFlow: res.expertComparison.expertReasoningFlow,
				strengths: res.feedback.strengths,
				weaknesses: res.feedback.weaknesses,
				howToImprove: res.feedback.howToImprove
			}
		);
	},
	getLatestSubmission: async (userId: string, problemId: string) => {
		return await submissionRepository.getSubmission(userId, problemId);
	}
};
