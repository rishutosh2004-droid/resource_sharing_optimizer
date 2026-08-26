import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/api'
import { LoadingPage, ErrorMessage, PageHeader } from '../components/ui'
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, RadialBarChart, RadialBar,
} from 'recharts'

const DEPT_COLORS = ['#6271fa', '#34d399', '#fb923c', '#a78bfa', '#38bdf8']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 shadow-card">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? `${p.value.toFixed(1)}%` : p.value}
        </p>
      ))}
    </div>
  )
}

function UtilizationBar({ record }) {
  const pct = record.utilization_pct
  const color = pct >= 70 ? '#34d399' : pct >= 30 ? '#fb923c' : '#f87171'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-surface-border last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-gray-300 truncate">{record.resource_name}</p>
          <span className="text-sm font-bold ml-2" style={{ color }}>{pct.toFixed(1)}%</span>
        </div>
        <p className="text-xs text-gray-500 mb-1.5">{record.department} · {record.category}</p>
        <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
          />
        </div>
      </div>
      {record.is_underutilized && (
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
      )}
    </div>
  )
}

export function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [days, setDays] = useState(30)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyticsApi.utilization(days)
      setData(res.data)
    } catch {
      setError('Failed to load analytics. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [days])

  if (loading) return <LoadingPage />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  const deptChartData = data.department_summary.map((d) => ({
    name: d.department_code || d.department,
    utilization: parseFloat(d.avg_utilization?.toFixed(1)),
    resources: d.resource_count,
    hours: parseFloat(d.total_booked_hours?.toFixed(1)),
  }))

  const resourceChartData = [...data.utilization_records]
    .sort((a, b) => b.utilization_pct - a.utilization_pct)
    .slice(0, 8)
    .map((r) => ({
      name: r.resource_name.length > 18 ? r.resource_name.slice(0, 16) + '…' : r.resource_name,
      utilization: parseFloat(r.utilization_pct.toFixed(1)),
      hours: parseFloat(r.total_booked_hours.toFixed(1)),
    }))

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Analytics & Optimization"
          subtitle={`Utilization analysis from ${data.period_start.slice(0, 10)} to ${data.period_end.slice(0, 10)}`}
        />
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                days === d
                  ? 'bg-brand-gradient text-white font-semibold'
                  : 'btn-secondary'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Optimization Suggestions Banner */}
      {data.suggestions.length > 0 && (
        <div className="card p-5 border-amber-800/40">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-900/40 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="font-bold text-white">Optimization Recommendations</h2>
            <span className="badge badge-warning">{data.suggestions.length} suggestions</span>
          </div>
          <div className="space-y-3">
            {data.suggestions.map((s) => (
              <div
                key={s.resource_id}
                className="flex items-start gap-3 p-3 rounded-lg bg-amber-900/10 border border-amber-800/30"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-300">{s.suggestion}</p>
                  {s.recommended_departments.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs text-gray-500">Recommend sharing with:</span>
                      {s.recommended_departments.map((dept) => (
                        <span key={dept} className="badge badge-info text-xs">{dept}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Department Utilization Bar Chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <h2 className="font-bold text-white">Department Utilization</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
              <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="utilization" name="Utilization" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {deptChartData.map((_, i) => (
                  <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Utilization Bar Chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-white">Top Resources by Utilization</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={resourceChartData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="utilization" name="Utilization" fill="#6271fa" radius={[0, 4, 4, 0]} maxBarSize={20}>
                {resourceChartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.utilization >= 70 ? '#34d399'
                      : entry.utilization >= 30 ? '#fb923c'
                      : '#f87171'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Resources Utilization List */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-white">Resource Utilization Details</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-red-400 inline-block" /> Underutilized (&lt;30%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-amber-400 inline-block" /> Moderate (30–70%)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-emerald-400 inline-block" /> High (&gt;70%)</span>
          </div>
        </div>
        <div className="divide-y divide-surface-border">
          {data.utilization_records
            .sort((a, b) => a.utilization_pct - b.utilization_pct)
            .map((r) => (
              <UtilizationBar key={r.resource_id} record={r} />
            ))
          }
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Resources', value: data.total_resources, color: 'text-brand-400' },
          { label: 'Overall Utilization', value: `${data.overall_utilization_pct?.toFixed(1)}%`, color: 'text-emerald-400' },
          { label: 'Underutilized', value: data.suggestions.length, color: 'text-amber-400' },
          { label: 'Analysis Period', value: `${days} days`, color: 'text-sky-400' },
        ].map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
