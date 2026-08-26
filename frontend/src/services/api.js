import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rso_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rso_token')
      localStorage.removeItem('rso_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// ── Departments ───────────────────────────────────────────────────────────────
export const departmentsApi = {
  list: () => api.get('/departments/'),
  get: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments/', data),
  delete: (id) => api.delete(`/departments/${id}`),
}

// ── Resources ─────────────────────────────────────────────────────────────────
export const resourcesApi = {
  list: (params = {}) => api.get('/resources/', { params }),
  get: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post('/resources/', data),
  update: (id, data) => api.patch(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsApi = {
  list: (params = {}) => api.get('/bookings/', { params }),
  get: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings/', data),
  updateStatus: (id, status, notes) =>
    api.patch(`/bookings/${id}/status`, { status, notes }),
  cancel: (id) => api.delete(`/bookings/${id}`),
  pendingApprovals: () => api.get('/bookings/pending-approvals'),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  utilization: (days = 30) => api.get('/analytics/utilization', { params: { days } }),
  dashboard: () => api.get('/analytics/dashboard'),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users/'),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.patch(`/users/${id}`, data),
}

export default api
