<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data }: { data: PageData } = $props();
	let selectedDifficulty = $derived(page.url.searchParams.get('difficulty') || '');
	const handleFilterChange = (event: Event) => {
		const target = event.target as HTMLSelectElement;
		if (target.value !== '') {
			goto(`/problems?difficulty=${target.value}`);
		} else {
			goto('/problems');
		}
	};
</script>

<div class="min-h-screen bg-stone-950 text-white py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-6xl mx-auto space-y-8">
		<div
			class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-850 pb-6"
		>
			<div>
				<h1
					class="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-stone-500"
				>
					Problem Library
				</h1>
				<p class="text-stone-400 text-sm mt-1">
					Select a problem to start step-by-step drafting and analysis.
				</p>
			</div>

			<div class="relative w-full sm:w-48">
				<select
					name="difficulty"
					id="difficulty"
					value={selectedDifficulty}
					onchange={handleFilterChange}
					class="w-full bg-stone-900/50 text-white border-3 border-stone-850 hover:border-stone-700 rounded-xl h-12 px-4 focus:outline-none focus:ring-1 focus:ring-stone-500 transition-all cursor-pointer appearance-none text-sm font-bold tracking-wide"
				>
					<option value="">All Difficulties</option>
					<option value="easy">Easy</option>
					<option value="medium">Medium</option>
					<option value="hard">Hard</option>
				</select>
				<div
					class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-500"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</div>
			</div>
		</div>

		<div class="space-y-4">
			{#if data.problems && data.problems.length > 0}
				{#each data.problems as problem (problem.id)}
					<a
						href="/problems/{problem.id}"
						class="block border-3 border-stone-850 bg-stone-900/40 hover:bg-stone-900/70 hover:border-stone-700 rounded-2xl p-8 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] backdrop-blur-md group"
					>
						<div class="flex flex-col gap-3">
							<div class="flex items-start justify-between gap-4">
								<div class="space-y-1">
									<h2
										class="text-xl font-bold tracking-tight text-white group-hover:text-stone-200 transition-colors"
									>
										{problem.title}
									</h2>
									<p class="text-xs font-semibold tracking-wider text-stone-500 uppercase">
										{problem.category}
									</p>
								</div>

								<span
									class="px-3.5 py-1.5 rounded-full text-xs font-black tracking-wide uppercase border shrink-0
									{problem.difficulty === 'easy'
										? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
										: problem.difficulty === 'medium'
											? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
											: 'bg-red-500/10 text-red-500 border-red-500/20'}"
								>
									{problem.difficulty}
								</span>
							</div>

							<p class="text-stone-300 text-sm leading-relaxed">
								{problem.description}
							</p>
						</div>
					</a>
				{/each}
			{:else}
				<!-- Empty State -->
				<div
					class="text-center py-16 border-3 border-dashed border-stone-850 rounded-2xl bg-stone-900/20"
				>
					<p class="text-stone-500 font-medium tracking-tight">
						No problems found for the selected difficulty.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
