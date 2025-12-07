const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
	const token = localStorage.getItem('token');

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...options.headers
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.message || 'Something went wrong');
	}

	return response.json();
}

export const auth = {
	async login(email: string, password: string) {
		const data = await apiRequest('/auth/login', {
			method: 'POST',
			body: JSON.stringify({ email, password })
		});
		localStorage.setItem('token', data.access_token);
		localStorage.setItem('user', JSON.stringify(data.user));
		return data;
	},

	async register(registerData: {
		email: string;
		username: string;
		password: string;
		inviteCode: string;
		instagramHandle?: string;
	}) {
		return apiRequest('/auth/register', {
			method: 'POST',
			body: JSON.stringify(registerData)
		});
	},

	logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
	},

	getUser() {
		const user = localStorage.getItem('user');
		return user ? JSON.parse(user) : null;
	},

	isAuthenticated() {
		return !!localStorage.getItem('token');
	},

	isAdmin() {
		const user = this.getUser();
		return user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
	},

	isSuperAdmin() {
		const user = this.getUser();
		return user?.role === 'SUPERADMIN';
	}
};

export const admin = {
	async createInvite(email: string) {
		return apiRequest('/admin/invites', {
			method: 'POST',
			body: JSON.stringify({ email })
		});
	},

	async getInvites() {
		return apiRequest('/admin/invites');
	},

	async getPendingUsers() {
		return apiRequest('/admin/users/pending');
	},

	async getAllUsers() {
		return apiRequest('/admin/users');
	},

	async approveUser(userId: string) {
		return apiRequest(`/admin/users/${userId}/approve`, {
			method: 'PATCH'
		});
	},

	async rejectUser(userId: string) {
		return apiRequest(`/admin/users/${userId}`, {
			method: 'DELETE'
		});
	},

	async getStats() {
		return apiRequest('/admin/stats');
	}
};

export const voting = {
	async createVote(targetUserId: string, type: 'REMOVE_SUPERADMIN' | 'REMOVE_ADMIN', reason?: string) {
		return apiRequest('/voting', {
			method: 'POST',
			body: JSON.stringify({ targetUserId, type, reason })
		});
	},

	async castVote(voteId: string, decision: 'APPROVE' | 'REJECT', comment?: string) {
		return apiRequest(`/voting/${voteId}/cast`, {
			method: 'POST',
			body: JSON.stringify({ decision, comment })
		});
	},

	async getActiveVotes() {
		return apiRequest('/voting/active');
	},

	async getVoteHistory() {
		return apiRequest('/voting/history');
	},

	async getVoteById(voteId: string) {
		return apiRequest(`/voting/${voteId}`);
	}
};
