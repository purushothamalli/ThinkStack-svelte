import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { authService } from '$lib/server/services/auth.service';
import { deleteCookies } from '$lib/server/utils/cookies';
import { submissionService } from '$lib/server/services/submission.service.js';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(307, '/login');
	return {
		dashboard: await submissionService.getUserDashboardData(locals.user.id),
		user: locals.user
	};
};

export const actions = {
	logout: async ({ cookies, locals }) => {
		if (locals.session?.id) await authService.logout(locals.session.id);
		deleteCookies(cookies);
		throw redirect(303, '/login');
	}
};
