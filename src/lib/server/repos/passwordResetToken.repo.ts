import { prisma } from '../../../../prisma';
import type { Prisma, PasswordResetToken } from '@prisma/client';

type NewPasswordResetToken = Prisma.PasswordResetTokenUncheckedCreateInput;

export interface IPasswordResetTokenRepository {
	createPasswordResetToken(data: NewPasswordResetToken): Promise<PasswordResetToken>;
	findActiveByHash(token: string): Promise<PasswordResetToken | null>;
	deleteByUserId(userId: string): Promise<void>;
	deletePasswordToken(tokenEntryId: string): Promise<PasswordResetToken>;
}

class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
	public async createPasswordResetToken(data: NewPasswordResetToken): Promise<PasswordResetToken> {
		return await prisma.passwordResetToken.create({
			data
		});
	}
	public async findActiveByHash(token: string): Promise<PasswordResetToken | null> {
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
	}
	public async deleteByUserId(userId: string): Promise<void> {
		await prisma.passwordResetToken.deleteMany({
			where: { userId }
		});
	}
	public async deletePasswordToken(tokenEntryId: string): Promise<PasswordResetToken> {
		return await prisma.passwordResetToken.delete({
			where: { id: tokenEntryId }
		});
	}
}

export const passwordResetTokenRepo: IPasswordResetTokenRepository =
	new PrismaPasswordResetTokenRepository();

// export const passwordResetTokenRepo = {
// 	createPasswordResetToken: async (data: NewPasswordResetToken) => {
// 		return await prisma.passwordResetToken.create({
// 			data
// 		});
// 	},
// 	findActiveByHash: async (token: string) => {
// 		return await prisma.passwordResetToken.findFirst({
// 			where: {
// 				tokenHash: {
// 					equals: token
// 				},
// 				expiresAt: {
// 					gt: new Date(Date.now())
// 				}
// 			}
// 		});
// 	},
// 	deleteByUserId: async (userId: string) => {
// 		await prisma.passwordResetToken.deleteMany({
// 			where: { userId }
// 		});
// 	},
// 	deletePasswordToken: async (tokenEntryId: string) => {
// 		return await prisma.passwordResetToken.delete({
// 			where: { id: tokenEntryId }
// 		});
// 	}
// };
