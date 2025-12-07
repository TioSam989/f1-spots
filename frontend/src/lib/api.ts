const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let token: string | null = null;

export function setToken(newToken: string | null) {
  token = newToken;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
}

export function getToken() {
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }
  return token;
}

async function request(endpoint: string, options: RequestInit = {}) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const authToken = getToken();
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const auth = {
  async login(username: string, password: string) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access_token);
    return data;
  },

  async register(username: string, email: string, password: string) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  async getProfile() {
    return request('/auth/profile');
  },

  logout() {
    setToken(null);
  },
};

export const spots = {
  async getAll() {
    return request('/spots');
  },

  async getNearby(lat: number, lng: number, radius: number = 10) {
    return request(`/spots/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  },

  async getOne(id: string) {
    return request(`/spots/${id}`);
  },

  async create(data: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    privacyLevel: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
    images?: string[];
  }) {
    return request('/spots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    privacyLevel: 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';
    images: string[];
  }>) {
    return request(`/spots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string) {
    return request(`/spots/${id}`, {
      method: 'DELETE',
    });
  },

  async getStats() {
    return request('/spots/stats');
  },
};
