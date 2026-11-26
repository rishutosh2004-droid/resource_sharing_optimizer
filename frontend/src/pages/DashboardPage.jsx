import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/api'
import { LoadingPage, ErrorMessage, PageHeader } from '../components/ui'
import {
  Package, CalendarCheck, TrendingUp, AlertTriangle,
  Clock, Building2, ArrowUpRight, Zap, CheckCircle2,
} from 'lucide-react'
import { Link } from 'react-router-dom'

function KPICard({ icon: Icon, label, value, sub, colorClass, bgClass, linkTo }) {
  const content = (
    <div className="kpi-card group cursor-pointer">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${bgClass} flex items-center justify-center transition-transform group-hover:scale-105`}>
          <Icon className={`w-5 h-5 ${colorClass}`} />
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          {sub}
        </span>
      </div>
      <div className="mt-2">
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )

  return linkTo ? <Link to={linkTo}>{content}</Link> : content
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
      icon: Package, label: 'Total Equipment Units', value: kpis.total_units || 51,
      sub: `${kpis.total_resources} unique types`, colorClass: 'text-indigo-600', bgClass: 'bg-indigo-50',
      linkTo: '/resources',
    },
    {
      icon: CalendarCheck, label: 'Active Bookings', value: kpis.active_bookings,
      sub: 'Approved & ongoing', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50',
      linkTo: '/bookings',
    },
    {
      icon: TrendingUp, label: 'Avg Utilization', value: `${kpis.overall_utilization_pct?.toFixed(1)}%`,
      sub: 'Last 30 days', colorClass: 'text-amber-600', bgClass: 'bg-amber-50',
      linkTo: '/analytics',
    },
    {
      icon: AlertTriangle, label: 'Underutilized', value: kpis.underutilized_count,
      sub: '< 30% usage', colorClass: 'text-rose-600', bgClass: 'bg-rose-50',
      linkTo: '/analytics',
    },
    {
      icon: Clock, label: 'Pending Approvals', value: kpis.pending_approvals,
      sub: 'Awaiting review', colorClass: 'text-purple-600', bgClass: 'bg-purple-50',
      linkTo: '/approvals',
    },
    {
      icon: Building2, label: 'Departments', value: kpis.total_departments,
      sub: 'Active faculties', colorClass: 'text-sky-600', bgClass: 'bg-sky-50',
    },
  ]

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader
        title="Dashboard Overview"
        subtitle="Institutional resource capacity, real-time booking metrics, and optimization KPIs"
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* Welcome & Quick Action Card */}
      <div className="card p-6 lg:p-8 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-indigo-100">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100/80 text-indigo-700 mb-3">
            <Zap className="w-3.5 h-3.5" />
            Institutional Resource Sharing
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Maximize equipment efficiency with cross-department scheduling
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            RSO eliminates departmental silos by enabling verified sharing of computing clusters, specialized laboratory equipment, and testing facilities. Real-time distributed locking prevents double bookings, while automated utilization analytics recommend reallocations.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60">
            <Link
              to="/resources"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">Browse Catalog</p>
                <p className="text-xs text-slate-500">Find & reserve gear</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              to="/bookings"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">My Bookings</p>
                <p className="text-xs text-slate-500">Track active slots</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              to="/analytics"
              className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">Utilization Insights</p>
                <p className="text-xs text-slate-500">Optimization recommendations</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
