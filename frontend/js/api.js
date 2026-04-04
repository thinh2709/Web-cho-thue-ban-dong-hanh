const STORAGE_KEY = "thueBanDongHanhUserId";

export const API_BASE =
  window.__API_BASE__ ?? `${window.location.protocol}//${window.location.hostname}:3000`;

export function getStoredUserId() {
  return localStorage.getItem(STORAGE_KEY);
}

export function setStoredUserId(id) {
  if (id) localStorage.setItem(STORAGE_KEY, id);
  else localStorage.removeItem(STORAGE_KEY);
}

function headers(extra = {}) {
  const h = { "Content-Type": "application/json", ...extra };
  const uid = getStoredUserId();
  if (uid) h["X-User-Id"] = uid;
  return h;
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export async function apiPatch(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}
