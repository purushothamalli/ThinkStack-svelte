import { authService } from '$lib/server/services/auth.service';
import { deleteCookies } from '$lib/server/utils/cookies';
import { fail, redirect, type Actions, type Cookies } from '@sveltejs/kit';
import z from 'zod';

const resetPasswordSchema = z
	.object({
		password: z.string().min(4, 'Password must be more than 4 chars!'),
		confirmPassword: z.string().min(4, 'Confirm password must be more than 4 chars!')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match!",
		path: ['confirmPassword']
	});

export const actions: Actions = {
	resetPassword: async ({
		request,
		params,
		cookies
	}: {
		request: Request;
		params: Record<string, string>;
		cookies: Cookies;
	}) => {
		let res;
		try {
			const data = await request.formData();
			resetPasswordSchema.parse(Object.fromEntries(data));
			const password = data.get('password') as string;
			res = await authService.resetPassword(params.token, password);
			deleteCookies(cookies);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors = error.flatten().fieldErrors;
				return fail(400, { errors: fieldErrors });
			}
			return fail(400, { message: (error as Error).message });
		}
		if (res.Success) {
			return redirect(303, '/login');
		} else return { message: 'Password Reset failed!' };
	}
};
