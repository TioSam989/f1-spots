<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { auth, voting } from '$lib/api';

	let activeVotes = $state([]);
	let voteHistory = $state([]);
	let activeTab = $state('active');
	let error = $state('');
	let loading = $state(false);
	let selectedVote = $state(null);
	let voteComment = $state('');
	let intervalId = null;

	onMount(async () => {
		if (!auth.isSuperAdmin()) {
			goto('/admin');
			return;
		}
		await loadVotes();
		intervalId = setInterval(loadVotes, 10000);
	});

	onDestroy(() => {
		if (intervalId) {
			clearInterval(intervalId);
		}
	});

	async function loadVotes() {
		try {
			loading = true;
			const [active, history] = await Promise.all([
				voting.getActiveVotes(),
				voting.getVoteHistory()
			]);
			activeVotes = active;
			voteHistory = history;
		} catch (err: any) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function castVote(voteId: string, decision: 'APPROVE' | 'REJECT') {
		try {
			error = '';
			await voting.castVote(voteId, decision, voteComment);
			voteComment = '';
			selectedVote = null;
			await loadVotes();
		} catch (err: any) {
			error = err.message;
		}
	}

	function getTimeRemaining(expiresAt: string) {
		const now = new Date().getTime();
		const expiry = new Date(expiresAt).getTime();
		const diff = expiry - now;

		if (diff <= 0) return 'Expired';

		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		return `${hours}h ${minutes}m ${seconds}s`;
	}

	function getCleanupTime(cleanupAt: string) {
		if (!cleanupAt) return '';

		const now = new Date().getTime();
		const cleanup = new Date(cleanupAt).getTime();
		const diff = cleanup - now;

		if (diff <= 0) return 'Cleaning up...';

		const minutes = Math.floor(diff / (1000 * 60));
		const seconds = Math.floor((diff % (1000 * 60)) / 1000);

		return `${minutes}m ${seconds}s`;
	}

	function hasUserVoted(vote: any) {
		const currentUser = auth.getUser();
		return vote.participants?.some((p: any) => p.userId === currentUser.id);
	}

	function getUserVote(vote: any) {
		const currentUser = auth.getUser();
		return vote.participants?.find((p: any) => p.userId === currentUser.id);
	}
</script>

<div class="min-h-screen bg-gray-100">
	<nav class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between h-16">
				<div class="flex items-center gap-4">
					<a href="/admin" class="text-blue-600 hover:text-blue-800">← Back to Dashboard</a>
					<h1 class="text-2xl font-bold text-gray-900">SuperAdmin Voting</h1>
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
						onclick={() => (activeTab = 'active')}
						class={`py-4 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'active'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						Active Votes ({activeVotes.length})
					</button>
					<button
						onclick={() => (activeTab = 'history')}
						class={`py-4 px-1 border-b-2 font-medium text-sm ${
							activeTab === 'history'
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}`}
					>
						Vote History
					</button>
				</nav>
			</div>
		</div>

		{#if activeTab === 'active'}
			<div class="space-y-6">
				{#each activeVotes as vote}
					<div class="bg-white rounded-lg shadow p-6">
						<div class="flex justify-between items-start mb-4">
							<div>
								<h3 class="text-lg font-semibold text-gray-900">
									{vote.type === 'REMOVE_SUPERADMIN' ? 'Remove SuperAdmin' : 'Remove Admin'}
								</h3>
								<p class="text-sm text-gray-600">
									Target: <span class="font-medium">{vote.targetUser.username}</span> ({vote.targetUser.email})
								</p>
								<p class="text-sm text-gray-600">
									Created by: <span class="font-medium">{vote.createdBy.username}</span>
								</p>
								{#if vote.reason}
									<p class="text-sm text-gray-700 mt-2">
										<strong>Reason:</strong> {vote.reason}
									</p>
								{/if}
							</div>
							<div class="text-right">
								<div class="text-sm font-medium text-gray-900">
									Time Remaining: {getTimeRemaining(vote.expiresAt)}
								</div>
								<div class="mt-2">
									<span class="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full mr-2">
										✓ {vote.approveCount}/{vote.requiredVotes}
									</span>
									<span class="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">
										✗ {vote.rejectCount}/{vote.requiredVotes}
									</span>
								</div>
							</div>
						</div>

						{#if vote.comments.length > 0}
							<div class="mt-4 border-t pt-4">
								<h4 class="text-sm font-medium text-gray-700 mb-2">Comments:</h4>
								<div class="space-y-2">
									{#each vote.comments as comment}
										<div class="text-sm bg-gray-50 p-3 rounded">
											<span class="font-medium">{comment.user.username}:</span>
											<span class="text-gray-700">{comment.comment}</span>
											<span class="text-xs text-gray-500 ml-2">
												{new Date(comment.createdAt).toLocaleString()}
											</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if hasUserVoted(vote)}
							<div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
								<p class="text-sm text-blue-800">
									You voted: <strong>{getUserVote(vote).decision}</strong>
									at {new Date(getUserVote(vote).votedAt).toLocaleString()}
								</p>
							</div>
						{:else}
							<div class="mt-4 space-y-3">
								<div>
									<label class="block text-sm font-medium text-gray-700 mb-1">
										Comment (optional)
									</label>
									<textarea
										bind:value={voteComment}
										rows="2"
										class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
										placeholder="Add your thoughts..."
									></textarea>
								</div>
								<div class="flex gap-3">
									<button
										onclick={() => castVote(vote.id, 'APPROVE')}
										class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
									>
										Approve
									</button>
									<button
										onclick={() => castVote(vote.id, 'REJECT')}
										class="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
									>
										Reject
									</button>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="text-center py-12 bg-white rounded-lg shadow">
						<p class="text-gray-500">No active votes</p>
					</div>
				{/each}
			</div>
		{/if}

		{#if activeTab === 'history'}
			<div class="space-y-4">
				{#each voteHistory as vote}
					<div class="bg-white rounded-lg shadow p-6">
						<div class="flex justify-between items-start">
							<div>
								<h3 class="text-lg font-semibold text-gray-900">
									{vote.type === 'REMOVE_SUPERADMIN' ? 'Remove SuperAdmin' : 'Remove Admin'}
								</h3>
								<p class="text-sm text-gray-600">
									Target: <span class="font-medium">{vote.targetUser.username}</span>
								</p>
								<p class="text-sm text-gray-600">
									Created: {new Date(vote.createdAt).toLocaleString()}
								</p>
								<p class="text-sm text-gray-600">
									Closed: {new Date(vote.closedAt).toLocaleString()}
								</p>
								{#if vote.cleanupAt}
									<p class="text-xs text-gray-500 mt-1">
										{new Date() < new Date(vote.cleanupAt)
											? `Will be cleaned up in: ${getCleanupTime(vote.cleanupAt)}`
											: 'Cleaned up'}
									</p>
								{/if}
							</div>
							<div class="text-right">
								<span
									class={`px-3 py-1 rounded-full text-sm ${
										vote.status === 'APPROVED'
											? 'bg-green-100 text-green-800'
											: vote.status === 'REJECTED'
												? 'bg-red-100 text-red-800'
												: 'bg-gray-100 text-gray-800'
									}`}
								>
									{vote.status}
								</span>
								<div class="mt-2 text-sm">
									<span class="text-green-600">✓ {vote.approveCount}</span>
									<span class="mx-2">|</span>
									<span class="text-red-600">✗ {vote.rejectCount}</span>
								</div>
							</div>
						</div>

						{#if vote.comments.length > 0 && new Date() < new Date(vote.cleanupAt || vote.closedAt)}
							<div class="mt-4 border-t pt-4">
								<h4 class="text-sm font-medium text-gray-700 mb-2">Comments:</h4>
								<div class="space-y-2">
									{#each vote.comments as comment}
										<div class="text-sm bg-gray-50 p-3 rounded">
											<span class="font-medium">{comment.user.username}:</span>
											<span class="text-gray-700">{comment.comment}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="text-center py-12 bg-white rounded-lg shadow">
						<p class="text-gray-500">No vote history</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
