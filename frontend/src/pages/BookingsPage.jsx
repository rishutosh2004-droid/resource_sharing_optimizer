import { useEffect, useState } from 'react'
import { bookingsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, LoadingPage, EmptyState, PageHeader } from '../components/ui'
import { CalendarCheck, Clock, User, Package, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'

function BookingRow({ booking, onCancel }) {
  const { user } = useAuth()
  const canCancel = booking.user_id === user?.id &&
    ['PENDING', 'APPROVED'].includes(booking.status)
  const duration = Math.round(
    (new Date(booking.end_time) - new Date(booking.start_time)) / 3600000
  )

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
      <td className="table-cell">
        <div>
          <p className="font-semibold text-slate-900">{booking.resource?.name}</p>
          <p className="text-xs text-slate-500">{booking.resource?.department?.name}</p>
        </div>
      </td>
      <td className="table-cell">
        <div className="text-xs">
          <p className="font-medium text-slate-800">{format(parseISO(booking.start_time), 'MMM d, yyyy')}</p>
          <p className="text-slate-500 mt-0.5">
            {format(parseISO(booking.start_time), 'h:mm a')} – {format(parseISO(booking.end_time), 'h:mm a')}
          </p>
          <span className="inline-block mt-1 font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[11px]">
            {duration}h duration
          </span>
        </div>
      </td>
      <td className="table-cell">
        <p className="text-xs text-slate-700 max-w-xs truncate">{booking.purpose}</p>
      </td>
      <td className="table-cell">
        <StatusBadge status={booking.status} />
      </td>
      <td className="table-cell">
        <p className="text-xs text-slate-500">{format(parseISO(booking.created_at), 'MMM d, yyyy')}</p>
      </td>
      <td className="table-cell">
        {canCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="text-xs px-2.5 py-1 rounded-lg font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
          >
            Cancel
          </button>
        )}
      </td>
    </tr>
  )
}

export function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [cancelling, setCancelling] = useState(null)

  const loadBookings = async () => {
    setLoading(true)
    try {
      const params = { my_only: true }
      if (statusFilter) params.status = statusFilter
      const res = await bookingsApi.list(params)
      setBookings(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBookings() }, [statusFilter])

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return
    setCancelling(id)
    try {
      await bookingsApi.cancel(id)
      await loadBookings()
    } catch {
      alert('Failed to cancel booking')
    } finally {
      setCancelling(null)
    }
  }

  const STATUSES = ['PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED', 'REJECTED']

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Bookings"
        subtitle="Review your reservations, status updates, and session timelines"
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
            statusFilter === ''
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Bookings
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusFilter === s
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {s[0] + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingPage />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No bookings found"
          subtitle="Explore the catalog and reserve institutional equipment for your work"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Resource</th>
                  <th className="table-header">Time Slot</th>
                  <th className="table-header">Purpose</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Requested</th>
                  <th className="table-header">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <BookingRow
                    key={b.id}
                    booking={b}
                    onCancel={handleCancel}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
