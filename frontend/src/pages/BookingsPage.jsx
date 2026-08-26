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
    <tr className="border-b border-surface-border hover:bg-surface-hover transition-colors">
      <td className="table-cell">
        <div>
          <p className="font-medium text-white">{booking.resource?.name}</p>
          <p className="text-xs text-gray-500">{booking.resource?.department?.name}</p>
        </div>
      </td>
      <td className="table-cell">
        <div className="text-xs">
          <p className="text-gray-300">{format(parseISO(booking.start_time), 'MMM d, yyyy')}</p>
          <p className="text-gray-500">
            {format(parseISO(booking.start_time), 'h:mm a')} – {format(parseISO(booking.end_time), 'h:mm a')}
          </p>
          <p className="text-brand-400 font-medium mt-0.5">{duration}h</p>
        </div>
      </td>
      <td className="table-cell">
        <p className="text-xs text-gray-300 max-w-xs truncate">{booking.purpose}</p>
      </td>
      <td className="table-cell">
        <StatusBadge status={booking.status} />
      </td>
      <td className="table-cell">
        <p className="text-xs text-gray-400">{format(parseISO(booking.created_at), 'MMM d')}</p>
      </td>
      <td className="table-cell">
        {canCancel && (
          <button
            onClick={() => onCancel(booking.id)}
            className="btn-secondary text-xs px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-900/20"
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
    if (!window.confirm('Cancel this booking?')) return
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
    <div className="animate-fade-in">
      <PageHeader
        title="My Bookings"
        subtitle="Track and manage your resource booking history"
      />

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setStatusFilter('')}
          className={`btn-${statusFilter === '' ? 'primary' : 'secondary'} text-sm px-3 py-1.5`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`btn-${statusFilter === s ? 'primary' : 'secondary'} text-sm px-3 py-1.5`}
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
          subtitle="Head to Resources to book equipment for your research"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border bg-surface">
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
