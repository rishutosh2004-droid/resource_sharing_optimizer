import { useEffect, useState } from 'react'
import { bookingsApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, LoadingPage, EmptyState, PageHeader } from '../components/ui'
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Check } from 'lucide-react'
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
          <p className="text-slate-600 font-medium">Administrator privileges required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Pending Approvals"
        subtitle="Review, authorize, or decline cross-department reservation requests"
        action={
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            {bookings.length} Pending Review
          </div>
        }
      />

      {loading ? (
        <LoadingPage />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="All caught up!"
          subtitle="There are no pending booking requests awaiting approval at this time"
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
              <div
                key={booking.id}
                className={`card p-6 transition-all hover:shadow-card-hover ${
                  isCrossDept ? 'border-l-4 border-l-amber-500' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-base">{booking.resource?.name}</h3>
                      {isCrossDept && (
                        <span className="badge badge-warning">Cross-Department</span>
                      )}
                      <StatusBadge status={booking.status} />
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      {booking.resource?.department?.name} · {booking.resource?.category}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50/70 rounded-xl p-3.5 border border-slate-100">
                      <div>
                        <p className="text-slate-400 font-medium mb-1">Requested By</p>
                        <p className="text-slate-900 font-semibold">{booking.user?.full_name}</p>
                        <p className="text-slate-500">{booking.user?.department?.name}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium mb-1">Time Slot</p>
                        <p className="text-slate-900 font-semibold">{format(parseISO(booking.start_time), 'MMM d, yyyy')}</p>
                        <p className="text-slate-500">
                          {format(parseISO(booking.start_time), 'h:mm a')} – {format(parseISO(booking.end_time), 'h:mm a')} ({duration}h)
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium mb-1">Purpose</p>
                        <p className="text-slate-800 line-clamp-2 leading-relaxed">{booking.purpose}</p>
                      </div>
                    </div>

                    {booking.notes && (
                      <div className="mt-3 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-lg">
                        <span className="font-semibold text-slate-700">Notes:</span> {booking.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row md:flex-col gap-2.5 sm:self-end md:self-center">
                    <button
                      onClick={() => handleAction(booking.id, 'APPROVED')}
                      disabled={isBusy}
                      className="btn-success flex items-center justify-center gap-1.5 text-xs px-4 py-2 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, 'REJECTED')}
                      disabled={isBusy}
                      className="btn-danger flex items-center justify-center gap-1.5 text-xs px-4 py-2 font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl animate-slide-up flex items-center gap-2 z-50 text-sm font-medium">
          <Check className="w-4 h-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
