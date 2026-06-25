import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { problemService } from '$lib/server/services/problem.service';
import { submissionService } from '$lib/server/services/submission.service';
import { redis } from '$lib/server/redis';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(307, '/login');
	const problem = await problemService.getProblem(params.id);
	if (!problem) throw fail(404, 'Problem not found!');

	const statusKey = `submission:status:${locals.user.id}:${params.id}`;
	const status = await redis.get(statusKey);

	if (status === 'evaluating') {
		return {
			problem,
			evaluating: true,
			submission: null
		};
	}

	const submission = await submissionService.getLatestSubmission(locals.user.id, params.id);
	return {
		problem,
		evaluating: false,
		submission
	};
};
