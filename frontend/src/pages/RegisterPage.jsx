import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi, departmentsApi } from '../services/api'
import { useEffect } from 'react'
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-gradient shadow-glow mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2">Join the RSO Platform</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange}
                className="input" placeholder="Dr. Jane Smith" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="input" placeholder="user@institution.edu" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className="input" placeholder="At least 8 characters" required minLength={6} />
            </div>
            <div>
              <label className="label">Department</label>
              <select name="department_id" value={form.department_id} onChange={handleChange}
                className="input">
                <option value="">— Select Department —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Role</label>
              <select name="role" value={form.role} onChange={handleChange} className="input">
                <option value="MEMBER">Member</option>
                <option value="DEPT_ADMIN">Department Admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
