import { useEffect, useState } from 'react'
import { bookingsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, LoadingPage, EmptyState, PageHeader } from '../components/ui'
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export function ApprovalsPage() {
  const { user, isAdmin } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})
  const [toast, setToast] = useState(null)

  const loadApprovals = async () => {
    setLoading(true)
    try {
      const res = await bookingsApi.pendingApprovals()
      setBookings(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadApprovals() }, [])

  const handleAction = async (id, status) => {
    setProcessing((p) => ({ ...p, [id]: true }))
    try {
      await bookingsApi.updateStatus(id, status)
      setToast(`Booking ${status.toLowerCase()} successfully`)
      setTimeout(() => setToast(null), 3000)
      await loadApprovals()
    } catch (err) {
      alert(err.response?.data?.detail || 'Action failed')
    } finally {
      setProcessing((p) => ({ ...p, [id]: false }))
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <p className="text-gray-400">Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pending Approvals"
        subtitle="Review and approve cross-department resource booking requests"
        action={
          <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-900/20 border border-amber-700/50 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            {bookings.length} pending
          </div>
        }
      />

      {loading ? (
        <LoadingPage />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending approvals"
          subtitle="All booking requests have been processed"
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const duration = Math.round(
              (new Date(booking.end_time) - new Date(booking.start_time)) / 3600000
            )
            const isBusy = processing[booking.id]
            const isCrossDept = booking.resource?.department_id !== booking.user?.department_id

            return (
              <div key={booking.id} className={`card p-5 transition-all ${isCrossDept ? 'border-amber-800/40' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{booking.resource?.name}</h3>
                      {isCrossDept && (
                        <span className="badge badge-warning">Cross-Dept</span>
                      )}
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      {booking.resource?.department?.name} · {booking.resource?.category}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500 mb-0.5">Requested by</p>
                        <p className="text-gray-300 font-medium">{booking.user?.full_name}</p>
                        <p className="text-gray-500">{booking.user?.department?.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Time Slot</p>
                        <p className="text-gray-300">{format(parseISO(booking.start_time), 'MMM d, yyyy')}</p>
                        <p className="text-gray-500">
                          {format(parseISO(booking.start_time), 'h:mm a')} – {format(parseISO(booking.end_time), 'h:mm a')} ({duration}h)
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Purpose</p>
                        <p className="text-gray-300 line-clamp-2">{booking.purpose}</p>
                      </div>
                    </div>

                    {booking.notes && (
                      <p className="mt-3 text-xs text-gray-500 bg-surface px-3 py-2 rounded-lg">
                        <span className="font-medium text-gray-400">Notes:</span> {booking.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleAction(booking.id, 'APPROVED')}
                      disabled={isBusy}
                      className="btn-success flex items-center gap-1.5 text-sm px-3 py-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, 'REJECTED')}
                      disabled={isBusy}
                      className="btn-danger flex items-center gap-1.5 text-sm px-3 py-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-800 text-emerald-100 px-4 py-3 rounded-xl shadow-lg animate-slide-up z-50">
          ✓ {toast}
        </div>
      )}
    </div>
  )
}
