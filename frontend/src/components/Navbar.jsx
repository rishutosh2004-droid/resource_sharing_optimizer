import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, CalendarCheck, BarChart3,
  Users, LogOut, Zap, ShieldCheck,
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

  const roleBadge = {
    SUPER_ADMIN: { label: 'Super Admin', cls: 'text-purple-700 bg-purple-50 border border-purple-200' },
    DEPT_ADMIN: { label: 'Dept Admin', cls: 'text-indigo-700 bg-indigo-50 border border-indigo-200' },
    MEMBER: { label: 'Member', cls: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  }[user?.role] || { label: 'User', cls: 'text-slate-700 bg-slate-100 border border-slate-200' }

  return (
    <nav className="fixed left-0 top-0 h-full w-60 bg-white border-r border-slate-200 flex flex-col z-40">
      {/* Brand / Logo */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">RSO Platform</h1>
            <p className="text-xs text-slate-500 font-medium">Resource Optimizer</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </p>
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

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-200">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-2">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-slate-500 truncate mb-1">{user?.email}</p>
              <span className={clsx('inline-block text-[11px] font-medium px-2 py-0.5 rounded-full', roleBadge.cls)}>
                {roleBadge.label}
              </span>
            </div>
          </div>
          {user?.department && (
            <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/70 truncate">
              {user.department.name}
            </p>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </nav>
  )
}
