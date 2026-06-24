import { redis } from '../redis';
import { userRepo } from '../repos/user.repo';
import { cloudinary } from '../utils/cloudinary';

export const userService = {
	updateProfile: async (userId: string, firstName: string, lastName: string): Promise<void> => {
		await userRepo.updateProfile(userId, firstName, lastName);
		try {
			await redis.del(`user:session:${userId}`);
		} catch (error) {
			console.log('Redis delete error: ', error);
		}
	},
	updateProfilePic: async (userId: string, file: Blob): Promise<void> => {
		const fil = await file.arrayBuffer();
		const base64String = Buffer.from(fil).toString('base64');
		const str = 'data:' + file.type + ';base64,' + base64String;
		const res = await cloudinary.uploader.upload(str, {
			folder: 'thinkstack/avatars',
			public_id: 'pfp-' + userId,
			overwrite: true,
			invalidate: true
		});
		await userRepo.updateProfilePic(userId, res.secure_url);
		try {
			await redis.del(`user:session:${userId}`);
		} catch (error) {
			console.log('Redis delete error: ', error);
		}
	}
};
