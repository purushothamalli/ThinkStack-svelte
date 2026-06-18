<script>
	import { Button } from '$lib/components/ui/button';
	import { enhance } from '$app/forms';
	import { Home, FileText, User, LogIn, UserPlus, LogOut } from '@lucide/svelte';
	let { user } = $props();
</script>

<nav
	class="fixed top-0 left-0 right-0 z-50 border-b-2 border-stone-500/40 bg-indigo-800/10 backdrop-blur-md"
>
	<div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
		<a
			href="/"
			class="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white to-stone-500 hover:to-white
   transition-all"
		>
			ThinkStack
		</a>
		<div class="flex items-center gap-6">
			{#if user}
				<a
					href="/home"
					class="flex items-center gap-2 text-md font-medium text-stone-300 border-2 border-stone-800 bg-stone-900/40 px-4 py-1.5 rounded-lg
   hover:bg-stone-800 hover:border-stone-700 transition-all"
				>
					<Home size={16} class="text-stone-500" />
					<span>Home</span>
				</a>
				<a
					href="/problems"
					class="flex items-center gap-2 text-md font-medium text-stone-300 border-2 border-stone-800 bg-stone-900/40 px-4 py-1.5
   rounded-lg hover:bg-stone-800 hover:border-stone-700 transition-all"
				>
					<FileText size={16} class="text-stone-500" />
					<span>Problems</span>
				</a>
				<a
					href="/profile"
					class="flex items-center gap-2 text-md font-medium text-stone-300 border-2 border-stone-800 bg-stone-900/40 px-4 py-1.5 rounded-lg
   hover:bg-stone-800 hover:border-stone-700 transition-all"
				>
					<User size={16} class="text-stone-500" />
					<span>Profile</span>
				</a>

				<form method="POST" action="/home?/logout" use:enhance>
					<Button
						type="submit"
						variant="destructive"
						class="flex items-center gap-2 text-md font-bold border border-destructive hover:border-2 tracking-wide text-red-500/80
   hover:text-red-500 hover:bg-red-500/20 h-10 px-4"
					>
						<LogOut size={14} />
						<span>Logout</span>
					</Button>
				</form>
			{:else}
				<a
					href="/login"
					class="flex items-center gap-2 text-md font-medium text-stone-300 border-2 border-stone-800 bg-stone-900/40 px-4 py-1.5 rounded-lg
   hover:bg-stone-800 hover:border-stone-700 transition-all"
				>
					<LogIn size={16} class="text-stone-500" />
					<span>Login</span>
				</a>
				<Button
					href="/register"
					variant="secondary"
					class="flex items-center gap-2 bg-white text-black font-medium h-10 px-6 rounded-full hover:bg-stone-200 hover:border-black hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300
   "
				>
					<UserPlus size={18} />
					<span>Get Started</span>
				</Button>
			{/if}
		</div>
	</div>
</nav>
