const STORAGE_KEY = "thueBanDongHanhUserId";

/**
 * Gốc gọi API. Mặc định: cùng origin với trang (host + cổng hiện tại).
 * - `npm run dev`: live-server proxy `/api` → backend `http://127.0.0.1:3001/api`
 * - Chạy static từ Express (cổng 3001): `/api` có sẵn trên cùng origin
 * Ghi đè: `window.__API_BASE__ = 'http://127.0.0.1:3001'`
 */
export function getApiBase() {
  const custom = window.__API_BASE__;
  if (custom != null && String(custom).trim() !== "") {
    return String(custom).replace(/\/$/, "");
  }
  return `${window.location.protocol}//${window.location.host}`;
}

if (typeof window !== "undefined") {
  window.getApiBase = getApiBase;
}

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
  const res = await fetch(`${getApiBase()}${path}`, { headers: headers() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

export async function apiPost(path, body) {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || res.statusText);
  return data;
}

export async function apiDelete(path) {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "DELETE",
    headers: headers(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || res.statusText);
  return data;
}

export async function apiPatch(path, body) {
  const res = await fetch(`${getApiBase()}${path}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || res.statusText);
  return data;
}

/** GET/PATCH linh hoạt — trả `{ data }` nếu JSON có field `data`, không thì bọc cả object. */
export async function apiFetch(path, options = {}) {
  const { method = "GET", body, headers: extraHeaders = {} } = options;
  const init = {
    method,
    headers: headers(extraHeaders),
  };
  if (body !== undefined && method !== "GET" && method !== "HEAD") {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  const res = await fetch(`${getApiBase()}${path}`, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || res.statusText);
  if (json && typeof json === "object" && "data" in json) {
    return { data: json.data };
  }
  return { data: json };
}

export function formatCurrencyVND(n) {
  const x = Number(n);
  if (Number.isNaN(x)) return "0₫";
  return `${x.toLocaleString("vi-VN")}₫`;
}

export async function bootstrapUserId() {
  if (getStoredUserId()) return;
  const me = await apiGet("/api/users/me");
  if (me?._id) setStoredUserId(me._id);
}
