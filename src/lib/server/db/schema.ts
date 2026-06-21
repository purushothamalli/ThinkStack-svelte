import { relations } from 'drizzle-orm';
import {
	boolean,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar
} from 'drizzle-orm/pg-core';

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

export type newPasswordResetToken = typeof passwordResetTokens.$inferInsert;
export type passwordResetToken = typeof passwordResetTokens.$inferSelect;

export const difficultyEnum = pgEnum('difficulty_enum', ['easy', 'medium', 'hard']);

export const problems = pgTable('problems', {
	id: uuid().primaryKey().defaultRandom(),
	title: varchar({ length: 255 }).notNull(),
	description: text().notNull(),
	difficulty: difficultyEnum().notNull(),
	category: varchar({ length: 255 }).notNull(),
	referenceSolution: text().notNull(),
	hints: text().array().notNull(),
	isActive: boolean().default(true),
	createdAt: timestamp().defaultNow()
});

export type newProblem = typeof problems.$inferInsert;
export type problem = typeof problems.$inferSelect;
export type difficultyLevel = (typeof difficultyEnum.enumValues)[number];

export const drafts = pgTable('drafts', {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	problemId: uuid()
		.notNull()
		.references(() => problems.id, { onDelete: 'cascade' }),
	currentStep: varchar({ length: 255 }).notNull(),
	understanding: text().notNull().default(''),
	breakdown: text().notNull().default(''),
	approach: text().notNull().default(''),
	solution: text().notNull().default(''),
	reflection: text().notNull().default(''),
	hintsUsed: integer().notNull().default(0),
	createdAt: timestamp().notNull().defaultNow(),
	updatedAt: timestamp().notNull().defaultNow()
});

export type newDraft = typeof drafts.$inferInsert;
export type draft = typeof drafts.$inferSelect;

export const submissions = pgTable('submissions', {
	id: uuid().primaryKey().defaultRandom(),
	userId: uuid()
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	problemId: uuid()
		.notNull()
		.references(() => problems.id, { onDelete: 'cascade' }),
	hintsUsed: integer().notNull().default(0),
	penaltyApplied: integer().notNull().default(0),
	finalScore: integer().notNull().default(0),
	mistakeTags: text().array().notNull().default([]),
	thinkingPatterns: text().array().notNull().default([]),
	createdAt: timestamp().notNull().defaultNow()
});

export const stepScores = pgTable('step_scores', {
	id: uuid().primaryKey().defaultRandom(),
	submissionId: uuid()
		.notNull()
		.references(() => submissions.id, { onDelete: 'cascade' }),
	understanding: text().notNull().default(''),
	understandingScore: integer().notNull().default(0),
	breakdown: text().notNull().default(''),
	breakdownScore: integer().notNull().default(0),
	approach: text().notNull().default(''),
	approachScore: integer().notNull().default(0),
	solution: text().notNull().default(''),
	solutionScore: integer().notNull().default(0),
	reflection: text().notNull().default(''),
	reflectionScore: integer().notNull().default(0)
});

export const expertComparisons = pgTable('expert_comparisons', {
	id: uuid().primaryKey().defaultRandom(),
	submissionId: uuid()
		.notNull()
		.references(() => submissions.id, { onDelete: 'cascade' }),
	expertUnderstanding: text().notNull().default(''),
	expertReasoningFlow: text().notNull().default(''),
	strengths: text().notNull().default(''),
	weaknesses: text().notNull().default(''),
	howToImprove: text().notNull().default('')
});

export type submission = typeof submissions.$inferSelect;
export type stepScore = typeof stepScores.$inferSelect;
export type expertComparison = typeof expertComparisons.$inferSelect;

export const submissionRelations = relations(submissions, ({ one }) => ({
	user: one(users, {
		fields: [submissions.userId],
		references: [users.id]
	}),
	problem: one(problems, {
		fields: [submissions.problemId],
		references: [problems.id]
	}),
	stepScores: one(stepScores),
	expertComparisons: one(expertComparisons)
}));

export const stepScoresRelations = relations(stepScores, ({ one }) => ({
	submission: one(submissions, {
		fields: [stepScores.submissionId],
		references: [submissions.id]
	})
}));
export const expertComparisonsRelations = relations(expertComparisons, ({ one }) => ({
	submission: one(submissions, {
		fields: [expertComparisons.submissionId],
		references: [submissions.id]
	})
}));
