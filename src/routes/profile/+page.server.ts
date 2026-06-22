import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import z from 'zod';
import { authService } from '$lib/server/services/auth.service';
import { userService } from '$lib/server/services/user.service';
import { deleteCookies } from '$lib/server/utils/cookies';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) throw redirect(307, '/login');
};

const changePasswordSchema = z.object({
	currentPassword: z.string().min(4, 'Password must be more than 4 chars!'),
	newPassword: z.string().min(4, 'Confirm password must be more than 4 chars!')
});

const updateProfileSchema = z.object({
	firstName: z.string().trim().min(4, 'First name should be more than 4 chars!'),
	lastName: z.string().trim().min(4, 'Last name should be more than 4 chars!')
});

export const actions: Actions = {
	changePassword: async ({ request, locals, cookies }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in to change your password.' });
		}
		let res;
		try {
			const data = await request.formData();
			changePasswordSchema.parse(Object.fromEntries(data));
			const currentPassword = data.get('currentPassword') as string;
			const newPassword = data.get('newPassword') as string;
			res = await authService.changePassword(locals.user.id, currentPassword, newPassword);
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
		}
		return fail(400, { message: 'Failed to update password.' });
	},
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in to update your profile.' });
		}
		try {
			const data = await request.formData();
			const parsed = updateProfileSchema.parse(Object.fromEntries(data));
			await userService.updateProfile(locals.user.id, parsed.firstName, parsed.lastName);
			return { success: true };
		} catch (error) {
			if (error instanceof z.ZodError) {
				return fail(400, { errors: error.flatten().fieldErrors });
			}
			return fail(400, { message: (error as Error).message });
		}
	},
	updateProfilePic: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'You must be logged in to upload a profile picture.' });
		}
		try {
			const data = await request.formData();
			const file = data.get('profilePic') as File;
			if (!file || file.size === 0) {
				return fail(400, { message: 'Please select an image file to upload.' });
			}
			if (!file.type.startsWith('image/')) {
				return fail(400, { message: 'Uploaded file must be a valid image.' });
			}
			if (file.size > 2 * 1024 * 1024) {
				return fail(400, { message: 'Image must be smaller than 2MB.' });
			}
			await userService.updateProfilePic(locals.user.id, file);
			return { success: true };
		} catch (error) {
			return fail(500, { message: (error as Error).message });
		}
	}
};
