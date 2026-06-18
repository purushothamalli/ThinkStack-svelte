<script lang="ts">
	import Navbar from '$lib/components/Navbar.svelte';
	import './layout.css';
	let { children, data } = $props();
</script>

<div
	class="relative min-h-screen bg-[#020617] text-stone-100 font-sans selection:bg-stone-500/30 overflow-x-hidden"
>
	<div
		class="fixed -bottom-48 -left-48 w-150 h-150 bg-indigo-500/40 blur-[150px] rounded-full pointer-events-none"
	></div>
	<div
		class="fixed -bottom-48 -right-48 w-150 h-150 bg-blue-600/40 blur-[150px] rounded-full pointer-events-none"
	></div>
	<Navbar user={data.user} />
	<main class="relative z-10 pt-15">
		{@render children()}
	</main>
</div>
