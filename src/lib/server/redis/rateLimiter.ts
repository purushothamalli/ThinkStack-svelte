import { redis } from '.';

export async function isRateLimited(
	userId: string,
	limitKey: string,
	seconds: number
): Promise<boolean> {
	const key = `rate:${limitKey}:${userId}`;
	try {
		const exists = await redis.get(key);
		if (exists) return true;
		await redis.set(key, '1', { expiration: { type: 'EX', value: seconds } });
		return false;
	} catch (error) {
		console.log('Redis rate-limiter error: ', error);
		return false;
	}
}
