import { useEffect, useState } from 'react'
import { resourcesApi, bookingsApi, departmentsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Modal } from '../components/Modal'
import { StatusBadge, LoadingPage, EmptyState, PageHeader } from '../components/ui'
import {
  Package, Search, Filter, Plus, DollarSign, Share2,
  Cpu, FlaskConical, Zap, Microscope, Clock, X
} from 'lucide-react'
import { format, addHours } from 'date-fns'

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

  return (
    <div className="card p-5 flex flex-col gap-4 hover:border-brand-800/60 transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isAvailable ? 'bg-brand-900/50' : 'bg-surface-hover'
        }`}>
          <Icon className={`w-5 h-5 ${isAvailable ? 'text-brand-400' : 'text-gray-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
            {resource.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{resource.department?.name || 'Unknown'}</p>
        </div>
        <StatusBadge status={resource.status} />
      </div>

      <p className="text-xs text-gray-400 line-clamp-2">{resource.description || resource.category}</p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-gray-400">
          <DollarSign className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-300">${resource.cost_per_hour}/hr</span>
        </div>
        {resource.is_cross_shareable && (
          <div className="flex items-center gap-1 text-emerald-400">
            <Share2 className="w-3 h-3" />
            <span>Cross-shareable</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 flex-wrap">
        <span className="badge badge-neutral">{resource.category}</span>
      </div>

      <button
        onClick={() => onBook(resource)}
        disabled={!isAvailable}
        className={isAvailable ? 'btn-primary text-sm py-2' : 'btn-secondary text-sm py-2 opacity-50 cursor-not-allowed'}
      >
        {isAvailable ? 'Book Now' : 'Unavailable'}
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
      setError(err.response?.data?.detail || 'Booking failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {isCrossDept && (
        <div className="mb-4 p-3 rounded-lg bg-amber-900/20 border border-amber-700/50 text-amber-400 text-xs">
          ⚠️ This is a <strong>cross-department</strong> booking request. It will be submitted for admin approval.
        </div>
      )}

      <div className="card p-3 mb-4 text-sm">
        <p className="font-semibold text-white">{resource.name}</p>
        <p className="text-gray-400 text-xs mt-0.5">{resource.department?.name} · {resource.category}</p>
        <p className="text-brand-400 text-xs mt-1 font-semibold">${resource.cost_per_hour}/hour</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Time</label>
            <input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))}
              className="input text-sm"
              required
            />
          </div>
          <div>
            <label className="label">End Time</label>
            <input
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))}
              className="input text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Purpose *</label>
          <input
            value={form.purpose}
            onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))}
            className="input"
            placeholder="Describe your research/use case..."
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
            placeholder="Any special requirements..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={submitting} className="btn-primary flex-1">
            {submitting ? 'Submitting...' : isCrossDept ? 'Submit for Approval' : 'Confirm Booking'}
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
  const [categoryFilter, setCategoryFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [crossOnly, setCrossOnly] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [toast, setToast] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (categoryFilter) params.category = categoryFilter
      if (deptFilter) params.department_id = parseInt(deptFilter)
      if (crossOnly) params.cross_shareable = true

      const [resRes, deptRes] = await Promise.all([
        resourcesApi.list(params),
        departmentsApi.list(),
      ])
      setResources(resRes.data)
      setDepartments(deptRes.data)
    } catch {
      // silently fail for filtering
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [categoryFilter, deptFilter, crossOnly])

  const filtered = resources.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.category.toLowerCase().includes(search.toLowerCase())
  )

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Resource Catalog"
        subtitle="Browse and book institutional equipment across departments"
      />

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 text-sm"
              placeholder="Search resources..."
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input text-sm w-auto"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="input text-sm w-auto"
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={crossOnly}
              onChange={(e) => setCrossOnly(e.target.checked)}
              className="rounded"
            />
            Cross-shareable only
          </label>
        </div>
      </div>

      {loading ? (
        <LoadingPage />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No resources found"
          subtitle="Try adjusting your filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} onBook={setSelectedResource} />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        title={`Book: ${selectedResource?.name}`}
      >
        {selectedResource && (
          <BookingModal
            resource={selectedResource}
            onClose={() => setSelectedResource(null)}
            onSuccess={() => showToast('Booking submitted successfully!')}
          />
        )}
      </Modal>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-800 text-emerald-100 px-4 py-3 rounded-xl shadow-lg animate-slide-up flex items-center gap-2 z-50">
          ✓ {toast}
          <button onClick={() => setToast(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
