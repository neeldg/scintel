'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: string
  name: string | null
  email: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  login: (email: string) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const login = async (email: string) => {
    try {
      // Create or get user via API
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        console.error('Failed to login')
      }
    } catch (error) {
      console.error('Error logging in:', error)
    }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <UserContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

