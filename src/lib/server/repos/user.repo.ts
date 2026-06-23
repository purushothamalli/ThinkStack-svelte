import { Prisma, type User } from '@prisma/client';
import { prisma } from '../../../../prisma';

type userWithoutPassword = Omit<User, 'passwordHash'>;
type newUser = Prisma.UserCreateInput;

export const userRepo = {
	findByEmail: async (email: string): Promise<User | null> => {
		return await prisma.user.findUnique({
			where: {
				email
			}
		});
	},
	findById: async (id: string) => {
		return await prisma.user.findUnique({
			where: {
				id
			}
		});
	},
	createUser: async (user: newUser): Promise<userWithoutPassword> => {
		return await prisma.user.create({
			data: user,
			omit: { passwordHash: true }
		});
	},
	updatePassword: async (userId: string, newPasswordHash: string): Promise<userWithoutPassword> => {
		return await prisma.user.update({
			where: { id: userId },
			data: { passwordHash: newPasswordHash },
			omit: { passwordHash: true }
		});
	},
	updateProfile: async (
		userId: string,
		firstName: string,
		lastName: string
	): Promise<userWithoutPassword> => {
		return await prisma.user.update({
			where: { id: userId },
			data: { firstName, lastName },
			omit: { passwordHash: true }
		});
	},
	updateProfilePic: async (userId: string, profilePic: string): Promise<userWithoutPassword> => {
		return await prisma.user.update({
			where: { id: userId },
			data: { profilePic },
			omit: { passwordHash: true }
		});
	}
};
