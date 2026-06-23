import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { problemService } from '$lib/server/services/problem.service';
import { submissionService } from '$lib/server/services/submission.service';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) throw redirect(307, '/login');
	const problem = await problemService.getProblem(params.id);
	if (!problem) throw fail(404, 'Problem not found!');
	return {
		problem,
		submission: submissionService.getLatestSubmission(locals.user.id, params.id)
	};
};
