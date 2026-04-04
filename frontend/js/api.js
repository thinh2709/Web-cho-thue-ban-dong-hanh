const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

function getApiBaseUrl() {
  return window.API_BASE_URL || DEFAULT_API_BASE_URL;
}

function getUserId() {
  const existing = localStorage.getItem("x-user-id");
  if (existing) return existing;
  const generated = `demo-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem("x-user-id", generated);
  return generated;
}

async function apiRequest(path, options = {}) {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("x-user-id", getUserId());

  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = json?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return json;
}

window.api = {
  homeFeatured: () => apiRequest("/home/featured"),
  favoritesList: () => apiRequest("/favorites"),
  favoritesAdd: (companionId) => apiRequest("/favorites", { method: "POST", body: JSON.stringify({ companionId }) }),
  favoritesRemove: (companionId) => apiRequest(`/favorites/${encodeURIComponent(companionId)}`, { method: "DELETE" })
};
