<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/api';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	onMount(() => {
		if (auth.isAuthenticated() && auth.isAdmin()) {
			goto('/admin');
		}
	});

	async function handleLogin() {
		try {
			error = '';
			loading = true;
			await auth.login(email, password);
			if (auth.isAdmin()) {
				goto('/admin');
			} else {
				error = 'Access restricted to administrators';
				auth.logout();
			}
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
	<div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-2">F1 Spots</h1>
			<p class="text-gray-600">Admin Dashboard</p>
		</div>

		{#if error}
			<div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
				{error}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
					Email
				</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="admin@example.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
					Password
				</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-md transition-colors"
			>
				{loading ? 'Logging in...' : 'Login'}
			</button>
		</form>

		<div class="mt-6 text-center text-sm text-gray-600">
			<p>Admin access only</p>
		</div>
	</div>
</div>
