import { GROQ_API_KEY } from '$env/static/private';
import Groq from 'groq-sdk';
import z from 'zod';
import type { draft, problem } from '../db/schema';
import { getPrompt } from '../utils/getPrompt';

const groq = new Groq({
	apiKey: GROQ_API_KEY
});

const evaluationSchema = z.object({
	stepScores: z.object({
		understanding: z.number().int().gte(0).lte(20),
		breakdown: z.number().int().gte(0).lte(20),
		approach: z.number().int().gte(0).lte(20),
		solution: z.number().int().gte(0).lte(20),
		reflection: z.number().int().gte(0).lte(20)
	}),
	aiBaseScore: z.number().int().gte(0).lte(100),
	thinkingPatterns: z.array(z.string()),
	mistakeTags: z.array(z.string()),
	expertComparison: z.object({
		expertUnderstanding: z.string().min(4, { message: 'Should be greater than 4 chars!' }),
		expertReasoningFlow: z.string().min(4, { message: 'Should be greater than 4 chars!' })
	}),
	feedback: z.object({
		strengths: z.string().min(4, { message: 'Should be greater than 4 chars!' }),
		weaknesses: z.string().min(4, { message: 'Should be greater than 4 chars!' }),
		howToImprove: z.string().min(4, { message: 'Should be greater than 4 chars!' })
	})
});

export const AIService = {
	evaluatesubmission: async (problem: problem, draft: draft) => {
		const res = await groq.chat.completions.create({
			model: 'llama-3.3-70b-versatile',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'user',
					content: getPrompt(draft, problem)
				}
			],
			temperature: 0.3
		});
		const content = res.choices[0]?.message?.content;
		if (!content) {
			throw new Error('AI evaluator returned an empty response.');
		}
		const parsed = JSON.parse(content);
		return evaluationSchema.parse(parsed);
	}
};
