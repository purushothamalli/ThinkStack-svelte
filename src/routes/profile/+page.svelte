<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const user = $derived(data.user);

	let isChangingPassword = $state(false);
	let uploadForm: HTMLFormElement;
	let fileInput: HTMLInputElement;

	let pfpSuccess = $state(false);
	let profileSuccess = $state(false);
	let errorMessage = $state<string | null>(null);

	const triggerFileInput = () => {
		fileInput.click();
	};

	const handleFileChange = () => {
		if (fileInput.files && fileInput.files.length > 0) {
			uploadForm.submit();
		}
	};

	const handleProfileEnhance = () => {
		profileSuccess = false;
		errorMessage = null;
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				profileSuccess = true;
			} else if (result.type === 'failure') {
				errorMessage = result.data?.message || 'Failed to update profile details.';
			}
		};
	};

	const handlePicEnhance = () => {
		pfpSuccess = false;
		errorMessage = null;
		return async ({ result }: { result: any }) => {
			if (result.type === 'success') {
				pfpSuccess = true;
			} else if (result.type === 'failure') {
				errorMessage = result.data?.message || 'Failed to upload profile picture.';
			}
		};
	};
</script>

<div class="min-h-screen bg-stone-950 text-stone-200 p-8 select-none">
	<div class="max-w-4xl mx-auto space-y-10">
		<!-- Header -->
		<div class="border-b border-stone-850 pb-6">
			<span class="text-xs font-black tracking-widest uppercase text-stone-500 block">
				Account settings
			</span>
			<h1 class="text-3xl font-black tracking-tight text-white mt-1">Personal Profile</h1>
		</div>

		<!-- Status Messages -->
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
					><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line
						x1="12"
						y1="16"
						x2="12.01"
						y2="16"
					/></svg
				>
				<span>{errorMessage}</span>
			</div>
		{/if}
		{#if pfpSuccess}
			<div
				class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-4 text-xs font-bold flex items-center gap-2"
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
					stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
				>
				<span>Profile picture uploaded and updated successfully!</span>
			</div>
		{/if}
		{#if profileSuccess}
			<div
				class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl p-4 text-xs font-bold flex items-center gap-2"
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
					stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg
				>
				<span>Profile details updated successfully!</span>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
			<!-- Left Column: Avatar & Account Meta -->
			<div
				class="bg-stone-900/20 border-3 border-stone-850 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6"
			>
				<!-- Photo Upload Form -->
				<form
					bind:this={uploadForm}
					method="POST"
					action="?/updateProfilePic"
					enctype="multipart/form-data"
					use:enhance={handlePicEnhance}
					class="flex flex-col items-center space-y-4"
				>
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div class="relative group cursor-pointer" onclick={triggerFileInput}>
						{#if user?.profilePic && user.profilePic !== 'default_pfp.jpg'}
							<img
								src={user.profilePic}
								alt="Avatar"
								class="w-28 h-28 rounded-full object-cover border-3 border-stone-850 hover:border-stone-700 transition-colors"
							/>
						{:else}
							<div
								class="w-28 h-28 rounded-full bg-stone-900 border-3 border-stone-850 hover:border-stone-700 text-3xl font-black text-stone-400 flex items-center justify-center capitalize select-none transition-colors"
							>
								{user?.firstName?.[0] || 'T'}{user?.lastName?.[0] || 'S'}
							</div>
						{/if}
						<!-- Overlay Upload prompt on hover -->
						<div
							class="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2.5"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-white"
								><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline
									points="17 8 12 3 7 8"
								/><line x1="12" y1="3" x2="12" y2="15" /></svg
							>
						</div>
					</div>

					<input
						bind:this={fileInput}
						type="file"
						name="profilePic"
						accept="image/*"
						class="hidden"
						onchange={handleFileChange}
					/>

					<button
						type="button"
						onclick={triggerFileInput}
						class="px-4 py-2 border border-stone-800 hover:border-stone-700 hover:text-white rounded-xl text-xs font-bold tracking-tight text-stone-400 transition-colors"
					>
						Update Photo
					</button>
				</form>

				<div class="w-full border-t border-stone-850/80 pt-4 text-left space-y-2 select-text">
					<div>
						<span class="text-stone-500 text-[9px] font-black tracking-widest uppercase block">
							Registered Email
						</span>
						<span class="text-xs font-bold text-white break-all">{user?.email}</span>
					</div>
					<div>
						<span class="text-stone-500 text-[9px] font-black tracking-widest uppercase block">
							Member Since
						</span>
						<span class="text-xs font-bold text-white">
							{user?.createdAt
								? new Date(user.createdAt).toLocaleDateString(undefined, {
										month: 'long',
										year: 'numeric'
									})
								: ''}
						</span>
					</div>
				</div>
			</div>

			<!-- Right Column: Personal Details & Security -->
			<div class="lg:col-span-2 space-y-8">
				<!-- Personal Details Card -->
				<div class="bg-stone-900/20 border-3 border-stone-850 rounded-3xl p-8 space-y-6">
					<h2
						class="text-xs font-black tracking-widest uppercase text-stone-400 border-b border-stone-850/80 pb-3"
					>
						Profile details
					</h2>
					<form
						method="POST"
						action="?/updateProfile"
						use:enhance={handleProfileEnhance}
						class="space-y-6"
					>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div class="space-y-2">
								<label
									for="firstName"
									class="text-xs font-black tracking-widest uppercase text-stone-500"
									>First Name</label
								>
								<input
									type="text"
									name="firstName"
									value={user?.firstName}
									required
									placeholder="John"
									class="w-full bg-stone-900/30 text-white border-2 border-stone-850 hover:border-stone-800 focus:border-stone-600 focus:outline-none rounded-xl px-4 py-3 text-sm select-text transition-colors"
								/>
								{#if form?.errors?.firstName}
									<p class="text-xs text-red-500 font-bold">{form.errors.firstName[0]}</p>
								{/if}
							</div>
							<div class="space-y-2">
								<label
									for="lastName"
									class="text-xs font-black tracking-widest uppercase text-stone-500"
									>Last Name</label
								>
								<input
									type="text"
									name="lastName"
									value={user?.lastName}
									required
									placeholder="Doe"
									class="w-full bg-stone-900/30 text-white border-2 border-stone-850 hover:border-stone-800 focus:border-stone-600 focus:outline-none rounded-xl px-4 py-3 text-sm select-text transition-colors"
								/>
								{#if form?.errors?.lastName}
									<p class="text-xs text-red-500 font-bold">{form.errors.lastName[0]}</p>
								{/if}
							</div>
						</div>
						<div class="flex justify-end">
							<button
								type="submit"
								class="px-6 py-3 bg-white text-black hover:bg-stone-200 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
							>
								Save Changes
							</button>
						</div>
					</form>
				</div>

				<!-- Change Password Form -->
				<div class="bg-stone-900/20 border-3 border-stone-850 rounded-3xl p-8 space-y-6">
					<div class="flex items-center justify-between border-b border-stone-850/80 pb-3">
						<h2 class="text-xs font-black tracking-widest uppercase text-stone-400">
							Security Settings
						</h2>
						<button
							type="button"
							onclick={() => (isChangingPassword = !isChangingPassword)}
							class="text-xs font-black tracking-widest uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
						>
							{isChangingPassword ? 'Cancel' : 'Change Password'}
						</button>
					</div>

					{#if isChangingPassword}
						<form method="POST" action="?/changePassword" use:enhance class="space-y-6">
							<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div class="space-y-2">
									<label
										for="currentPassword"
										class="text-xs font-black tracking-widest uppercase text-stone-500"
										>Current Password</label
									>
									<input
										type="password"
										name="currentPassword"
										required
										placeholder="••••••••"
										class="w-full bg-stone-900/30 text-white border-2 border-stone-850 hover:border-stone-800 focus:border-stone-600 focus:outline-none rounded-xl px-4 py-3 text-sm select-text transition-colors"
									/>
									{#if form?.errors?.currentPassword}
										<p class="text-xs text-red-500 font-bold">{form.errors.currentPassword[0]}</p>
									{/if}
								</div>
								<div class="space-y-2">
									<label
										for="newPassword"
										class="text-xs font-black tracking-widest uppercase text-stone-500"
										>New Password</label
									>
									<input
										type="password"
										name="newPassword"
										required
										placeholder="••••••••"
										class="w-full bg-stone-900/30 text-white border-2 border-stone-850 hover:border-stone-800 focus:border-stone-600 focus:outline-none rounded-xl px-4 py-3 text-sm select-text transition-colors"
									/>
									{#if form?.errors?.newPassword}
										<p class="text-xs text-red-500 font-bold">{form.errors.newPassword[0]}</p>
									{/if}
								</div>
							</div>
							<div class="flex justify-end">
								<button
									type="submit"
									class="px-6 py-3 bg-white text-black hover:bg-stone-200 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
								>
									Reset Password
								</button>
							</div>
						</form>
					{:else}
						<div class="flex items-center gap-3 text-stone-500 select-none">
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
								><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path
									d="M7 11V7a5 5 0 0 1 10 0v4"
								/></svg
							>
							<span class="text-xs font-bold tracking-wider uppercase"
								>Password details are hidden for security.</span
							>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
