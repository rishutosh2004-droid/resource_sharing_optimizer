import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/api'
import { LoadingPage, ErrorMessage, PageHeader } from '../components/ui'
import {
  Package, CalendarCheck, TrendingUp, AlertTriangle,
  Clock, Building2,
} from 'lucide-react'

function KPICard({ icon: Icon, label, value, sub, colorClass, bgClass }) {
  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <span className={`text-xs font-semibold ${colorClass} bg-opacity-20 px-2 py-0.5 rounded-full`}>
          {sub}
        </span>
      </div>
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadKpis = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyticsApi.dashboard()
      setKpis(res.data)
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadKpis() }, [])

  if (loading) return <LoadingPage />
  if (error) return <ErrorMessage message={error} onRetry={loadKpis} />

  const cards = [
    {
      icon: Package, label: 'Total Resources', value: kpis.total_resources,
      sub: 'All resources', colorClass: 'text-brand-400', bgClass: 'bg-brand-900/50',
    },
    {
      icon: CalendarCheck, label: 'Active Bookings', value: kpis.active_bookings,
      sub: 'Approved & ongoing', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-900/30',
    },
    {
      icon: TrendingUp, label: 'Avg Utilization', value: `${kpis.overall_utilization_pct?.toFixed(1)}%`,
      sub: 'Last 30 days', colorClass: 'text-amber-400', bgClass: 'bg-amber-900/30',
    },
    {
      icon: AlertTriangle, label: 'Underutilized', value: kpis.underutilized_count,
      sub: '< 30% usage', colorClass: 'text-red-400', bgClass: 'bg-red-900/30',
    },
    {
      icon: Clock, label: 'Pending Approvals', value: kpis.pending_approvals,
      sub: 'Awaiting review', colorClass: 'text-purple-400', bgClass: 'bg-purple-900/30',
    },
    {
      icon: Building2, label: 'Departments', value: kpis.total_departments,
      sub: 'Active depts', colorClass: 'text-sky-400', bgClass: 'bg-sky-900/30',
    },
  ]

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Institutional resource overview and key performance indicators"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* Welcome banner */}
      <div className="card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-gradient opacity-5 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-lg font-bold text-white mb-2">
            🚀 Welcome to the Resource Sharing Optimizer
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl">
            This platform helps institutions maximize equipment utilization through intelligent
            cross-department resource sharing, real-time booking management, and AI-driven
            optimization recommendations. Navigate to <strong className="text-brand-400">Analytics</strong> to
            see Pandas-powered utilization reports, or visit <strong className="text-brand-400">Resources</strong> to
            browse and book equipment.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
              Redis Distributed Locking Active
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-slow" />
              Pandas Analytics Engine Ready
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-slow" />
              JWT Auth & RBAC Enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
