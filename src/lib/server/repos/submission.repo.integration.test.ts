import { afterAll, beforeEach, describe, expect, test } from 'vitest';
import cleanDatabase from '../utils/db-clean';
import { prisma } from '../../../../prisma';
import { submissionRepo } from './submission.repo';
import type { Problem, User } from '@prisma/client';

describe('submissionRepo', () => {
	let user: User, problem: Problem;
	beforeEach(async () => {
		await cleanDatabase();
		user = await prisma.user.create({
			data: {
				id: '8364657f-ad38-468e-973f-af703e4126a4',
				email: 'fake-user-email@gmail.com',
				firstName: 'fake',
				lastName: 'user',
				passwordHash: 'fake_password_hash'
			}
		});
		problem = await prisma.problem.create({
			data: {
				id: 'b87fe666-f976-4812-bf00-e8a6e9dd09f0',
				title: 'fake-problem',
				description: 'This is a fake problem created for integration testing purpose!',
				category: 'fake-fake-test',
				difficulty: 'medium',
				referenceSolution:
					'You should have known that this is a fake problem and solution is a fake solution',
				hints: ['fake-hint-1', 'fake-hint-2', 'fake-hint-3']
			}
		});
	});
	afterAll(async () => {
		await prisma.$disconnect();
	});

	test('should save submission and delete draft in transaction', async () => {
		const draft = await prisma.draft.create({
			data: {
				id: '6c2640f8-11fe-4a39-8659-b7d60ddd7db2',
				userId: user.id,
				problemId: problem.id,
				currentStep: 'reflection',
				understanding: 'fake-understanding',
				breakdown: 'fake-breakdown',
				approach: 'fake-approach',
				solution: 'fake-solution',
				reflection: 'fake-reflection'
			}
		});
		const submission = await submissionRepo.saveSubmission(
			{
				userId: user.id,
				problemId: problem.id,
				hintsUsed: 0,
				penaltyApplied: 0,
				finalScore: 80
			},
			{
				understanding: draft.understanding,
				understandingScore: 16,
				breakdown: draft.breakdown,
				breakdownScore: 16,
				approach: draft.approach,
				approachScore: 16,
				solution: draft.solution,
				solutionScore: 16,
				reflection: draft.reflection,
				reflectionScore: 16
			},
			{
				expertUnderstanding: 'dummy expert knows this is test case',
				expertReasoningFlow: 'dummy expert first evaluates that this can exist in real life???',
				strengths: 'You identified fake constratints',
				weaknesses: "You haven't been able to distinguish tests",
				howToImprove: 'You should work hard on faking'
			}
		);
		expect(submission.id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
		);
		const deletedDraft = await prisma.draft.findUnique({
			where: { userId_problemId: { userId: user.id, problemId: problem.id } }
		});
		expect(deletedDraft).toBeNull();
		const fullSubmission = await prisma.submission.findUnique({
			where: { id: submission.id },
			include: {
				stepScores: true,
				expertComparisons: true
			}
		});
		expect(fullSubmission?.stepScores).toMatchObject({
			id: expect.any(String),
			submissionId: submission.id,
			understanding: draft.understanding,
			understandingScore: 16,
			breakdown: draft.breakdown,
			breakdownScore: 16,
			approach: draft.approach,
			approachScore: 16,
			solution: draft.solution,
			solutionScore: 16,
			reflection: draft.reflection,
			reflectionScore: 16
		});
		expect(fullSubmission?.expertComparisons).toMatchObject({
			id: expect.any(String),
			submissionId: submission.id,
			expertUnderstanding: 'dummy expert knows this is test case',
			expertReasoningFlow: 'dummy expert first evaluates that this can exist in real life???',
			strengths: 'You identified fake constratints',
			weaknesses: "You haven't been able to distinguish tests",
			howToImprove: 'You should work hard on faking'
		});
	});

	test('should rollback submission save and write zero records when no draft exists', async () => {
		await expect(
			submissionRepo.saveSubmission(
				{
					userId: user.id,
					problemId: problem.id,
					hintsUsed: 0,
					penaltyApplied: 0,
					finalScore: 80
				},
				{
					understanding: 'draft.understanding',
					understandingScore: 16,
					breakdown: 'draft.breakdown',
					breakdownScore: 16,
					approach: 'draft.approach',
					approachScore: 16,
					solution: 'draft.solution',
					solutionScore: 16,
					reflection: 'draft.reflection',
					reflectionScore: 16
				},
				{
					expertUnderstanding: 'dummy expert knows this is test case',
					expertReasoningFlow: 'dummy expert first evaluates that this can exist in real life???',
					strengths: 'You identified fake constratints',
					weaknesses: "You haven't been able to distinguish tests",
					howToImprove: 'You should work hard on faking'
				}
			)
		).rejects.toThrow();
		const submissionsCount = await prisma.submission.aggregate({
			_count: { _all: true }
		});
		expect(submissionsCount._count._all).toBe(0);
	});
});
