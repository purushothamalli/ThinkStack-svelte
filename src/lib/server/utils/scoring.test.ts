import { describe, test, expect } from 'vitest';
import { calculateFinalScore } from './scoring';

describe('scoring.calculateFinalScore', () => {
	test('should return original score with zero penalty when no hints are used', () => {
		const res = calculateFinalScore(50, 0);
		expect(res).toMatchObject({
			hintPenalty: expect.any(Number),
			finalScore: expect.any(Number)
		});
		expect(res.finalScore).toBe(50);
	});

	test.each([
		{ aiScore: 70, hintsUsed: 1, hintPenalty: 5, finalScore: 65 },
		{ aiScore: 70, hintsUsed: 2, hintPenalty: 10, finalScore: 60 },
		{ aiScore: 70, hintsUsed: 3, hintPenalty: 15, finalScore: 55 }
	])(
		'should calculate positive hint numbers correctly with respective penalties = aiScore:$aiScore, hintsUsed:$hintsUsed => hintPenalty:$hintPenalty, finalScore:$finalScore',
		({ aiScore, hintsUsed, hintPenalty, finalScore }) => {
			expect(calculateFinalScore(aiScore, hintsUsed)).toMatchObject({ hintPenalty, finalScore });
		}
	);

	test('should make sure the score cannot drop below zero', () => {
		expect(calculateFinalScore(5, 2)).toMatchObject({ hintPenalty: 10, finalScore: 0 });
	});

	test('should handle fallback hint penalty for invalid hint numbers', () => {
		expect(calculateFinalScore(100, 5)).toMatchObject({ hintPenalty: 15, finalScore: 85 });
	});

	test('should throw an error for invalid aiScores and invalid hintsUsed counts', () => {
		expect(() => calculateFinalScore(-20, 2)).toThrow(/zero/);
		expect(() => calculateFinalScore(60, -2)).toThrow(/zero/);
	});
});
