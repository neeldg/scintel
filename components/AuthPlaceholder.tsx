'use client'

import { useState } from 'react'
import { useUser } from '@/app/providers'

export default function AuthPlaceholder() {
  const [email, setEmail] = useState('')
  const { login } = useUser()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      login(email.trim())
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ResearchNavigator</h2>
        <p className="text-gray-600 mb-6">Enter your email to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  )
}

