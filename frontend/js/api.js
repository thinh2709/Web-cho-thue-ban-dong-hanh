(function () {
  const DEFAULT_BASE_URL = "http://localhost:5000";
  const API_BASE = String(window.API_BASE || DEFAULT_BASE_URL).replace(/\/+$/, "");

  function getToken() {
    return localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  }

  function setToken(token, remember) {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    if (!token) return;

    if (remember) {
      localStorage.setItem("token", token);
    } else {
      sessionStorage.setItem("token", token);
    }
  }

  function clearToken() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  }

  async function request(path, options) {
    const method = options?.method || "GET";
    const body = options?.body;
    const token = options?.token;

    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || "Request failed");
    }

    return data;
  }

  async function login({ email, password }) {
    return request("/api/auth/login", { method: "POST", body: { email, password } });
  }

  async function register({ name, email, password }) {
    return request("/api/auth/register", { method: "POST", body: { name, email, password } });
  }

  async function me() {
    const token = getToken();
    return request("/api/auth/me", { token });
  }

  window.api = {
    API_BASE,
    request,
    login,
    register,
    me,
    getToken,
    setToken,
    clearToken,
  };
})();
