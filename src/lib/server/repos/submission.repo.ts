import { prisma } from '../../../../prisma';
import type { Prisma } from '@prisma/client';

type submission = Prisma.SubmissionUncheckedCreateInput;
type stepScore = Prisma.StepScoreCreateWithoutSubmissionInput;
type expertComparison = Prisma.ExpertComparisonCreateWithoutSubmissionInput;

export const submissionRepo = {
	saveSubmission: async (
		submission: submission,
		stepScore: stepScore,
		expertComparison: expertComparison
	) => {
		const saveSubmissionTransaction = prisma.submission.create({
			data: {
				...submission,
				stepScores: {
					create: {
						...stepScore
					}
				},
				expertComparisons: {
					create: {
						...expertComparison
					}
				}
			}
		});
		return (
			await prisma.$transaction([
				saveSubmissionTransaction,
				prisma.draft.delete({
					where: {
						userId_problemId: {
							userId: submission.userId,
							problemId: submission.problemId
						}
					}
				})
			])
		)[0];
	},
	getSubmission: async (userId: string, problemId: string) => {
		return await prisma.submission.findFirst({
			where: {
				userId,
				problemId
			},
			orderBy: { createdAt: 'desc' },
			include: {
				stepScores: true,
				expertComparisons: true
			}
		});
	},
	getUserStats: async (userId: string) => {
		const agg = await prisma.submission.aggregate({
			where: { userId },
			_count: true,
			_avg: {
				finalScore: true
			},
			_sum: {
				hintsUsed: true
			}
		});
		return {
			totalSolved: agg._count,
			averageScore: agg._avg.finalScore,
			totalHintsUsed: agg._sum.hintsUsed
		};
	},
	getUserSubmissions: async (userId: string) => {
		return await prisma.submission.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			include: {
				problem: {
					select: {
						title: true,
						difficulty: true
					}
				}
			}
		});
	}
};
