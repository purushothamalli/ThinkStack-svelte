import { prisma } from '../../../../prisma';
import type { Prisma } from '@prisma/client';

type newPasswordResetToken = Prisma.PasswordResetTokenUncheckedCreateInput;

export const passwordResetTokenRepo = {
	createPasswordResetToken: async (data: newPasswordResetToken) => {
		return await prisma.passwordResetToken.create({
			data
		});
	},
	findActiveByHash: async (token: string) => {
		return await prisma.passwordResetToken.findFirst({
			where: {
				tokenHash: {
					equals: token
				},
				expiresAt: {
					gt: new Date(Date.now())
				}
			}
		});
	},
	deleteByUserId: async (userId: string) => {
		return await prisma.passwordResetToken.deleteMany({
			where: { userId }
		});
	},
	deletePasswordToken: async (tokenEntryId: string) => {
		return await prisma.passwordResetToken.delete({
			where: { id: tokenEntryId }
		});
	}
};
