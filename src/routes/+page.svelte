<script lang="ts">
	import { ArrowRight, BrainCircuit, ShieldAlert, Sparkles, Activity, Layers, HelpCircle, Trophy } from '@lucide/svelte';
</script>

<div class="relative min-h-screen bg-[#020617] text-stone-100 overflow-hidden flex flex-col justify-center">
	<!-- Hero Section background glow -->
	<div class="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-500/10 blur-[160px] rounded-full pointer-events-none"></div>
	<div class="absolute top-40 left-1/3 -translate-x-1/2 w-[400px] h-[250px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>

	<div class="max-w-6xl mx-auto px-6 py-20 relative z-10 w-full flex flex-col items-center text-center space-y-16">
		<!-- Tagline -->
		<div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-1000">
			<Sparkles size={13} class="text-indigo-400 animate-pulse" />
			<span class="text-[10px] font-black tracking-widest uppercase text-indigo-300">
				Next-Gen Analytical Reasoning Platform
			</span>
		</div>

		<!-- Main Hero Text -->
		<div class="max-w-4xl space-y-6">
			<h1 class="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight">
				Train Your Brain to <br />
				<span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 drop-shadow-[0_2px_10px_rgba(129,140,248,0.2)]">
					Think Structurally
				</span>
			</h1>
			<p class="text-stone-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed select-text font-medium">
				ThinkStack goes beyond standard coding practice. We break down complex algorithmic problems into distinct cognitive stages to evaluate your complete problem-solving pathway.
			</p>
		</div>

		<!-- Call to Actions -->
		<div class="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in zoom-in duration-1000 delay-200">
			<a
				href="/register"
				class="group flex items-center gap-2 px-8 py-4 bg-white text-black hover:bg-stone-200 rounded-2xl text-sm font-black tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_35px_rgba(255,255,255,0.2)]"
			>
				<span>Get Started Free</span>
				<ArrowRight size={16} class="group-hover:translate-x-1 transition-transform" />
			</a>
			<a
				href="/login"
				class="px-8 py-4 border border-stone-850 hover:border-stone-700 bg-stone-900/40 hover:bg-stone-800/60 rounded-2xl text-sm font-black tracking-widest uppercase text-stone-300 hover:text-white transition-all"
			>
				Sign In
			</a>
		</div>

		<!-- Feature Grid -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-12 text-left">
			<!-- Feature 1 -->
			<div class="group bg-stone-950/40 border-2 border-stone-850 hover:border-stone-800/80 p-8 rounded-3xl space-y-6 transition-all hover:-translate-y-1">
				<div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
					<Layers size={22} />
				</div>
				<div class="space-y-2">
					<h3 class="text-lg font-bold text-white tracking-tight">The 5-Step Workspace</h3>
					<p class="text-stone-400 text-sm leading-relaxed font-medium">
						Systematic progression: Understanding, Breakdown, Approach, Solution, and Reflection. We guide you stage-by-stage.
					</p>
				</div>
			</div>

			<!-- Feature 2 -->
			<div class="group bg-stone-950/40 border-2 border-stone-850 hover:border-stone-800/80 p-8 rounded-3xl space-y-6 transition-all hover:-translate-y-1">
				<div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
					<BrainCircuit size={22} />
				</div>
				<div class="space-y-2">
					<h3 class="text-lg font-bold text-white tracking-tight">AI Cognitive Diagnosis</h3>
					<p class="text-stone-400 text-sm leading-relaxed font-medium">
						Receive detailed analysis on mistake tags, reasoning patterns, individual step scores, and constructive optimization tips.
					</p>
				</div>
			</div>

			<!-- Feature 3 -->
			<div class="group bg-stone-950/40 border-2 border-stone-850 hover:border-stone-800/80 p-8 rounded-3xl space-y-6 transition-all hover:-translate-y-1">
				<div class="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
					<Trophy size={22} />
				</div>
				<div class="space-y-2">
					<h3 class="text-lg font-bold text-white tracking-tight">Metrics & Score Tracking</h3>
					<p class="text-stone-400 text-sm leading-relaxed font-medium">
						Monitor your progress with a unified attempt dashboard, interactive metrics, performance ratings, and comprehensive history logs.
					</p>
				</div>
			</div>
		</div>

		<!-- Footer Info -->
		<div class="text-stone-600 text-xs font-semibold tracking-wider pt-8 uppercase border-t border-stone-850/60 w-full flex flex-col sm:flex-row items-center justify-between gap-4">
			<span>&copy; {new Date().getFullYear()} ThinkStack. All rights reserved.</span>
			<div class="flex items-center gap-6">
				<a href="/problems" class="hover:text-stone-400 transition-colors">Problem Library</a>
				<span class="text-stone-800">|</span>
				<a href="/profile" class="hover:text-stone-400 transition-colors">Profile Portal</a>
			</div>
		</div>
	</div>
</div>
