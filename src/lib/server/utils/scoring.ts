const scoringRules: Record<number, number> = {
	0: 0,
	1: 5,
	2: 10,
	3: 15
};

export const calculateFinalScore = (aiScore: number, hintsUsed: number) => {
	if (aiScore < 0 || hintsUsed < 0) throw new Error('Arguments must not be less than zero!');
	let hintPenalty = scoringRules[hintsUsed];
	if (!Object.keys(scoringRules).includes(hintsUsed.toString())) hintPenalty = scoringRules[3];
	let finalScore = aiScore - hintPenalty;
	finalScore = Math.max(0, finalScore);
	return { hintPenalty, finalScore };
};
