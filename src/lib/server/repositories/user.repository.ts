import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type newUser, type user } from '../db/schema';

type userWithoutPassword = Omit<user, 'passwordHash'>;

export const userRepository = {
	findByEmail: async (email: string): Promise<user> => {
		return (await db.select().from(users).where(eq(users.email, email)))[0];
	},
	findById: async (id: string): Promise<user> => {
		return (await db.select().from(users).where(eq(users.id, id)))[0];
	},
	createUser: async (user: newUser): Promise<userWithoutPassword> => {
		return (
			await db.insert(users).values(user).returning({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				profilePic: users.profilePic,
				createdAt: users.createdAt
			})
		)[0];
	},
	updatePassword: async (userId: string, newPasswordHash: string): Promise<userWithoutPassword> => {
		return (
			await db
				.update(users)
				.set({ passwordHash: newPasswordHash })
				.where(eq(users.id, userId))
				.returning({
					id: users.id,
					firstName: users.firstName,
					lastName: users.lastName,
					email: users.email,
					profilePic: users.profilePic,
					createdAt: users.createdAt
				})
		)[0];
	},
	updateProfile: async (
		userId: string,
		firstName: string,
		lastName: string
	): Promise<userWithoutPassword> => {
		return (
			await db.update(users).set({ firstName, lastName }).where(eq(users.id, userId)).returning({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				profilePic: users.profilePic,
				createdAt: users.createdAt
			})
		)[0];
	},
	updateProfilePic: async (userId: string, profilePic: string): Promise<userWithoutPassword> => {
		return (
			await db.update(users).set({ profilePic }).where(eq(users.id, userId)).returning({
				id: users.id,
				firstName: users.firstName,
				lastName: users.lastName,
				email: users.email,
				profilePic: users.profilePic,
				createdAt: users.createdAt
			})
		)[0];
	}
};
