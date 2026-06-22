<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const submission = $derived(data.submission);
	const problem = $derived(data.problem);
	const steps = ['understanding', 'breakdown', 'approach', 'solution', 'reflection'] as const;
	type Step = (typeof steps)[number];

	let activeCompareTab = $state<Step>('understanding');

	const getStepScore = (step: Step) => {
		if (!submission?.stepScores) return 0;
		const scoreKey = `${step}Score` as const;
		return submission.stepScores[scoreKey] || 0;
	};

	const getStepText = (step: Step) => {
		if (!submission?.stepScores) return '';
		return submission.stepScores[step] || '';
	};

	const getExpertText = (step: string) => {
		if (!submission?.expertComparisons) return '';
		if (step === 'understanding') return submission.expertComparisons.expertUnderstanding;
		if (step === 'breakdown') return submission.expertComparisons.expertReasoningFlow;
		// For approach, solution, and reflection, we display the expert reference solution and criteria
		if (step === 'approach')
			return 'Expert Strategy: Focus on reducing time complexity. Check constraints and select optimal data structures (e.g. hash maps or arrays) to eliminate redundant checks.';
		if (step === 'solution')
			return (
				problem?.referenceSolution ||
				'Refer to the solution logic described in the problem details.'
			);
		return 'Expert Reflection: Review space vs time tradeoffs. Always double-check constraints, null inputs, and integer overflows.';
	};

	// Convert base score out of 100 for visual consistency
	const baseScoreSum = $derived(
		submission?.stepScores
			? getStepScore('understanding') +
					getStepScore('breakdown') +
					getStepScore('approach') +
					getStepScore('solution') +
					getStepScore('reflection')
			: 0
	);
</script>

<div class="min-h-screen bg-stone-950 text-stone-200 p-6 md:p-12 selection:bg-stone-500/30">
	{#if !submission}
		<div class="max-w-4xl mx-auto text-center py-20">
			<h2 class="text-2xl font-black text-white">No submission found</h2>
			<p class="text-stone-500 mt-2">
				Please attempt the problem and submit before viewing results.
			</p>
			<a
				href="/problems"
				class="inline-block mt-6 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-stone-200 transition-colors"
			>
				Go to Library
			</a>
		</div>
	{:else}
		<div class="max-w-7xl mx-auto space-y-8">
			<!-- Header -->
			<div
				class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-850 pb-6"
			>
				<div>
					<a
						href="/problems"
						class="inline-flex items-center gap-2 text-stone-500 hover:text-white transition-colors text-sm font-bold tracking-tight mb-3"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
						Back to Library
					</a>
					<span class="text-xs font-black tracking-widest uppercase text-stone-500 block">
						Evaluation Results
					</span>
					<h1 class="text-3xl font-black tracking-tight text-white mt-1">
						{problem?.title || 'Problem Results'}
					</h1>
				</div>
				<div class="text-right text-xs text-stone-500 font-bold">
					Submitted on {new Date(submission.createdAt).toLocaleDateString(undefined, {
						month: 'long',
						day: 'numeric',
						year: 'numeric'
					})}
				</div>
			</div>

			<!-- Grid Stats Overview -->
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- Score Dial Card -->
				<div
					class="bg-stone-900/30 border-3 border-stone-850 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
				>
					<div
						class="absolute inset-0 bg-linear-to-b from-indigo-500/5 to-transparent pointer-events-none"
					></div>
					<span class="text-xs font-black tracking-widest uppercase text-stone-400 mb-6 block">
						Overall Rating
					</span>
					<div class="relative w-48 h-48 flex items-center justify-center">
						<!-- Background circular track -->
						<svg class="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
							<circle cx="50" cy="50" r="40" fill="transparent" stroke="#292524" stroke-width="8"
							></circle>
							<!-- Active progress circle -->
							<circle
								cx="50"
								cy="50"
								r="40"
								fill="transparent"
								stroke="url(#scoreGrad)"
								stroke-width="8"
								stroke-dasharray="251.2"
								stroke-dashoffset={251.2 - (251.2 * submission.finalScore) / 100}
								stroke-linecap="round"
							></circle>
							<defs>
								<linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" stop-color="#6366f1" />
									<stop offset="100%" stop-color="#10b981" />
								</linearGradient>
							</defs>
						</svg>
						<!-- Central Score Text -->
						<div class="flex flex-col items-center">
							<span class="text-5xl font-black tracking-tight text-white leading-none">
								{submission.finalScore}
							</span>
							<span class="text-stone-500 text-xs font-bold mt-1">out of 100</span>
						</div>
					</div>

					<div
						class="w-full mt-8 border-t border-stone-850/80 pt-6 grid grid-cols-2 gap-4 text-center"
					>
						<div>
							<span class="text-stone-500 text-[10px] font-black tracking-widest uppercase block">
								Base Score
							</span>
							<span class="text-lg font-bold text-white mt-1 block">
								{baseScoreSum}
							</span>
						</div>
						<div>
							<span class="text-stone-500 text-[10px] font-black tracking-widest uppercase block">
								Deductions
							</span>
							<span class="text-lg font-bold text-red-400 mt-1 block">
								-{submission.penaltyApplied}
							</span>
						</div>
					</div>
				</div>

				<!-- Cognitive Patterns and Hints Used -->
				<div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
					<!-- Strengths / Weaknesses AI Feedback Card -->
					<div class="bg-stone-900/30 border-3 border-stone-850 rounded-3xl p-8 space-y-6">
						<h3
							class="text-xs font-black tracking-widest uppercase text-stone-400 border-b border-stone-850/80 pb-3"
						>
							Logical Evaluation
						</h3>
						{#if submission.expertComparisons}
							<div class="space-y-4">
								<div class="flex gap-3">
									<div
										class="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black"
									>
										✓
									</div>
									<div>
										<h4 class="text-xs font-black text-emerald-500 tracking-wider uppercase mb-1">
											Key Strengths
										</h4>
										<p class="text-stone-300 text-sm leading-relaxed">
											{submission.expertComparisons.strengths}
										</p>
									</div>
								</div>
								<div class="flex gap-3">
									<div
										class="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black"
									>
										✗
									</div>
									<div>
										<h4 class="text-xs font-black text-red-400 tracking-wider uppercase mb-1">
											Weaknesses
										</h4>
										<p class="text-stone-300 text-sm leading-relaxed">
											{submission.expertComparisons.weaknesses}
										</p>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Tags and Hints -->
					<div
						class="bg-stone-900/30 border-3 border-stone-850 rounded-3xl p-8 flex flex-col justify-between gap-6"
					>
						<div class="space-y-4">
							<h3
								class="text-xs font-black tracking-widest uppercase text-stone-400 border-b border-stone-850/80 pb-3"
							>
								Thinking Tags & Keywords
							</h3>
							<div class="flex flex-wrap gap-2">
								{#each submission.thinkingPatterns as pattern (pattern)}
									<span
										class="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-bold tracking-tight capitalize"
									>
										{pattern.replace('_', ' ')}
									</span>
								{/each}
								{#each submission.mistakeTags as tag (tag)}
									<span
										class="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold tracking-tight"
									>
										{tag}
									</span>
								{/each}
							</div>
						</div>

						<div class="border-t border-stone-850/80 pt-4 flex items-center justify-between">
							<div>
								<span class="text-stone-500 text-[10px] font-black tracking-widest uppercase block">
									Hints Revealed
								</span>
								<span class="text-2xl font-black text-white mt-1 block">
									{submission.hintsUsed}
								</span>
							</div>
							<span class="text-xs text-stone-500 leading-relaxed max-w-44 text-right">
								Revealing hints applies a locked 10-point deduction penalty to your final score.
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Side-by-Side Step Comparison -->
			<div
				class="bg-stone-900/30 border-3 border-stone-850 rounded-3xl overflow-hidden flex flex-col"
			>
				<!-- Tab Navigation -->
				<div class="bg-stone-900/40 border-b border-stone-850/80 p-4 flex flex-wrap gap-2">
					{#each steps as step, index (step)}
						<button
							onclick={() => (activeCompareTab = step)}
							class="px-4 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase border transition-all duration-200
							{activeCompareTab === step
								? 'bg-white text-black border-white shadow-lg'
								: 'bg-stone-950/40 text-stone-400 border-stone-850/80 hover:text-white hover:border-stone-700'}"
						>
							{index + 1}. {step} ({getStepScore(step)}/20)
						</button>
					{/each}
				</div>

				<!-- Comparison Panel Content -->
				<div
					class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-850"
				>
					<!-- User Answer Panel -->
					<div class="p-8 space-y-4">
						<div class="flex items-center justify-between">
							<span class="text-xs font-black tracking-widest uppercase text-stone-400">
								Your Draft
							</span>
							<span class="text-xs font-bold text-stone-500">
								Score: {getStepScore(activeCompareTab)} / 20
							</span>
						</div>
						<div
							class="bg-stone-950/50 rounded-2xl p-6 min-h-60 max-h-96 overflow-y-auto border border-stone-850/50"
						>
							<p class="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap select-text">
								{getStepText(activeCompareTab) || 'No response recorded for this step.'}
							</p>
						</div>
					</div>

					<!-- Expert Solution / AI Analysis Panel -->
					<div class="p-8 space-y-4">
						<span class="text-xs font-black tracking-widest uppercase text-indigo-400">
							Expert Approach & Feedback
						</span>
						<div
							class="bg-indigo-950/10 border border-indigo-900/20 rounded-2xl p-6 min-h-60 max-h-96 overflow-y-auto"
						>
							<p class="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap select-text">
								{getExpertText(activeCompareTab)}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Dynamic Mentorship Recommendations -->
			{#if submission.expertComparisons}
				<div
					class="bg-linear-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 rounded-3xl p-8 space-y-3"
				>
					<h3 class="text-xs font-black tracking-widest uppercase text-indigo-400">
						Mentorship & Recommendations
					</h3>
					<h4 class="text-lg font-bold text-white">How You Can Improve</h4>
					<p class="text-stone-300 text-sm leading-relaxed max-w-5xl">
						{submission.expertComparisons.howToImprove}
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
