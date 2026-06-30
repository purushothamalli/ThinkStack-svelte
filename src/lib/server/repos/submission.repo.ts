import { prisma } from '../../../../prisma';
import type { Prisma, Submission } from '@prisma/client';

type SubmissionInput = Prisma.SubmissionUncheckedCreateInput;
type StepScore = Prisma.StepScoreCreateWithoutSubmissionInput;
type ExpertComparison = Prisma.ExpertComparisonCreateWithoutSubmissionInput;
export type UserStats = {
	totalSolved: number;
	averageScore: number | null;
	totalHintsUsed: number | null;
};
export type FullSubmission = Prisma.SubmissionGetPayload<{
	include: {
		stepScores: true;
		expertComparisons: true;
	};
}>;
export type SubmissionWithProblem = Prisma.SubmissionGetPayload<{
	include: {
		problem: { select: { title: true; difficulty: true } };
	};
}>;

export interface ISubmissionRepository {
	saveSubmission(
		submission: SubmissionInput,
		stepScore: StepScore,
		expertComparison: ExpertComparison
	): Promise<Submission>;
	getSubmission(userId: string, problemId: string): Promise<FullSubmission | null>;
	getUserStats(userId: string): Promise<UserStats>;
	getUserSubmissions(userId: string): Promise<SubmissionWithProblem[]>;
}

class PrismasubmissionRepository implements ISubmissionRepository {
	public async saveSubmission(
		submission: SubmissionInput,
		stepScore: StepScore,
		expertComparison: ExpertComparison
	): Promise<Submission> {
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
	}
	public async getSubmission(userId: string, problemId: string): Promise<FullSubmission | null> {
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
	}
	public async getUserStats(userId: string): Promise<UserStats> {
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
	}
	public async getUserSubmissions(userId: string): Promise<SubmissionWithProblem[]> {
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
}

export const submissionRepo: ISubmissionRepository = new PrismasubmissionRepository();

// export const submissionRepo = {
// 	saveSubmission:async(
// 		submission: SubmissionInput,
// 		stepScore: StepScore,
// 		expertComparison: ExpertComparison
// 	)=>{
// 		const saveSubmissionTransaction = prisma.submission.create({
// 			data: {
// 				...submission,
// 				stepScores: {
// 					create: {
// 						...stepScore
// 					}
// 				},
// 				expertComparisons: {
// 					create: {
// 						...expertComparison
// 					}
// 				}
// 			}
// 		});
// 		return (
// 			await prisma.$transaction([
// 				saveSubmissionTransaction,
// 				prisma.draft.delete({
// 					where: {
// 						userId_problemId: {
// 							userId: submission.userId,
// 							problemId: submission.problemId
// 						}
// 					}
// 				})
// 			])
// 		)[0];
// 	},
// 	getSubmission: async (userId: string, problemId: string) => {
// 		return await prisma.submission.findFirst({
// 			where: {
// 				userId,
// 				problemId
// 			},
// 			orderBy: { createdAt: 'desc' },
// 			include: {
// 				stepScores: true,
// 				expertComparisons: true
// 			}
// 		});
// 	},
// 	getUserStats: async (userId: string) => {
// 		const agg = await prisma.submission.aggregate({
// 			where: { userId },
// 			_count: true,
// 			_avg: {
// 				finalScore: true
// 			},
// 			_sum: {
// 				hintsUsed: true
// 			}
// 		});
// 		return {
// 			totalSolved: agg._count,
// 			averageScore: agg._avg.finalScore,
// 			totalHintsUsed: agg._sum.hintsUsed
// 		};
// 	},
// 	getUserSubmissions: async (userId: string) => {
// 		return await prisma.submission.findMany({
// 			where: { userId },
// 			orderBy: { createdAt: 'desc' },
// 			include: {
// 				problem: {
// 					select: {
// 						title: true,
// 						difficulty: true
// 					}
// 				}
// 			}
// 		});
// 	}
// };
