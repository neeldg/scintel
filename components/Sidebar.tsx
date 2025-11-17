'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/app/providers'
import RoleToggle from '@/components/RoleToggle'

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useUser()

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">ResearchNavigator</h1>
        {user && (
          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
        )}
        <div className="mt-4">
          <RoleToggle />
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/projects"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                pathname === '/projects' || pathname?.startsWith('/projects/')
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Projects
            </Link>
          </li>
          <li>
            <Link
              href="/settings"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                pathname === '/settings'
                  ? 'bg-blue-100 text-blue-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {user && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

