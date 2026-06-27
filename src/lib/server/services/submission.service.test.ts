import { describe, expect, test, vi } from 'vitest';
import { pushSubmitJob } from '../redis/queue';
import { redis } from '../redis';
import { submissionService } from './submission.service';

vi.mock('$lib/server/redis', () => ({
	redis: { set: vi.fn() }
}));

vi.mock('$lib/server/redis/queue', () => ({
	pushSubmitJob: vi.fn()
}));

describe('submissionService.submitSolution', () => {
	test('should set the status to evaluating, push a job to queue, and return queued status', async () => {
		const userId = 'fake-userId',
			problemId = 'fake-problemId';
		const result = await submissionService.submitSolution(userId, problemId);
		expect(result).toMatchObject({ status: 'queued' });
		expect(redis.set).toHaveBeenCalled();
		expect(redis.set).toHaveBeenCalledWith(
			`submission:status:${userId}:${problemId}`,
			'evaluating',
			{ expiration: { type: 'EX', value: 600 } }
		);
		expect(pushSubmitJob).toHaveBeenCalled();
		expect(pushSubmitJob).toHaveBeenCalledWith({ userId, problemId });
	});
});
