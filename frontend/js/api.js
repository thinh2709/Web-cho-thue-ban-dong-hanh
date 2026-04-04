const DEFAULT_BASE_URL = "http://localhost:4000";

export function getBaseUrl() {
  const url = localStorage.getItem("BASE_URL");
  return url && url.trim() ? url.trim() : DEFAULT_BASE_URL;
}

export async function apiFetch(path, options = {}) {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": "demo-user",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = body?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return body;
}

export function formatCurrencyVND(amount) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
}
