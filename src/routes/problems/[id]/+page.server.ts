import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { problemService } from '$lib/server/services/problem.service';
import { draftService } from '$lib/server/services/draft.service';
import z from 'zod';
import { submissionService } from '$lib/server/services/submission.service';
import { isRateLimited } from '$lib/server/redis/rateLimiter';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(307, '/login');
	const data = await Promise.all([
		problemService.getProblem(params.id),
		draftService.getDraft(locals.user.id, params.id)
	]);
	if (!data[0]) throw fail(404, 'Problem not found!');
	return {
		problem: data[0],
		draft: data[1]
	};
};

const draftSchema = z.object({
	problemId: z.string().uuid('Invalid problem ID format'),
	activeStep: z.enum(['understanding', 'breakdown', 'approach', 'solution', 'reflection']),
	isHintUsed: z.preprocess((val) => val === 'true', z.boolean()),
	content: z
		.string({ error: 'Response content is required' })
		.trim()
		.min(40, 'Response must be at least 40 characters long to show your thinking.')
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in to save drafts.' });
		}
		try {
			const data = await request.formData();
			const parsed = draftSchema.parse(Object.fromEntries(data));
			await draftService.saveDraft(
				locals.user.id,
				parsed.problemId,
				parsed.activeStep,
				parsed.content,
				parsed.isHintUsed
			);
			if (parsed.activeStep === 'reflection') {
				const limited = await isRateLimited(locals.user.id, 'submit', 30);
				if (limited)
					return fail(429, { message: 'You are submitting too fast! Wait for 30 seconds.' });
				await submissionService.submitSolution(locals.user.id, parsed.problemId);
			}
			return { success: true };
		} catch (error) {
			if (error instanceof z.ZodError) {
				return fail(400, { errors: error.flatten().fieldErrors });
			}
			return fail(500, { message: (error as Error).message });
		}
	}
};
