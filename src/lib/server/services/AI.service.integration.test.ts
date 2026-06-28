import { describe, test, beforeEach, afterAll, expect, beforeAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { prisma } from '../../../../prisma';
import cleanDatabase from '../utils/db-clean';

let AIService: any;
const server = setupServer(
	http.post('https://api.groq.com/openai/v1/chat/completions', () => {
		return HttpResponse.json({
			choices: [
				{
					message: {
						content: JSON.stringify({
							stepScores: {
								understanding: 16,
								breakdown: 16,
								approach: 16,
								solution: 16,
								reflection: 16
							},
							aiBaseScore: 80,
							thinkingPatterns: [
								'systematic_reasoning',
								'brute_force_thinking',
								'skipped_constraints'
							],
							mistakeTags: ['missed_edge_cases', 'poor_reasoning', 'shallow_analysis'],
							expertComparison: {
								expertUnderstanding: 'fake_expert_understanding',
								expertReasoningFlow: 'fake_expert_reasoning_flow'
							},
							feedback: {
								strengths: 'fake_strengths',
								weaknesses: 'fake_weaknesses',
								howToImprove: 'fake_how_to_improve'
							}
						})
					}
				}
			]
		});
	})
);

describe('AIService.evaluateSubmission', () => {
	beforeEach(async () => await cleanDatabase());
	beforeAll(async () => {
		server.listen();
		AIService = (await import('./AI.service')).AIService;
	});
	afterEach(() => server.resetHandlers());
	afterAll(async () => {
		server.close();
		await prisma.$disconnect();
	});

	test('should successfully request evaluation and parse response from the intercepted HTTP endpoint', async () => {
		const user = await prisma.user.create({
			data: {
				id: '8364657f-ad38-468e-973f-af703e4126a4',
				email: 'fake-user-email@gmail.com',
				firstName: 'fake',
				lastName: 'user',
				passwordHash: 'fake_password_hash'
			}
		});
		const problem = await prisma.problem.create({
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
		const res = await AIService.evaluatesubmission(problem, draft);
		expect(res).toMatchObject({
			stepScores: {
				understanding: 16,
				breakdown: 16,
				approach: 16,
				solution: 16,
				reflection: 16
			},
			aiBaseScore: 80,
			thinkingPatterns: ['systematic_reasoning', 'brute_force_thinking', 'skipped_constraints'],
			mistakeTags: ['missed_edge_cases', 'poor_reasoning', 'shallow_analysis'],
			expertComparison: {
				expertUnderstanding: 'fake_expert_understanding',
				expertReasoningFlow: 'fake_expert_reasoning_flow'
			},
			feedback: {
				strengths: 'fake_strengths',
				weaknesses: 'fake_weaknesses',
				howToImprove: 'fake_how_to_improve'
			}
		});
	});
});
