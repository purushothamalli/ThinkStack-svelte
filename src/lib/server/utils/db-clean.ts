import { prisma } from '../../../../prisma';

export default async function cleanDatabase(): Promise<void> {
	await prisma.user.deleteMany();
	await prisma.problem.deleteMany();
}
