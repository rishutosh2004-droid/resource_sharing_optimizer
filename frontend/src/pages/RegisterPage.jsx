import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi, departmentsApi } from '../services/api'
import { Zap, AlertCircle } from 'lucide-react'

export function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', department_id: '', role: 'MEMBER',
  })
  const [departments, setDepartments] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    departmentsApi.list().then((r) => setDepartments(r.data)).catch(() => {})
  }, [])

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        ...form,
        department_id: form.department_id ? parseInt(form.department_id) : null,
      }
      await authApi.register(payload)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-md mb-3">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h1>
          <p className="text-sm text-slate-500 mt-1">Join the Resource Sharing Optimizer Platform</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="flex items-center gap-2.5 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-5 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                className="input"
                placeholder="Dr. Jane Smith"
                required
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="user@institution.edu"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="input"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="label">Department</label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">— Select Department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Account Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="input"
              >
                <option value="MEMBER">Member (Standard Researcher)</option>
                <option value="DEPT_ADMIN">Department Admin</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-semibold mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
