import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { authService } from '$lib/server/services/auth.service';
import { deleteCookies } from '$lib/server/utils/cookies';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(307, '/login');
};

export const actions: Actions = {
	logout: async ({ cookies, locals }) => {
		if (locals.session?.id) await authService.logout(locals.session.id);
		deleteCookies(cookies);
		throw redirect(303, '/login');
	}
};
