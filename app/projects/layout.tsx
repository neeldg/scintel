'use client'

import Sidebar from '@/components/Sidebar'
import AuthPlaceholder from '@/components/AuthPlaceholder'
import { UserProvider, useUser } from '@/app/providers'
import { RoleProvider } from '@/app/role-provider'

function ProjectsLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useUser()

  if (!user) {
    return <AuthPlaceholder />
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserProvider>
      <RoleProvider>
        <ProjectsLayoutContent>{children}</ProjectsLayoutContent>
      </RoleProvider>
    </UserProvider>
  )
}

