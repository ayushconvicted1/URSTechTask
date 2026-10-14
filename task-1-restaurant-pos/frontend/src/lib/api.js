const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pos_token');
};

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pos_token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('pos_user');
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pos_user', JSON.stringify(user));
  }
};

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...(!options.isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    body: options.isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

export const api = {
  login: async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setAuthToken(data.token);
    setStoredUser(data.user);
    return data;
  },

  getMe: () => request('/auth/me'),

  getMenu: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/menu${query ? `?${query}` : ''}`);
  },

  createMenuItem: (data) =>
    request('/menu', {
      method: 'POST',
      body: data
    }),

  updateMenuItem: (id, data) =>
    request(`/menu/${id}`, {
      method: 'PUT',
      body: data
    }),

  toggleMenuItem: (id) =>
    request(`/menu/${id}/toggle`, {
      method: 'PATCH'
    }),

  deleteMenuItem: (id) =>
    request(`/menu/${id}`, {
      method: 'DELETE'
    }),

  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? `?${query}` : ''}`);
  },

  getOrderById: (id) => request(`/orders/${id}`),

  createOrder: (orderData) =>
    request('/orders', {
      method: 'POST',
      body: orderData
    }),

  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: { status }
    }),

  recordPayment: (id, paymentMethod) =>
    request(`/orders/${id}/payment`, {
      method: 'POST',
      body: { paymentMethod }
    }),

  getDailySales: (date) => {
    const query = date ? `?date=${date}` : '';
    return request(`/reports/daily-sales${query}`);
  },

  uploadImage: async (file, folder = 'menu') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return request('/upload', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  },

  downloadOrdersCsv: async () => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/reports/orders/csv`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
    if (!res.ok) throw new Error('Failed to download orders CSV');
    return res.blob();
  }
};
