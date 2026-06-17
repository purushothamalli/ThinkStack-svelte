import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, type newUser } from '../db/schema';

export const userRepository = {
	findByEmail: async (email: string) => {
		return (await db.select().from(users).where(eq(users.email, email)))[0];
	},
	findById: async (id: string) => {
		return (await db.select().from(users).where(eq(users.id, id)))[0];
	},
	createUser: async (user: newUser) => {
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
