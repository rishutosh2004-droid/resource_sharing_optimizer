import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const DEMO_ACCOUNTS = [
    { label: 'Super Admin', email: 'admin@institution.edu', password: 'admin123' },
    { label: 'CS Admin', email: 'cs.admin@institution.edu', password: 'admin123' },
    { label: 'Bio Admin', email: 'bio.admin@institution.edu', password: 'admin123' },
    { label: 'CS Member', email: 'john.doe@institution.edu', password: 'member123' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
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
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-gradient shadow-glow mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">RSO Platform</h1>
          <p className="text-gray-400 mt-2">Resource Sharing Optimizer</p>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="user@institution.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Demo accounts */}
        <div className="card p-4 mt-4">
          <p className="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wider">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => fillDemo(acc)}
                className="text-left p-2 rounded-lg bg-surface border border-surface-border hover:border-brand-700 transition-colors group"
              >
                <p className="text-xs font-semibold text-brand-400 group-hover:text-brand-300">{acc.label}</p>
                <p className="text-xs text-gray-500 truncate">{acc.email}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
