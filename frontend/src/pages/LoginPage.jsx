import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Mail, Lock, AlertCircle, Sparkles } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const DEMO_ACCOUNTS = [
    { label: 'Super Admin', email: 'admin@institution.edu', password: 'admin123', desc: 'Global Control' },
    { label: 'CS Admin', email: 'cs.admin@institution.edu', password: 'admin123', desc: 'CS Approvals' },
    { label: 'Bio Admin', email: 'bio.admin@institution.edu', password: 'admin123', desc: 'Bio Approvals' },
    { label: 'CS Member', email: 'john.doe@institution.edu', password: 'member123', desc: 'Researcher' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please verify your email and password.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (acc) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in space-y-6">
        {/* Logo and App Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-md mb-3">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">RSO Platform</h1>
          <p className="text-sm text-slate-500 mt-1">Resource Sharing & Utilization Optimizer</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Sign In</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your institutional credentials to access your account</p>

          {error && (
            <div className="flex items-center gap-2.5 text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-5 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="name@institution.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 font-semibold"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Need a new account?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Quick-fill Demo Accounts */}
        <div className="card p-5 bg-white">
          <div className="flex items-center gap-1.5 mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick-fill Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc)}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-indigo-50/70 hover:border-indigo-300 transition-all group"
              >
                <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">{acc.label}</p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{acc.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
