<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center">
	<Card.Root
		class="w-full max-w-120.5 md:min-w-100 border-3 border-stone-800 bg-stone-900/50 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]
  rounded-2xl p-4 space-y-4"
	>
		<Card.Header>
			<Card.Title
				class="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-stone-500"
				>Reset Password !</Card.Title
			>
		</Card.Header>
		<Card.Content class="w-full max-w-md">
			<div class="space-y-4">
				<form
					method="POST"
					use:enhance={() => {
						loading = true;
						return async ({ update }) => {
							loading = false;
							update();
						};
					}}
					class="grid gap-4"
				>
					<div class="space-y-2">
						<div class="space-y-2">
							<Label class="text-md tracking-widest font-extrabold text-stone-400" for="password"
								>Enter Password:</Label
							>
							<Input
								class="bg-stone-950/50 text-white border-stone-700 h-14 text-lg focus:ring-1 focus:ring-stone-500 transition-all border-3"
								id="password"
								name="password"
								placeholder="Password"
								type="password"
								required
							/>
							{#if form?.errors?.password}
								<p class="text-[10px] uppercase font-bold text-red-500 tracking-wider">
									{form.errors.password[0]}
								</p>
							{/if}
						</div>
						<div class="space-y-2">
							<Label
								class="text-md tracking-widest font-extrabold text-stone-400"
								for="confirmPassword">Confirm Password:</Label
							>
							<Input
								class="bg-stone-950/50 text-white border-stone-700 h-14 text-lg focus:ring-1 focus:ring-stone-500 transition-all border-3"
								id="confirmPassword"
								name="confirmPassword"
								placeholder="Confirm Password"
								type="password"
								required
							/>
							{#if form?.errors?.confirmPassword}
								<p class="text-[10px] uppercase font-bold text-red-500 tracking-wider">
									{form.errors.confirmPassword[0]}
								</p>
							{/if}
						</div>
						<Button
							type="submit"
							class="w-full h-13 text-lg font-bold bg-white text-black hover:bg-stone-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all
   hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
						>
							{loading ? 'Resetting your Password...' : 'Reset Password'}
						</Button>
					</div>
				</form>
				{#if form?.message}
					<div
						class="flex items-center gap-3 p-4 rounded-xl border border-red-900/50 bg-red-500/10 backdrop-blur-md animate-in fade-in slide-in-from-top-2
   duration-300"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-red-500"
							><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
								x1="12"
								y1="16"
								x2="12.01"
								y2="16"
							/></svg
						>
						<p class="text-sm font-bold tracking-tight text-red-50">
							{form.message}
						</p>
					</div>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
</div>
