<script>
	import ChangePassword from '$lib/components/ChangePassword.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { KeyRound } from '@lucide/svelte';
	let { data, form } = $props();
	let isChangingPassword = $state(false);
</script>

{#if data.user}
	<h1>{data.user.firstName}</h1>
	<h1>{data.user.lastName}</h1>
	<h1>{data.user.email}</h1>
	<h1>{data.user.profilePic}</h1>
{/if}

{#if !isChangingPassword}
	<Button
		onclick={() => (isChangingPassword = true)}
		variant="secondary"
		class="flex items-center gap-2 bg-white text-black font-medium h-10 px-6 rounded-full transition-all duration-300
   hover:bg-stone-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
	>
		<KeyRound size={18} />
		<span>Change Password</span>
	</Button>
{:else}
	<ChangePassword {form} />
{/if}
