import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, CalendarCheck, BarChart3,
  Users, LogOut, Zap, ShieldCheck, ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/resources', icon: Package, label: 'Resources' },
  { to: '/bookings', icon: CalendarCheck, label: 'My Bookings' },
  { to: '/approvals', icon: ShieldCheck, label: 'Approvals', adminOnly: true },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/users', icon: Users, label: 'Users', superAdminOnly: true },
]

export function Navbar() {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = {
    SUPER_ADMIN: 'Super Admin',
    DEPT_ADMIN: 'Dept Admin',
    MEMBER: 'Member',
  }[user?.role] || 'User'

  const roleColor = {
    SUPER_ADMIN: 'text-purple-400',
    DEPT_ADMIN: 'text-brand-400',
    MEMBER: 'text-emerald-400',
  }[user?.role] || 'text-gray-400'

  return (
    <nav className="fixed left-0 top-0 h-full w-60 bg-surface-card border-r border-surface-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">RSO Platform</h1>
            <p className="text-xs text-gray-500">Resource Optimizer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, adminOnly, superAdminOnly }) => {
          if (superAdminOnly && !isSuperAdmin) return null
          if (adminOnly && !isAdmin) return null

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-link-active' : 'nav-link'
              }
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{label}</span>
            </NavLink>
          )
        })}
      </div>

      {/* User profile */}
      <div className="p-3 border-t border-surface-border">
        <div className="card p-3 mb-2">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              <span className={clsx('text-xs font-semibold', roleColor)}>{roleLabel}</span>
            </div>
          </div>
          {user?.department && (
            <p className="text-xs text-gray-500 mt-2 pl-10">{user.department.name}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="nav-link w-full text-red-400 hover:bg-red-900/20 hover:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  )
}
