<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Helper definitions
	const problem = $derived(data.problem);
	const steps = ['understanding', 'breakdown', 'approach', 'solution', 'reflection'];

	let draft = $derived(data.draft);
	let activeStep = $state(untrack(() => data.draft?.currentStep || 'understanding'));
	let storageAreaKey = $derived(`problem-${problem.id}-${activeStep}`);

	// Writable state synced reactively with activeStep changes
	let editorContent = $state('');
	let errorMessage = $state<string | null>(null);
	let isSubmitting = $state(false);

	// Sync draft reactive state if parent data updates (e.g., on loader re-run)
	$effect(() => {
		const cached = localStorage.getItem(storageAreaKey);
		if (cached !== null) {
			editorContent = cached;
		} else {
			editorContent = (draft?.[activeStep as keyof typeof draft] as string) || '';
		}
	});

	let secondsRemaining = $state(120);
	let isHintsTimerCompleted = $derived(secondsRemaining === 0);
	let stepInstruction = $derived.by(() => {
		if (activeStep === 'understanding') {
			return 'Explain the problem constraints, goals, and inputs in your own words. What is this problem asking you to solve?';
		}
		if (activeStep === 'breakdown') {
			return 'Deconstruct the problem into smaller logical sub-problems. What are the core components or mathematical equations involved?';
		}
		if (activeStep === 'approach') {
			return 'Outline your high-level strategy and algorithms to solve the problem. How will you connect the sub-problems?';
		}
		if (activeStep === 'solution') {
			return 'Provide the concrete steps, equations, or code structure of your solution. How do you implement your approach?';
		}
		return 'Reflect on your solution. Are there edge cases, optimizations, or alternative strategies you could have considered?';
	});
	let currentHint = $derived.by(() => {
		if (activeStep === 'breakdown') return problem.hints?.[0] || null;
		if (activeStep === 'approach') return problem.hints?.[1] || null;
		if (activeStep === 'solution') return problem.hints?.[2] || null;
		return null;
	});

	$effect(() => {
		if (secondsRemaining > 0) {
			const timer = setInterval(() => {
				secondsRemaining--;
			}, 1000);
			return () => clearInterval(timer);
		}
	});

	let isHintUsed = $state(false);

	const isStepCompleted = (step: string) => {
		const dbValue = draft?.[step as keyof typeof draft];
		if (typeof window === 'undefined') {
			return typeof dbValue === 'string' && dbValue.trim().length > 0;
		}
		const cached = localStorage.getItem(`problem-${problem.id}-${step}`);
		const hasDraft = typeof dbValue === 'string' && dbValue.trim().length > 0;
		const hasCached = typeof cached === 'string' && cached.trim().length > 0;
		return hasDraft || hasCached;
	};

	const isStepLocked = (step: string) => {
		if (step === 'understanding') return false;
		if (step === activeStep) return false;
		return !isStepCompleted(step);
	};

	const setActiveStep = (step: string) => {
		activeStep = step;
		secondsRemaining = 120;
		errorMessage = null; // Clear validation error on step transition
	};

	const handleEnhance = () => {
		isSubmitting = true;
		errorMessage = null;
		return async ({ result, update }: { result: any; update: any }) => {
			isSubmitting = false;
			if (result.type === 'success') {
				isHintUsed = false;
				errorMessage = null;

				// Clear the local cache for the step since it's now securely saved on the DB
				localStorage.removeItem(storageAreaKey);

				if (activeStep === 'reflection') {
					steps.forEach((step) => {
						localStorage.removeItem(`problem-${problem.id}-${step}`);
					});
					goto(`/problems/${problem.id}/results`);
				} else {
					const currentIndex = steps.indexOf(activeStep);
					if (currentIndex !== -1 && currentIndex < steps.length - 1) {
						setActiveStep(steps[currentIndex + 1]);
					}
					await update({ reset: false });
				}
			} else if (result.type === 'failure') {
				errorMessage =
					result.data?.errors?.content?.[0] ||
					result.data?.message ||
					'Validation failed. Please check your response.';
				await update({ reset: false });
			} else {
				errorMessage = 'An error occurred while saving your draft.';
				await update({ reset: false });
			}
		};
	};
</script>

<div
	class="h-screen max-h-screen bg-stone-950 flex flex-col overflow-hidden text-stone-200 select-none"
>
	<div class="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
		<div
			class="w-full md:w-[35%] bg-stone-900/20 border-r border-stone-850 h-full overflow-y-auto p-8 space-y-6 flex flex-col justify-between"
		>
			<div class="space-y-6">
				<a
					href="/problems"
					class="inline-flex items-center gap-2 text-stone-500 hover:text-white transition-colors text-sm font-bold tracking-tight group"
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
						class="group-hover:-translate-x-0.5 transition-transform"
					>
						<path d="m15 18-6-6 6-6" />
					</svg>
					Back to Library
				</a>
				<div class="space-y-2">
					<span class="text-xs font-black tracking-widest uppercase text-stone-500">
						{problem.category}
					</span>
					<h1 class="text-3xl font-black tracking-tight text-white leading-none">
						{problem.title}
					</h1>
					<div class="pt-1">
						<span
							class="inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border
							{problem.difficulty === 'easy'
								? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
								: problem.difficulty === 'medium'
									? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
									: 'bg-red-500/10 text-red-500 border-red-500/20'}"
						>
							{problem.difficulty}
						</span>
					</div>
				</div>
				<div class="border-t border-stone-850 pt-4">
					<p class="text-stone-400 text-sm leading-relaxed whitespace-pre-line select-text">
						{problem.description}
					</p>
				</div>
			</div>
			<div class="border-t border-stone-850 pt-6 space-y-3">
				<h3 class="text-xs font-black tracking-widest uppercase text-stone-500 mb-2">
					Workspace Guide
				</h3>
				<div class="flex flex-col gap-2">
					{#each steps as step, index (step)}
						<button
							onclick={() => setActiveStep(step)}
							disabled={isStepLocked(step)}
							class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left border transition-all duration-200 text-sm font-bold tracking-tight
							{activeStep === step
								? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
								: isStepLocked(step)
									? 'bg-stone-900/10 text-stone-600 border-stone-900/50 cursor-not-allowed opacity-50'
									: 'bg-stone-900/30 text-stone-300 border-stone-850/60 hover:bg-stone-900/60 hover:border-stone-700'}"
						>
							<div class="flex items-center gap-3">
								<span
									class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border
									{activeStep === step
										? 'border-black text-black bg-white'
										: isStepLocked(step)
											? 'border-stone-700 text-stone-600'
											: 'border-stone-600 text-stone-300 bg-stone-950/50'}"
								>
									{index + 1}
								</span>
								<span class="capitalize">{step}</span>
							</div>
							{#if isStepLocked(step)}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="text-stone-600"
								>
									<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
									<path d="M7 11V7a5 5 0 0 1 10 0v4" />
								</svg>
							{:else if isStepCompleted(step) && activeStep !== step}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="3"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="text-emerald-500"
								>
									<path d="M20 6 9 17l-5-5" />
								</svg>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
		<form
			method="POST"
			use:enhance={handleEnhance}
			class="w-full md:w-[65%] h-full flex flex-col justify-between bg-stone-950 p-8 min-h-0 overflow-y-auto"
		>
			<input type="hidden" name="problemId" value={problem.id} />
			<input type="hidden" name="activeStep" value={activeStep} />
			<input type="hidden" name="isHintUsed" value={isHintUsed} />
			<div class="space-y-4">
				<div class="flex items-center justify-between border-b border-stone-850 pb-4">
					<h2 class="text-xl font-bold tracking-tight text-white capitalize">
						Step: {activeStep}
					</h2>
					<span class="text-xs font-semibold text-stone-500 tracking-wider">
						Stage {steps.indexOf(activeStep) + 1} of 5
					</span>
				</div>
				<p class="text-stone-400 text-sm leading-relaxed font-semibold">
					{stepInstruction}
				</p>
				{#if errorMessage}
					<div
						class="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl p-4 text-xs font-bold flex items-center gap-2 select-text"
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
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
						<span>{errorMessage}</span>
					</div>
				{/if}
			</div>
			<div class="flex-1 my-6 flex flex-col min-h-62.5">
				<textarea
					name="content"
					bind:value={editorContent}
					oninput={(e) =>
						localStorage.setItem(storageAreaKey, (e.target as HTMLTextAreaElement).value)}
					placeholder="Type your response for this step..."
					disabled={isSubmitting}
					class="w-full flex-1 bg-stone-900/30 text-white border-3 border-stone-850 hover:border-stone-800 focus:border-stone-600 focus:outline-none focus:ring-0 rounded-2xl p-6 text-base leading-relaxed placeholder-stone-600 transition-colors resize-none select-text disabled:opacity-50 disabled:cursor-not-allowed"
					required
				></textarea>
			</div>
			<div class="space-y-6">
				{#if currentHint !== null}
					{#if !isHintsTimerCompleted}
						<div
							class="border-3 border-stone-850 bg-stone-900/10 rounded-2xl p-5 flex items-center gap-3 text-stone-500 select-none"
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
								<rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
								<path d="M7 11V7a5 5 0 0 1 10 0v4" />
							</svg>
							<span class="text-xs font-bold tracking-wider uppercase">
								Hint Unlocks in {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
							</span>
						</div>
					{:else}
						<details
							class="border-3 border-stone-850 bg-stone-900/30 rounded-2xl p-5 transition-all duration-300 cursor-pointer group"
							ontoggle={(e) => {
								if ((e.target as HTMLDetailsElement).open) isHintUsed = true;
							}}
						>
							<summary
								class="flex items-center justify-between text-xs font-black tracking-widest uppercase text-stone-400 select-none"
							>
								View Hint
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
									class="group-open:rotate-180 transition-transform"
								>
									<path d="m6 9 6 6 6-6" />
								</svg>
							</summary>
							<p
								class="text-stone-300 text-sm mt-3 leading-relaxed whitespace-pre-line cursor-text select-text"
							>
								{currentHint}
							</p>
						</details>
					{/if}
				{/if}
				<div class="flex items-center justify-between border-t border-stone-850 pt-6">
					<button
						type="button"
						onclick={() => {
							const currentIndex = steps.indexOf(activeStep);
							if (currentIndex > 0) setActiveStep(steps[currentIndex - 1]);
						}}
						disabled={activeStep === 'understanding' || isSubmitting}
						class="px-5 py-3 rounded-xl border border-stone-800 text-stone-400 hover:text-white hover:border-stone-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold tracking-tight transition-all"
					>
						Previous Step
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-6 py-3 rounded-xl text-sm font-bold tracking-tight transition-all flex items-center gap-2
						{activeStep === 'reflection'
							? 'bg-white text-black hover:bg-stone-200'
							: 'bg-stone-900 text-white border border-stone-850 hover:bg-stone-800'}
						disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSubmitting}
							<svg
								class="animate-spin h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
								></path>
							</svg>
							<span>{activeStep === 'reflection' ? 'Evaluating...' : 'Saving...'}</span>
						{:else}
							<span>{activeStep === 'reflection' ? 'Submit Solution' : 'Save & Next'}</span>
						{/if}
					</button>
				</div>
			</div>
		</form>
	</div>
</div>
