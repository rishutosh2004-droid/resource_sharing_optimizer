import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/api'
import { LoadingPage, ErrorMessage, PageHeader } from '../components/ui'
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Sparkles } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'

const DEPT_COLORS = ['#4f46e5', '#059669', '#d97706', '#7c3aed', '#0284c7']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-lg">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? `${p.value.toFixed(1)}%` : p.value}
        </p>
      ))}
    </div>
  )
}

function UtilizationBar({ record }) {
  const pct = record.utilization_pct
  const color = pct >= 70 ? '#10b981' : pct >= 30 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-semibold text-slate-800 truncate">{record.resource_name}</p>
          <span className="text-sm font-bold ml-2" style={{ color }}>{pct.toFixed(1)}%</span>
        </div>
        <p className="text-xs text-slate-500 mb-2">{record.department} · {record.category}</p>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
          />
        </div>
      </div>
      {record.is_underutilized && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex-shrink-0">
          <AlertTriangle className="w-3 h-3 text-rose-500" />
          Underutilized
        </span>
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
      setError('Failed to load analytics. Please check that the server is reachable.')
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
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Analytics & Utilization"
          subtitle={`Pandas engine analysis from ${data.period_start.slice(0, 10)} to ${data.period_end.slice(0, 10)}`}
        />
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm self-start">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                days === d
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tracked Assets', value: data.total_resources, color: 'text-indigo-600', sub: 'In catalog' },
          { label: 'Overall Utilization', value: `${data.overall_utilization_pct?.toFixed(1)}%`, color: 'text-emerald-600', sub: 'Institutional avg' },
          { label: 'Underutilized (<30%)', value: data.suggestions.length, color: 'text-amber-600', sub: 'Needs sharing' },
          { label: 'Analysis Window', value: `${days} Days`, color: 'text-sky-600', sub: 'Timeframe' },
        ].map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <p className={`text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-1">{s.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Optimization Recommendations Banner */}
      {data.suggestions.length > 0 && (
        <div className="card p-6 bg-amber-50/40 border border-amber-200/80">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Resource Sharing Recommendations</h2>
              <p className="text-xs text-slate-500">AI-assisted recommendations based on low utilization thresholds</p>
            </div>
            <span className="badge badge-warning ml-auto">{data.suggestions.length} recommendations</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {data.suggestions.map((s) => (
              <div
                key={s.resource_id}
                className="flex items-start gap-3 p-4 rounded-xl bg-white border border-amber-200/60 shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 leading-relaxed">{s.suggestion}</p>
                  {s.recommended_departments.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-slate-500">Target sharing:</span>
                      {s.recommended_departments.map((dept) => (
                        <span key={dept} className="badge badge-info text-[11px]">{dept}</span>
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
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-bold text-slate-900 text-base">Department Average Utilization</h2>
              <p className="text-xs text-slate-500">Aggregated usage percentage across faculties</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="utilization" name="Utilization" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {deptChartData.map((_, i) => (
                  <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resource Utilization Bar Chart */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="font-bold text-slate-900 text-base">Top Utilized Assets</h2>
              <p className="text-xs text-slate-500">Highest hours booked in selected timeframe</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={resourceChartData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="utilization" name="Utilization" fill="#4f46e5" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {resourceChartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.utilization >= 70 ? '#10b981'
                      : entry.utilization >= 30 ? '#f59e0b'
                      : '#ef4444'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Resources Utilization List */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Asset Utilization Breakdown</h2>
            <p className="text-xs text-slate-500">Comprehensive utilization rates for every registered asset</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Underutilized (&lt;30%)</span>
            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate (30–70%)</span>
            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Optimal (&gt;70%)</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {data.utilization_records
            .sort((a, b) => a.utilization_pct - b.utilization_pct)
            .map((r) => (
              <UtilizationBar key={r.resource_id} record={r} />
            ))
          }
        </div>
      </div>
    </div>
  )
}
