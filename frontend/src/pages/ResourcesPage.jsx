import { useEffect, useState, useMemo } from 'react'
import { resourcesApi, bookingsApi, departmentsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Modal } from '../components/Modal'
import { StatusBadge, LoadingPage, EmptyState, PageHeader } from '../components/ui'
import {
  Package, Search, Share2,
  Cpu, FlaskConical, Zap, Microscope, Check, Layers,
} from 'lucide-react'
import { format, addHours } from 'date-fns'

const formatPrice = (amount) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(amount)

const CATEGORY_ICONS = {
  'Computing': Cpu,
  'Research Lab': Zap,
  'Analytical Instrument': Microscope,
  'Molecular Biology': FlaskConical,
  'Fabrication': Package,
}

const CATEGORIES = ['Computing', 'Research Lab', 'Analytical Instrument', 'Molecular Biology', 'Fabrication']

function ResourceCard({ resource, onBook }) {
  const Icon = CATEGORY_ICONS[resource.category] || Package
  const isAvailable = resource.status === 'ACTIVE'
  const total = resource.total_quantity || 1
  const avail = resource.available_quantity !== undefined ? resource.available_quantity : total
  const inUse = resource.in_use_quantity || 0

  return (
    <div className="card p-5 flex flex-col gap-4 hover:shadow-md hover:border-indigo-300 transition-all duration-150 group">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isAvailable ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
            {resource.name}
          </h3>
          <p className="text-xs text-slate-500 font-medium">{resource.department?.name || 'General'}</p>
        </div>
        <StatusBadge status={resource.status} />
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
        {resource.description || `${resource.category} institutional equipment.`}
      </p>

      {/* Amount / Inventory Pill Box */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Quantity Owned</span>
          <span className="text-base font-bold text-slate-900">
            {total} <span className="text-xs font-normal text-slate-500">units</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Available Now</span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${
            avail > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${avail > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {avail} of {total} Free
          </span>
        </div>
      </div>

      {/* Cost & Cross-shareable */}
      <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
        <div>
          <span className="text-slate-400">Rate: </span>
          <span className="font-bold text-slate-900">{formatPrice(resource.cost_per_hour)}</span>
          <span className="text-slate-500">/hr</span>
        </div>
        {resource.is_cross_shareable ? (
          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
            Cross-shareable
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium">
            Internal dept only
          </span>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={() => onBook(resource)}
        disabled={!isAvailable}
        className={isAvailable ? 'btn-primary text-sm py-2.5 mt-auto w-full font-semibold' : 'btn-secondary text-sm py-2.5 opacity-50 cursor-not-allowed mt-auto w-full'}
      >
        {isAvailable ? 'Book This Resource' : 'Under Maintenance'}
      </button>
    </div>
  )
}

function BookingModal({ resource, onClose, onSuccess }) {
  const { user } = useAuth()
  const now = new Date()
  const defaultStart = format(addHours(now, 1), "yyyy-MM-dd'T'HH:mm")
  const defaultEnd = format(addHours(now, 3), "yyyy-MM-dd'T'HH:mm")

  const [form, setForm] = useState({
    start_time: defaultStart,
    end_time: defaultEnd,
    purpose: '',
    notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isCrossDept = resource.department_id !== user?.department_id
  const total = resource.total_quantity || 1
  const avail = resource.available_quantity !== undefined ? resource.available_quantity : total

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await bookingsApi.create({
        resource_id: resource.id,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
        purpose: form.purpose,
        notes: form.notes,
      })
      onSuccess()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed. All units may be reserved for this slot.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {isCrossDept && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed flex items-start gap-2">
          <span className="text-sm">⚠️</span>
          <div>
            <strong>Cross-department request:</strong> This asset belongs to <strong>{resource.department?.name}</strong>. Your reservation will require approval from their department administrator.
          </div>
        </div>
      )}

      {/* Resource Amount & Details Banner */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4 text-xs">
        <div>
          <p className="font-bold text-slate-900 text-sm">{resource.name}</p>
          <p className="text-slate-500">{resource.department?.name} · {resource.category}</p>
        </div>
        <div className="text-right">
          <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mb-0.5">
            {avail} of {total} Units Free
          </span>
          <p className="text-slate-900 font-bold text-xs">{formatPrice(resource.cost_per_hour)}/hr</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Start Time</label>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))}
              className="input text-xs sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="label">End Time</label>
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))}
              className="input text-xs sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Purpose of Use *</label>
          <input
            value={form.purpose}
            onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))}
            className="input"
            placeholder="e.g. Lab experimentation, ML training run..."
            required
          />
        </div>

        <div>
          <label className="label">Additional Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            className="input resize-none"
            rows={2}
            placeholder="Special instructions or setup requirements..."
          />
        </div>

        <div className="flex gap-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2 text-sm">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1 py-2 text-sm font-semibold">
            {submitting ? 'Submitting...' : isCrossDept ? 'Submit for Approval' : 'Confirm Instant Booking'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function ResourcesPage() {
  const [resources, setResources] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [crossOnly, setCrossOnly] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [toast, setToast] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (activeCategory) params.category = activeCategory
      if (deptFilter) params.department_id = parseInt(deptFilter)
      if (crossOnly) params.cross_shareable = true

      const [resRes, deptRes] = await Promise.all([
        resourcesApi.list(params),
        departmentsApi.list(),
      ])
      setResources(resRes.data)
      setDepartments(deptRes.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [activeCategory, deptFilter, crossOnly])

  const filtered = useMemo(() => {
    return resources.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      (r.department?.name && r.department.name.toLowerCase().includes(search.toLowerCase()))
    )
  }, [resources, search])

  // Summary counts
  const totalUnits = useMemo(() => {
    return resources.reduce((sum, r) => sum + (r.total_quantity || 1), 0)
  }, [resources])

  const totalAvailableUnits = useMemo(() => {
    return resources.reduce((sum, r) => sum + (r.available_quantity !== undefined ? r.available_quantity : (r.total_quantity || 1)), 0)
  }, [resources])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Resource Catalog"
        subtitle="Browse available institutional hardware, lab spaces, and research equipment"
      />

      {/* Simplified Inventory Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Types</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{resources.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Catalog categories</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalUnits}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total amount owned</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Free Right Now</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalAvailableUnits}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ready to reserve</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments</p>
          <p className="text-2xl font-bold text-sky-600 mt-1">{departments.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sharing assets</p>
        </div>
      </div>

      {/* Simpler Search & Category Filters */}
      <div className="card p-4 space-y-3">
        {/* Search Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
              placeholder="Search by equipment name, category, or department..."
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input w-full sm:w-48 text-sm"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
            <input
              type="checkbox"
              checked={crossOnly}
              onChange={(e) => setCrossOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 h-4 w-4"
            />
            Cross-shareable
          </label>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
          <button
            onClick={() => setActiveCategory('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeCategory === ''
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(activeCategory === c ? '' : c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeCategory === c
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Cards */}
      {loading ? (
        <LoadingPage />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No resources match your search"
          subtitle="Try adjusting your keywords or clearing category filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} onBook={setSelectedResource} />
          ))}
        </div>
      )}

      {/* Booking Modal with full scroll support */}
      <Modal
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        title={`Book Resource: ${selectedResource?.name}`}
      >
        {selectedResource && (
          <BookingModal
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
            onSuccess={() => showToast('Booking submitted successfully!')}
          />
        )}
      </Modal>

      {/* Success Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl animate-slide-up flex items-center gap-2 z-50 text-sm font-medium">
          <Check className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
