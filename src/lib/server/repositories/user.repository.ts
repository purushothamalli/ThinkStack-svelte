import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type newUser, type user } from '../db/schema';

export const userRepository = {
	findByEmail: async (email: string): Promise<user> => {
		return (await db.select().from(users).where(eq(users.email, email)))[0];
	},
	findById: async (id: string): Promise<user> => {
		return (await db.select().from(users).where(eq(users.id, id)))[0];
	},
	createUser: async (user: newUser): Promise<Omit<user, 'passwordHash'>> => {
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
	}
};
