/* Central API client with token handling and consistent backend errors. */
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:2008/api";

async function request(path, { method = "GET", data, headers = {} } = {}) {
  const token = localStorage.getItem("luxurystay-token");
  const response = await fetch(`${baseURL}${path}`, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && !["/auth/login", "/auth/register"].includes(path)) {
      localStorage.removeItem("luxurystay-token");
      window.dispatchEvent(new Event("luxurystay:unauthorized"));
    }
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return payload;
}

const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", data }),
  put: (path, data) => request(path, { method: "PUT", data }),
  patch: (path, data) => request(path, { method: "PATCH", data }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export default api;
