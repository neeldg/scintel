'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/app/providers'

interface Project {
  id: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export default function ProjectsPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProjects()
    }
  }, [user])

  const fetchProjects = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'x-user-email': user.email,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        <Link
          href="/projects/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Create New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 mb-4">No projects yet</p>
          <Link
            href="/projects/new"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first project →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {project.title}
              </h2>
              {project.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

