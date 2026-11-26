import clsx from 'clsx'

const STATUS_CONFIG = {
  // Booking statuses
  PENDING:     { label: 'Pending',     cls: 'badge-warning' },
  APPROVED:    { label: 'Approved',    cls: 'badge-success' },
  REJECTED:    { label: 'Rejected',    cls: 'badge-danger' },
  CANCELLED:   { label: 'Cancelled',   cls: 'badge-neutral' },
  COMPLETED:   { label: 'Completed',   cls: 'badge-info' },
  // Resource statuses
  ACTIVE:      { label: 'Active',      cls: 'badge-success' },
  MAINTENANCE: { label: 'Maintenance', cls: 'badge-warning' },
  RETIRED:     { label: 'Retired',     cls: 'badge-neutral' },
  // User roles
  SUPER_ADMIN: { label: 'Super Admin', cls: 'badge-purple' },
  DEPT_ADMIN:  { label: 'Dept Admin',  cls: 'badge-info' },
  MEMBER:      { label: 'Member',      cls: 'badge-neutral' },
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, cls: 'badge-neutral' }
  return <span className={config.cls}>{config.label}</span>
}

export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-indigo-600 border-r-transparent', sizes[size])} />
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <LoadingSpinner size="lg" />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mb-4 max-w-sm">{subtitle}</p>}
      {action}
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-center">
      <p className="text-rose-700 text-sm font-medium mb-2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs px-3 py-1">
          Try Again
        </button>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
