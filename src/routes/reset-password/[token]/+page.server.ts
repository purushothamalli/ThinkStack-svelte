import { authService } from '$lib/server/services/auth.service';
import { deleteCookies } from '$lib/server/utils/cookies';
import { fail, redirect } from '@sveltejs/kit';
import z from 'zod';
import type { PageServerLoad, Actions } from './$types';
import { passwordResetTokenRepository } from '$lib/server/repositories/passwordResetToken.repository';
import crypto from 'crypto';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (locals.user) {
		throw redirect(307, '/home');
	}
	const hashedToken = crypto.createHash('sha256').update(params.token).digest('hex');
	const match = await passwordResetTokenRepository.findActiveByHash(hashedToken);
	if (!match) throw redirect(307, '/login');
};

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
	default: async ({ request, params, cookies }) => {
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
			throw redirect(303, '/login');
		} else return { message: 'Password Reset failed!' };
	}
};
