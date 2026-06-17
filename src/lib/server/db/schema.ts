import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid().primaryKey().defaultRandom(),
	firstName: varchar({ length: 255 }).notNull(),
	lastName: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).unique().notNull(),
	passwordHash: text().notNull(),
	profilePic: text(),
	createdAt: timestamp().notNull().defaultNow()
});

export type newUser = typeof users.$inferInsert;
export type user = typeof users.$inferSelect;

export const userRelations = relations(users, ({ many }) => ({
	sessions: many(sessions)
}));

export const sessions = pgTable('sessions', {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	refreshTokenHash: text().notNull(),
	expiresAt: timestamp().notNull(),
	userAgent: text(),
	createdAt: timestamp().defaultNow()
});

export type newSession = typeof sessions.$inferInsert;
export type Session = typeof sessions.$inferSelect;

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const passwordResetTokens = pgTable('password_reset_tokens', {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	tokenHash: text().notNull(),
	expiresAt: timestamp().notNull(),
	createdAt: timestamp().notNull().defaultNow()
});
