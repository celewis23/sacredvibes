'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus, X, ShieldCheck, ShieldOff, Pencil } from 'lucide-react'
import { usersApi } from '@/lib/api'
import type { AdminUser } from '@/types'

type CreateForm = {
  email: string
  firstName: string
  lastName: string
  password: string
  role: string
}

type EditForm = {
  email: string
  firstName: string
  lastName: string
  role: string
  password: string
}

const emptyCreate: CreateForm = {
  email: '',
  firstName: '',
  lastName: '',
  password: '',
  role: 'Editor',
}

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-red-100 text-red-700',
  Editor: 'bg-blue-100 text-blue-700',
  Manager: 'bg-purple-100 text-purple-700',
}

function formatDate(iso?: string) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate)
  const [createError, setCreateError] = useState('')
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ email: '', firstName: '', lastName: '', role: 'Editor', password: '' })
  const [editError, setEditError] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.getUsers().then(r => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: (data: unknown) => usersApi.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User created')
      setShowCreate(false)
      setCreateForm(emptyCreate)
      setCreateError('')
    },
    onError: (err: { response?: { data?: { errors?: string[] } } }) => {
      const msg = err?.response?.data?.errors?.[0] ?? 'Failed to create user'
      setCreateError(msg)
    },
  })

  const editMutation = useMutation({
    mutationFn: (data: EditForm) => {
      const payload: { firstName: string; lastName: string; email: string; role: string; password?: string } = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
      }
      if (data.password) payload.password = data.password
      return usersApi.updateUser(editUser!.id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('User updated')
      setEditUser(null)
      setEditError('')
    },
    onError: (err: { response?: { data?: { errors?: string[] } } }) => {
      const msg = err?.response?.data?.errors?.[0] ?? 'Failed to update user'
      setEditError(msg)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      usersApi.setActive(userId, isActive),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(vars.isActive ? 'User activated' : 'User deactivated')
    },
    onError: () => toast.error('Failed to update user'),
  })

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreateError('')
    createMutation.mutate({
      email: createForm.email,
      firstName: createForm.firstName,
      lastName: createForm.lastName,
      password: createForm.password,
      role: createForm.role,
    })
  }

  function setField(key: keyof CreateForm, value: string) {
    setCreateForm(f => ({ ...f, [key]: value }))
  }

  function openEdit(u: AdminUser) {
    setEditUser(u)
    setEditForm({ email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role, password: '' })
    setEditError('')
  }

  function setEditField(key: keyof EditForm, value: string) {
    setEditForm(f => ({ ...f, [key]: value }))
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditError('')
    editMutation.mutate(editForm)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} users</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors"
        >
          <UserPlus size={16} />
          New User
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
      ) : users.length === 0 ? (
        <div className="p-12 text-center text-gray-400 text-sm">No users found.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">User</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Last Login</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 text-xs">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: AdminUser) => (
                <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${!u.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yoga-100 flex items-center justify-center text-yoga-700 text-xs font-medium shrink-0">
                        {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.fullName}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.lastLoginAt)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(u)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        title="Edit user"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActiveMutation.mutate({ userId: u.id, isActive: !u.isActive })}
                        disabled={toggleActiveMutation.isPending}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                          u.isActive
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                        title={u.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {u.isActive ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditUser(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="font-semibold text-gray-900">Edit User</h2>
                <p className="text-xs text-gray-400 mt-0.5">{editUser.email}</p>
              </div>
              <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* User info strip */}
            <div className="px-5 pt-4 pb-2 flex items-center gap-3 bg-gray-50 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-yoga-100 flex items-center justify-center text-yoga-700 text-sm font-semibold shrink-0">
                {editUser.firstName.charAt(0)}{editUser.lastName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{editUser.fullName}</p>
                <p className="text-xs text-gray-400">
                  Joined {formatDate(editUser.createdAt)}
                  {editUser.lastLoginAt ? ` · Last login ${formatDate(editUser.lastLoginAt)}` : ' · Never logged in'}
                </p>
              </div>
              <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${editUser.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {editUser.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input value={editForm.firstName} onChange={e => setEditField('firstName', e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input value={editForm.lastName} onChange={e => setEditField('lastName', e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={editForm.email} onChange={e => setEditField('email', e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select value={editForm.role} onChange={e => setEditField('role', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500">
                  <option value="Editor">Editor</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
                <input type="password" value={editForm.password} onChange={e => setEditField('password', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                  placeholder="Min 8 chars, 1 uppercase, 1 number" />
              </div>

              {editError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{editError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditUser(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                <button type="submit" disabled={editMutation.isPending}
                  className="px-5 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors disabled:opacity-50">
                  {editMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">New Admin User</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input value={createForm.firstName} onChange={e => setField('firstName', e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                  <input value={createForm.lastName} onChange={e => setField('lastName', e.target.value)} required
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setField('email', e.target.value)} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={createForm.password} onChange={e => setField('password', e.target.value)} required minLength={8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500"
                  placeholder="Min 8 chars, 1 uppercase, 1 number" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select value={createForm.role} onChange={e => setField('role', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yoga-500">
                  <option value="Editor">Editor</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {createError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{createError}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="px-5 py-2 bg-yoga-700 text-white rounded-xl text-sm font-medium hover:bg-yoga-800 transition-colors disabled:opacity-50">
                  {createMutation.isPending ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
