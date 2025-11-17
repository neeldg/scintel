'use client'

import { useRole } from '@/app/role-provider'

export default function RoleToggle() {
  const { role, setRole } = useRole()

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Role:</span>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as 'student' | 'pi')}
        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
      >
        <option value="student">Student</option>
        <option value="pi">PI</option>
      </select>
    </div>
  )
}

