<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth, admin } from '$lib/api';

	let stats = $state({ totalUsers: 0, approvedUsers: 0, pendingUsers: 0, totalSpots: 0, publicSpots: 0 });
	let pendingUsers = $state([]);
	let allUsers = $state([]);
	let invites = $state([]);
	let inviteEmail = $state('');
	let activeTab = $state('overview');
	let newInvite = $state(null);
	let loading = $state(false);
	let error = $state('');

	onMount(async () => {
		if (!auth.isAuthenticated() || !auth.isAdmin()) {
			goto('/');
			return;
		}
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			const [statsData, pending, users, invitesData] = await Promise.all([
				admin.getStats(),
				admin.getPendingUsers(),
				admin.getAllUsers(),
				admin.getInvites()
			]);
			stats = statsData;
			pendingUsers = pending;
			allUsers = users;
			invites = invitesData;
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function createInvite() {
		try {
			error = '';
			const result = await admin.createInvite(inviteEmail);
			newInvite = result;
			inviteEmail = '';
			await loadData();
		} catch (err: any) {
			error = err.message;
		}
	}

	async function approveUser(userId: string) {
		try {
			await admin.approveUser(userId);
			await loadData();
		} catch (err: any) {
			error = err.message;
		}
	}

	async function rejectUser(userId: string) {
		try {
			await admin.rejectUser(userId);
			await loadData();
		} catch (err: any) {
			error = err.message;
		}
	}

	function copyInviteLink(link: string) {
		navigator.clipboard.writeText(link);
		alert('Invite link copied!');
	}

	function logout() {
		auth.logout();
		goto('/');
	}
</script>

<div class="min-h-screen bg-gray-100">
	<nav class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center">
					<h1 class="text-2xl font-bold text-gray-900">F1 Spots Admin</h1>
				</div>
				<div class="flex items-center gap-4">
					<span class="text-sm text-gray-600">{auth.getUser()?.username}</span>
					<button
						onclick={logout}
						class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
					>
						Logout
					</button>
				</div>
			</div>
		</div>
	</nav>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
		{#if error}
			<div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
				{error}
			</div>
		{/if}

		<div class="mb-6">
			<div class="border-b border-gray-200">
				<nav class="-mb-px flex space-x-8">
					<button
						onclick={() => (activeTab = 'overview')}
						class={`py-4 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'overview'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						Overview
					</button>
					<button
						onclick={() => (activeTab = 'pending')}
						class={`py-4 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'pending'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						Pending Users ({pendingUsers.length})
					</button>
					<button
						onclick={() => (activeTab = 'users')}
						class={`py-4 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'users'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						All Users
					</button>
					<button
						onclick={() => (activeTab = 'invites')}
						class={`py-4 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'invites'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						Invites
					</button>
				</nav>
			</div>
		</div>

		{#if activeTab === 'overview'}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-700 mb-2">Total Users</h3>
					<p class="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-700 mb-2">Approved Users</h3>
					<p class="text-3xl font-bold text-green-600">{stats.approvedUsers}</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-700 mb-2">Pending Approval</h3>
					<p class="text-3xl font-bold text-yellow-600">{stats.pendingUsers}</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-700 mb-2">Total Spots</h3>
					<p class="text-3xl font-bold text-purple-600">{stats.totalSpots}</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<h3 class="text-lg font-semibold text-gray-700 mb-2">Public Spots</h3>
					<p class="text-3xl font-bold text-indigo-600">{stats.publicSpots}</p>
				</div>
			</div>
		{/if}

		{#if activeTab === 'pending'}
			<div class="bg-white rounded-lg shadow overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-xl font-semibold text-gray-800">Pending User Approvals</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instagram</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each pendingUsers as user}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{user.username}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{user.instagramHandle || '-'}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{new Date(user.createdAt).toLocaleDateString()}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
										<button
											onclick={() => approveUser(user.id)}
											class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
										>
											Approve
										</button>
										<button
											onclick={() => rejectUser(user.id)}
											class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
										>
											Reject
										</button>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="5" class="px-6 py-4 text-center text-gray-500">
										No pending users
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		{#if activeTab === 'users'}
			<div class="bg-white rounded-lg shadow overflow-hidden">
				<div class="px-6 py-4 border-b border-gray-200">
					<h2 class="text-xl font-semibold text-gray-800">All Users</h2>
				</div>
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200">
						<thead class="bg-gray-50">
							<tr>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instagram</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
								<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							{#each allUsers as user}
								<tr>
									<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
										{user.username}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{user.instagramHandle || '-'}
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<span
											class={`px-2 py-1 rounded-full text-xs ${
												user.role === 'ADMIN'
													? 'bg-purple-100 text-purple-800'
													: 'bg-gray-100 text-gray-800'
											}`}
										>
											{user.role}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm">
										<span
											class={`px-2 py-1 rounded-full text-xs ${
												user.isApproved
													? 'bg-green-100 text-green-800'
													: 'bg-yellow-100 text-yellow-800'
											}`}
										>
											{user.isApproved ? 'Approved' : 'Pending'}
										</span>
									</td>
									<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{new Date(user.createdAt).toLocaleDateString()}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		{#if activeTab === 'invites'}
			<div class="space-y-6">
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-xl font-semibold text-gray-800 mb-4">Create New Invite</h2>
					<div class="flex gap-4">
						<input
							type="email"
							bind:value={inviteEmail}
							placeholder="user@example.com"
							class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<button
							onclick={createInvite}
							class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
						>
							Create Invite
						</button>
					</div>

					{#if newInvite}
						<div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
							<p class="text-sm font-medium text-green-800 mb-2">Invite created successfully!</p>
							<p class="text-sm text-gray-700 mb-2">
								<strong>Code:</strong>
								{newInvite.inviteCode}
							</p>
							<p class="text-sm text-gray-700 mb-2">
								<strong>Expires:</strong>
								{new Date(newInvite.expiresAt).toLocaleString()}
							</p>
							<div class="flex gap-2 mt-2">
								<input
									type="text"
									value={newInvite.inviteLink}
									readonly
									class="flex-1 px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50"
								/>
								<button
									onclick={() => copyInviteLink(newInvite.inviteLink)}
									class="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
								>
									Copy Link
								</button>
							</div>
						</div>
					{/if}
				</div>

				<div class="bg-white rounded-lg shadow overflow-hidden">
					<div class="px-6 py-4 border-b border-gray-200">
						<h2 class="text-xl font-semibold text-gray-800">All Invites</h2>
					</div>
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Email
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Code
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Status
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Expires
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
										Created
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each invites as invite}
									<tr>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{invite.email}</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
											{invite.code.substring(0, 8)}...
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm">
											<span
												class={`px-2 py-1 rounded-full text-xs ${
													invite.isUsed
														? 'bg-green-100 text-green-800'
														: new Date() > new Date(invite.expiresAt)
															? 'bg-red-100 text-red-800'
															: 'bg-blue-100 text-blue-800'
												}`}
											>
												{invite.isUsed ? 'Used' : new Date() > new Date(invite.expiresAt) ? 'Expired' : 'Active'}
											</span>
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(invite.expiresAt).toLocaleString()}
										</td>
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
											{new Date(invite.createdAt).toLocaleDateString()}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
