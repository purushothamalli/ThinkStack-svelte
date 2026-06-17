import { authService } from '$lib/server/services/auth.service';
import { setCookies } from '$lib/server/utils/cookies';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import z from 'zod';

const registerSchema = z.object({
	firstname: z.string().min(4, 'First name must be atleast 4 characters!').trim(),
	lastname: z.string().min(4, 'First name must be atleast 4 characters!').trim(),
	email: z.email('Invalid email!'),
	password: z.string().min(4, 'Password must be more than 4 chars')
});

export const actions: Actions = {
	register: async ({ cookies, request }) => {
		let success = false;
		try {
			const data = await request.formData();
			registerSchema.parse(Object.fromEntries(data));
			const firstname = data.get('firstname') as string;
			const lastname = data.get('lastname') as string;
			const email = data.get('email') as string;
			const password = data.get('password') as string;
			const userAgent = request.headers.get('user-agent') || '';
			const res = await authService.register(firstname, lastname, email, password, userAgent);
			setCookies(cookies, res.accessToken, res.refreshToken);
			if (res.user) success = true;
		} catch (error: unknown) {
			if (error instanceof z.ZodError) {
				const fieldErrors = error.flatten().fieldErrors;
				return fail(400, { errors: fieldErrors });
			}
			return fail(400, { message: (error as Error).message });
		}
		if (success) return redirect(303, '/home');
	}
};
