import { useEffect, useState } from 'react'
import { usersApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { StatusBadge, LoadingPage, EmptyState, PageHeader } from '../components/ui'
import { Users, Shield, Building2 } from 'lucide-react'

export function UsersPage() {
  const { isSuperAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSuperAdmin) return
    usersApi.list()
      .then((r) => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [isSuperAdmin])

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-rose-500" />
          <p className="font-semibold text-slate-700">Super Admin access required</p>
          <p className="text-xs text-slate-400 mt-1">You must be logged in as a Super Admin to manage accounts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} active registered users across all academic faculties and departments`}
      />

      {loading ? (
        <LoadingPage />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">User</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Department</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.full_name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{u.full_name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="table-cell">
                      {u.department ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {u.department.name}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={u.is_active ? 'badge-success badge' : 'badge-neutral badge'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-500 font-medium">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
