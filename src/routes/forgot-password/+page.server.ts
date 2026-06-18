import { authService } from '$lib/server/services/auth.service';
import { fail, type Actions } from '@sveltejs/kit';
import z from 'zod';

const forgotPasswordSchema = z.object({
	email: z.email('Invalid email!')
});

export const actions: Actions = {
	forgotPassword: async ({ request }: { request: Request }) => {
		try {
			const data = await request.formData();
			forgotPasswordSchema.parse(Object.fromEntries(data));
			const email = data.get('email') as string;
			const res = await authService.forgotPassword(email);
			if (res.Success) return { message: 'Successfully sent mail to mail Id: ' + email };
			else return { message: 'Reset Password failed!' };
		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldErrors = error.flatten().fieldErrors;
				return fail(400, { errors: fieldErrors });
			}
			return fail(400, { message: (error as Error).message });
		}
	}
};
