import { redis } from '$lib/server/redis';
import { problemService } from '$lib/server/services/problem.service';
import { submissionService } from '$lib/server/services/submission.service';
import { describe, expect, test, vi } from 'vitest';
import { load } from './+page.server';

vi.mock('$lib/server/services/problem.service', () => ({
	problemService: {
		getProblem: vi.fn()
	}
}));

vi.mock('$lib/server/services/submission.service', () => ({
	submissionService: {
		getLatestSubmission: vi.fn()
	}
}));

vi.mock('$lib/server/redis', () => ({
	redis: {
		get: vi.fn()
	}
}));

describe('results/+page.server.ts', () => {
	test('should throw a redirect error to login if user is not authenticated', async () => {
		await expect(load({ locals: {}, params: { id: 'fake-problemId' } })).rejects.toThrow();
	});

	test('should return evaluating true and null submission when redis state is evaluating', async () => {
		const Problem = vi.mocked(problemService.getProblem).mockResolvedValue({
			id: 'fake-problemId',
			title: 'fake-problem',
			description: 'fake-problem',
			difficulty: 'hard',
			category: 'fake',
			referenceSolution: 'fake-fake-fake'
		});
		const problem = await Problem('fake-problemId');
		vi.mocked(redis.get).mockResolvedValue('evaluating');
		const res = await load({
			locals: { user: { id: 'fake-userId' } },
			params: { id: 'fake-problemId' }
		});
		expect(res).toMatchObject({
			problem,
			evaluating: true,
			submission: null
		});
	});

	test('should return evaluating false and load the latest submission from database when completed', async () => {
		const Submission = vi.mocked(submissionService.getLatestSubmission).mockResolvedValue({
			userId: 'fake-userId',
			problemId: 'fake-problemId',
			stepScores: null,
			expertComparisons: null,
			id: 'fake-submissionId',
			createdAt: new Date(Date.now()),
			hintsUsed: 0,
			penaltyApplied: 0,
			finalScore: 0,
			mistakeTags: [],
			thinkingPatterns: []
		});
		const Problem = vi.mocked(problemService.getProblem).mockResolvedValue({
			id: 'fake-problemId',
			title: 'fake-problem',
			description: 'fake-problem',
			difficulty: 'hard',
			category: 'fake',
			referenceSolution: 'fake-fake-fake'
		});
		vi.mocked(redis.get).mockResolvedValue(null);
		const problem = await Problem('fake-problemId');
		const submission = await Submission('fake-userId', 'fake-problemId');

		const res = await load({
			locals: { user: { id: 'fake-userId' } },
			params: { id: 'fake-problemId' }
		});

		expect(res).toMatchObject({ problem, evaluating: false, submission });
	});
});
