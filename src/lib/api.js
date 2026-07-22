import axios from "axios";

const API_BASE =  "https://hr.dimeapp.co.ke";

const TOKEN_KEY = "hrp_access";
const REFRESH_KEY = "hrp_refresh";

export const tokenStore = {
  get access() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set({ access, refresh }) {
    if (access) localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function extractMessage(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  const detail = data.detail ?? data.message ?? data.error;
  if (detail) {
    if (typeof detail === "string") return detail;
    // Nested field errors: {field: ["msg"]} or {field: "msg"}
    if (typeof detail === "object") {
      for (const v of Object.values(detail)) {
        if (Array.isArray(v) && v.length) return v[0];
        if (typeof v === "string") return v;
      }
    }
  }
  for (const v of Object.values(data)) {
    if (Array.isArray(v) && v.length) return v[0];
    if (typeof v === "string") return v;
  }
  return null;
}

// Core axios instance
const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Attach Bearer token to every request
client.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Flag to prevent concurrent refresh loops
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
}

// Auto-refresh on 401
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (!tokenStore.refresh) {
        tokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return client(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post("/api/v1/auth/refresh/", {
          refresh: tokenStore.refresh,
        });
        const { access, refresh } = res.data;
        tokenStore.set({ access, refresh });
        processQueue(null, access);
        original.headers.Authorization = `Bearer ${access}`;
        return client(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStore.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // Normalize error into ApiError
    const data = error.response?.data;
    const message =
      extractMessage(data) ||
      `Request failed (${error.response?.status ?? "network"})`;
    return Promise.reject(new ApiError(message, error.response?.status, data));
  },
);

export const api = {
  get: (path, params) => client.get(path, { params }).then((r) => r.data),

  post: (path, body, opts = {}) =>
    client.post(path, body, opts).then((r) => r.data),

  patch: (path, body) => client.patch(path, body).then((r) => r.data),

  put: (path, body) => client.put(path, body).then((r) => r.data),

  del: (path) => client.delete(path).then((r) => r.data),

  postForm: (path, formData) =>
    client.postForm(path, formData).then((r) => r.data),
};

// ---- Endpoint helpers mapped to Django URL patterns ----
export const endpoints = {
  // Auth — custom User uses email as USERNAME_FIELD
login: (data) =>
    client.post("/api/v1/auth/login/", data, { _noAuth: true }).then((r) => r.data),
  tokenRefresh: (refresh) =>
    client.post("/api/v1/auth/refresh/", { refresh }).then((r) => r.data),

  // Dashboard summary
  dashboard: (params) => api.get("/api/v1/dashboard/", params),

  // Organization
  myOrganization: () => api.get("/api/v1/organization/"),

  // HR User management
  users: (params) => api.get("/api/v1/users/", params),
  user: (pk) => api.get(`/api/v1/users/${pk}/`),
  createUser: (data) => api.post("/api/v1/users/", data),
  deactivateUser: (pk) => api.del(`/api/v1/users/${pk}/`),

  // Payroll uploads
  uploads: (params) => api.get("/api/v1/uploads/", params),
  upload: (pk) => api.get(`/api/v1/uploads/${pk}/`),
  createUpload: (formData) => api.postForm("/api/v1/uploads/", formData),
  deleteUpload: (pk) => api.del(`/api/v1/uploads/${pk}/`),
  uploadDeductions: (uploadId) => api.get("api/v1/deductions/", { upload: uploadId, page_size: 500 }),
  downloadTemplate: () =>
    client.get("/api/v1/uploads/template/", { responseType: "blob" }).then((r) => r.data),

  // Salary deductions
  deductions: (params) => api.get("/api/v1/deductions/", params),
  deduction: (pk) => api.get(`/api/v1/deductions/${pk}/`),

  // Repayment batches
  batches: (params) => api.get("/api/v1/batches/", params),
  batch: (pk) => api.get(`/api/v1/batches/${pk}/`),
  approveBatch: (pk) => api.post(`/api/v1/batches/${pk}/approve/`, { confirm: true }),

  // Repayment records
  records: (params) => api.get("/api/v1/records/", params),

  // System health
  health: () => api.get("/api/v1/health/"),
};
