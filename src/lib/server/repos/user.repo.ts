import { Prisma, type User } from '@prisma/client';
import { prisma } from '../../../../prisma';

export type UserWithoutPassword = Omit<User, 'passwordHash'>;
type NewUser = Prisma.UserCreateInput;

export interface IUserRepository {
	findByEmail(email: string): Promise<User | null>;
	findById(id: string): Promise<User | null>;
	createUser(user: NewUser): Promise<UserWithoutPassword>;
	updatePassword(userId: string, newPasswordHash: string): Promise<UserWithoutPassword>;
	updateProfile(userId: string, firstName: string, lastName: string): Promise<UserWithoutPassword>;
	updateProfilePic(userId: string, profilePic: string): Promise<UserWithoutPassword>;
}

class PrismaUserRepository implements IUserRepository {
	public async findByEmail(email: string): Promise<User | null> {
		return await prisma.user.findUnique({
			where: {
				email
			}
		});
	}
	public async findById(id: string): Promise<User | null> {
		return await prisma.user.findUnique({
			where: {
				id
			}
		});
	}
	public async createUser(user: NewUser): Promise<UserWithoutPassword> {
		return await prisma.user.create({
			data: user,
			omit: { passwordHash: true }
		});
	}
	public async updatePassword(
		userId: string,
		newPasswordHash: string
	): Promise<UserWithoutPassword> {
		return await prisma.user.update({
			where: { id: userId },
			data: { passwordHash: newPasswordHash },
			omit: { passwordHash: true }
		});
	}
	public async updateProfile(
		userId: string,
		firstName: string,
		lastName: string
	): Promise<UserWithoutPassword> {
		return await prisma.user.update({
			where: { id: userId },
			data: { firstName, lastName },
			omit: { passwordHash: true }
		});
	}
	public async updateProfilePic(userId: string, profilePic: string): Promise<UserWithoutPassword> {
		return await prisma.user.update({
			where: { id: userId },
			data: { profilePic },
			omit: { passwordHash: true }
		});
	}
}

export const userRepo: IUserRepository = new PrismaUserRepository();

// export const userRepo = {
// 	findByEmail: async (email: string): Promise<User | null> => {
// 		return await prisma.user.findUnique({
// 			where: {
// 				email
// 			}
// 		});
// 	},
// 	findById: async (id: string) => {
// 		return await prisma.user.findUnique({
// 			where: {
// 				id
// 			}
// 		});
// 	},
// 	createUser: async (user: NewUser): Promise<UserWithoutPassword> => {
// 		return await prisma.user.create({
// 			data: user,
// 			omit: { passwordHash: true }
// 		});
// 	},
// 	updatePassword: async (userId: string, newPasswordHash: string): Promise<UserWithoutPassword> => {
// 		return await prisma.user.update({
// 			where: { id: userId },
// 			data: { passwordHash: newPasswordHash },
// 			omit: { passwordHash: true }
// 		});
// 	},
// 	updateProfile: async (
// 		userId: string,
// 		firstName: string,
// 		lastName: string
// 	): Promise<UserWithoutPassword> => {
// 		return await prisma.user.update({
// 			where: { id: userId },
// 			data: { firstName, lastName },
// 			omit: { passwordHash: true }
// 		});
// 	},
// 	updateProfilePic: async (userId: string, profilePic: string): Promise<UserWithoutPassword> => {
// 		return await prisma.user.update({
// 			where: { id: userId },
// 			data: { profilePic },
// 			omit: { passwordHash: true }
// 		});
// 	}
// };
