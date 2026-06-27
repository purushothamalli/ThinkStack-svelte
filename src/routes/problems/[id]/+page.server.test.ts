import { isRateLimited } from '$lib/server/redis/rateLimiter';
import { draftService } from '$lib/server/services/draft.service';
import { submissionService } from '$lib/server/services/submission.service';
import { describe, expect, test, vi } from 'vitest';
import { actions } from './+page.server';
import { problemService } from '$lib/server/services/problem.service';

vi.mock('$lib/server/services/draft.service', () => ({
	draftService: {
		saveDraft: vi.fn()
	}
}));
vi.mock('$lib/server/services/submission.service', () => ({
	submissionService: {
		submitSolution: vi.fn()
	}
}));
vi.mock('$lib/server/redis/rateLimiter', () => ({
	isRateLimited: vi.fn()
}));
vi.mock('$lib/server/services/problem.service', () => ({
	problemService: {
		getProblem: vi.fn()
	}
}));
const Request = {
	formData: vi.fn()
};
describe('/[id]/+page.server.ts', () => {
	test('should throw a redirect error to login if user is not authenticated', async () => {
		const res = await actions.default({ locals: {}, request: {} });
		expect(res).toMatchObject({
			status: expect.any(Number),
			data: {
				message: expect.any(String)
			}
		});
	});

	test('should throw zod validation error when incompatible data is passed', async () => {
		const formData = new FormData();
		formData.append('problemId', 'fake-problemId');
		formData.append('activeStep', 'understanding');
		formData.append('isHintUsed', 'false');
		formData.append('content', 'fake content');
		vi.mocked(Request.formData).mockResolvedValue(formData);
		const res = await actions.default({
			request: Request as any,
			locals: { user: { id: 'fake-userId' } }
		});
		expect(res).toMatchObject({ status: 400, data: { errors: expect.any(Object) } });
	});

	test('should verify that valid draft data is successfully written to the database', async () => {
		const formData = new FormData();
		formData.append('problemId', 'e5b3928c-7609-43aa-8c88-f5b461cc8c2d');
		formData.append('activeStep', 'understanding');
		formData.append('isHintUsed', 'false');
		formData.append(
			'content',
			'fake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake content'
		);
		vi.mocked(Request.formData).mockResolvedValue(formData);
		const res = await actions.default({
			request: Request as any,
			locals: { user: { id: 'e5b3928c-7609-43aa-8c88-f5b461cc8c2d' } }
		});
		expect(res).toMatchObject({ success: true });
		expect(draftService.saveDraft).toHaveBeenCalledWith(
			'e5b3928c-7609-43aa-8c88-f5b461cc8c2d',
			formData.get('problemId'),
			formData.get('activeStep'),
			formData.get('content'),
			false
		);
	});

	test('should verify that when the user submits their reflection, the action enforces 30-second rate-limit', async () => {
		const formData = new FormData();
		formData.append('problemId', 'e5b3928c-7609-43aa-8c88-f5b461cc8c2d');
		formData.append('activeStep', 'reflection');
		formData.append('isHintUsed', 'false');
		formData.append(
			'content',
			'fake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake content'
		);
		vi.mocked(isRateLimited).mockResolvedValue(true);
		vi.mocked(Request.formData).mockResolvedValue(formData);
		const res = await actions.default({
			request: Request as any,
			locals: { user: { id: 'e5b3928c-7609-43aa-8c88-f5b461cc8c2d' } }
		});
		expect(res).toMatchObject({ status: 429, data: { message: expect.any(String) } });
		expect(submissionService.submitSolution).toHaveBeenCalledTimes(0);
	});

	test('should verify that a non-rate-limited reflection submits successfully to AI queue', async () => {
		const formData = new FormData();
		formData.append('problemId', 'e5b3928c-7609-43aa-8c88-f5b461cc8c2d');
		formData.append('activeStep', 'reflection');
		formData.append('isHintUsed', 'false');
		formData.append(
			'content',
			'fake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake contentfake content'
		);
		vi.mocked(isRateLimited).mockResolvedValue(false);
		vi.mocked(Request.formData).mockResolvedValue(formData);
		const res = await actions.default({
			request: Request as any,
			locals: { user: { id: 'e5b3928c-7609-43aa-8c88-f5b461cc8c2d' } }
		});
		expect(res).toMatchObject({ success: true });
		expect(submissionService.submitSolution).toHaveBeenCalledTimes(1);
	});
});
