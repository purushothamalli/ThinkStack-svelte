import { redirect, fail, type Actions, type Cookies } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import z from 'zod';
import { authService } from '$lib/server/services/auth.service';
import { deleteCookies } from '$lib/server/utils/cookies';

export const load: PageServerLoad = ({ locals }: { locals: App.Locals }) => {
	if (!locals.user) redirect(307, '/login');
};

const changePasswordSchema = z.object({
	currentPassword: z.string().min(4, 'Password must be more than 4 chars!'),
	newPassword: z.string().min(4, 'Confirm password must be more than 4 chars!')
});

export const actions: Actions = {
	changePassword: async ({
		request,
		locals,
		cookies
	}: {
		request: Request;
		locals: App.Locals;
		cookies: Cookies;
	}) => {
		let res;
		try {
			const data = await request.formData();
			changePasswordSchema.parse(Object.fromEntries(data));
			const currentPassword = data.get('currentPassword') as string;
			const newPassword = data.get('newPassword') as string;
			res = await authService.changePassword(
				locals.user?.id as string,
				currentPassword,
				newPassword
			);
			deleteCookies(cookies);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors = error.flatten().fieldErrors;
				return fail(400, { errors: fieldErrors });
			}
			return fail(400, { message: (error as Error).message });
		}
		if (res.Success) {
			console.log(res);
			throw redirect(303, '/login');
		}
	}
};
