import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { problemService } from '$lib/server/services/problem.service';
import z from 'zod';

const difficultySchema = z.enum(['easy', 'medium', 'hard']).optional().nullable();

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) throw redirect(307, '/login');
	const rawdifficulty = url.searchParams.get('difficulty');
	const difficulty = difficultySchema.safeParse(rawdifficulty).success
		? (rawdifficulty as 'easy' | 'medium' | 'hard')
		: undefined;
	const problems = await problemService.getProblems(difficulty);
	return {
		problems
	};
};
