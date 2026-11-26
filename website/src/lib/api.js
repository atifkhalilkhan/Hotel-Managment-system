// Backend API ka base URL: poori website isi ek jagah se leti hai
export const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:2008/api").replace(/\/+$/, "");
