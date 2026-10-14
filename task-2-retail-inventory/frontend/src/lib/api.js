const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('retail_token');
};

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('retail_token', token);
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('retail_token');
    localStorage.removeItem('retail_user');
  }
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('retail_user');
  return user ? JSON.parse(user) : null;
};

export const setStoredUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('retail_user', JSON.stringify(user));
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

  if (options.isCsv) {
    if (!response.ok) {
      throw new Error(`Failed to download report (status ${response.status})`);
    }
    return response.blob();
  }

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

  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },

  getProductById: (id) => request(`/products/${id}`),

  createProduct: (data) =>
    request('/products', {
      method: 'POST',
      body: data
    }),

  updateProduct: (id, data) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: data
    }),

  getLowStock: () => request('/inventory/low-stock'),

  adjustInventory: (data) =>
    request('/inventory/adjustments', {
      method: 'POST',
      body: data
    }),

  getMovements: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inventory/movements${query ? `?${query}` : ''}`);
  },

  createSale: (saleData) =>
    request('/sales', {
      method: 'POST',
      body: saleData
    }),

  getSales: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? `?${query}` : ''}`);
  },

  getSaleById: (id) => request(`/sales/${id}`),

  returnSale: (id, reason) =>
    request(`/sales/${id}/return`, {
      method: 'POST',
      body: { reason }
    }),

  getSalesReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/sales${query ? `?${query}` : ''}`);
  },

  getProfitReport: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/profit${query ? `?${query}` : ''}`);
  },

  downloadSalesCsv: () =>
    request('/reports/sales/csv', {
      method: 'GET',
      isCsv: true
    }),

  uploadImage: async (file, folder = 'products') => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);
    return request('/upload', {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  }
};
