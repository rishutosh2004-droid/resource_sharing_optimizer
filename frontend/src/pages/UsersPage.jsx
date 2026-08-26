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
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-red-500" />
          <p>Super Admin access required</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} registered users across all departments`}
      />

      {loading ? (
        <LoadingPage />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-surface-border bg-surface">
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
                  <tr key={u.id} className="border-b border-surface-border hover:bg-surface-hover transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.full_name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white">{u.full_name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={u.role} />
                    </td>
                    <td className="table-cell">
                      {u.department ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-300">
                          <Building2 className="w-3.5 h-3.5 text-gray-500" />
                          {u.department.name}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={u.is_active ? 'badge-success badge' : 'badge-neutral badge'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell text-xs text-gray-400">
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
