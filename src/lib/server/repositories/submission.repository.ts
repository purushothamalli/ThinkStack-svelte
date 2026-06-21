import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import {
	drafts,
	expertComparisons,
	stepScores,
	submissions,
	type expertComparison,
	type stepScore,
	type submission
} from '../db/schema';

export const submissionRepository = {
	saveSubmission: async (
		submission: Omit<submission, 'id' | 'createdAt'>,
		stepScore: Omit<stepScore, 'id' | 'submissionId'>,
		expertComparison: Omit<expertComparison, 'id' | 'submissionId'>
	) => {
		const sub = (await db.insert(submissions).values(submission).returning())[0];
		await db
			.insert(stepScores)
			.values({ submissionId: sub.id, ...stepScore })
			.returning();
		await db
			.insert(expertComparisons)
			.values({ submissionId: sub.id, ...expertComparison })
			.returning();
		await db
			.delete(drafts)
			.where(and(eq(drafts.userId, submission.userId), eq(drafts.problemId, submission.problemId)));
		return sub;
	},
	getSubmission: async (userId: string, problemId: string) => {
		return await db.query.submissions.findFirst({
			where: (columns, { and, eq }) =>
				and(eq(columns.userId, userId), eq(columns.problemId, problemId)),
			orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
			with: {
				stepScores: true,
				expertComparisons: true
			}
		});
	}
};
