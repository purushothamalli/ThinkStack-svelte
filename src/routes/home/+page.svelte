<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const user = $derived(data.user);
	const stats = $derived(data.dashboard.stats);
	const submissions = $derived(data.dashboard.submissions);
</script>

<div class="min-h-screen bg-stone-950 text-stone-200 p-8 select-none">
	<div class="max-w-6xl mx-auto space-y-10">
		<div
			class="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-850 pb-8"
		>
			<div class="space-y-1">
				<span class="text-xs font-black tracking-widest uppercase text-stone-500 block">
					Member Portal
				</span>
				<h1 class="text-4xl font-black tracking-tight text-white leading-none">
					Welcome back, {user?.firstName || 'Thinker'}!
				</h1>
				<p class="text-stone-400 text-sm leading-relaxed max-w-lg select-text">
					Track your analytical reasoning progress, review details of past submissions, and continue
					improving.
				</p>
			</div>
			<div>
				<a
					href="/problems"
					class="px-6 py-3.5 bg-white text-black hover:bg-stone-200 rounded-xl text-sm font-black tracking-tight transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] block text-center"
				>
					Browse Problem Library
				</a>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div
				class="bg-stone-900/20 border-3 border-stone-850 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-36"
			>
				<span class="text-xs font-black tracking-widest uppercase text-stone-500">
					Problems Solved
				</span>
				<div class="flex items-baseline gap-2 mt-4">
					<span class="text-5xl font-black tracking-tight text-white">
						{stats.totalSolved}
					</span>
					<span class="text-stone-500 text-xs font-bold">tasks</span>
				</div>
			</div>
			<div
				class="bg-stone-900/20 border-3 border-stone-850 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-36"
			>
				<span class="text-xs font-black tracking-widest uppercase text-stone-500">
					Average Rating
				</span>
				<div class="flex items-baseline gap-2 mt-4">
					<span class="text-5xl font-black tracking-tight text-emerald-400">
						{stats.averageScore}
					</span>
					<span class="text-stone-500 text-xs font-bold">/ 100</span>
				</div>
			</div>
			<div
				class="bg-stone-900/20 border-3 border-stone-850 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-36"
			>
				<span class="text-xs font-black tracking-widest uppercase text-stone-500">
					Hints Revealed
				</span>
				<div class="flex items-baseline gap-2 mt-4">
					<span class="text-5xl font-black tracking-tight text-amber-500">
						{stats.totalHintsUsed}
					</span>
					<span class="text-stone-500 text-xs font-bold">used</span>
				</div>
			</div>
		</div>
		<div class="space-y-6">
			<h2 class="text-xl font-black tracking-tight text-white">Attempt History</h2>
			{#if submissions.length === 0}
				<div class="border-3 border-dashed border-stone-850 rounded-3xl p-16 text-center space-y-4">
					<h3 class="text-lg font-bold text-white">No attempts recorded yet</h3>
					<p class="text-stone-500 text-sm max-w-md mx-auto">
						Start exercising your reasoning pathways. Attempt a problem from the library to kick off
						your dashboard analytics.
					</p>
					<a
						href="/problems"
						class="inline-block px-5 py-2.5 bg-stone-900 border border-stone-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase hover:bg-stone-800 transition-colors"
					>
						Solve a Problem
					</a>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-4">
					{#each submissions as sub (sub.id)}
						<div
							class="bg-stone-900/10 border-3 border-stone-850 hover:border-stone-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors"
						>
							<div class="space-y-2">
								<div class="flex items-center gap-3">
									<h3 class="text-lg font-bold text-white tracking-tight">
										{sub.problem.title}
									</h3>
									<span
										class="px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase border
										{sub.problem.difficulty === 'easy'
											? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
											: sub.problem.difficulty === 'medium'
												? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
												: 'bg-red-500/10 text-red-500 border-red-500/20'}"
									>
										{sub.problem.difficulty}
									</span>
								</div>
								<div class="text-xs text-stone-500 font-bold">
									Attempted on {new Date(sub.createdAt).toLocaleDateString(undefined, {
										month: 'long',
										day: 'numeric',
										year: 'numeric'
									})}
								</div>
							</div>
							<div class="flex items-center justify-between md:justify-end gap-10">
								<div class="text-right">
									<span
										class="text-stone-500 text-[10px] font-black tracking-widest uppercase block"
									>
										Score Achieved
									</span>
									<span class="text-xl font-black text-white block mt-0.5">
										{sub.finalScore} <span class="text-xs font-bold text-stone-500">/ 100</span>
									</span>
								</div>
								<div>
									<a
										href="/problems/{sub.problemId}/results"
										class="px-4 py-2.5 bg-stone-900 border border-stone-800 hover:bg-stone-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-colors block text-center"
									>
										Review Results
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
