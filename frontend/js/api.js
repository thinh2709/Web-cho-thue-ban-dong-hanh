const BASE_URL = 'http://localhost:5000/api';

const api = {
  // Categories
  getCategories: async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    return await res.json();
  },
  getCategory: async (id) => {
    const res = await fetch(`${BASE_URL}/categories/${id}`);
    return await res.json();
  },
  createCategory: async (data) => {
    const res = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
  updateCategory: async (id, data) => {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
  deleteCategory: async (id) => {
    const res = await fetch(`${BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    return await res.json();
  },

  // Partners
  registerPartner: async (data) => {
    const res = await fetch(`${BASE_URL}/partners/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
  getPartnerApplications: async () => {
    const res = await fetch(`${BASE_URL}/partners/applications`);
    return await res.json();
  },
  reviewPartnerApplication: async (id, data) => {
    const res = await fetch(`${BASE_URL}/partners/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  },
};

export default api;
