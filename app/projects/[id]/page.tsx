'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'

interface Document {
  id: string
  title: string
  originalFileName: string
  createdAt: Date
}

interface Project {
  id: string
  title: string
  description: string | null
  documents: Document[]
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (user && params.id) {
      fetchProject()
    }
  }, [user, params.id])

  const fetchProject = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        headers: {
          'x-user-email': user.email,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !project) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', project.id)

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'x-user-email': user?.email || '',
        },
        body: formData,
      })

      if (response.ok) {
        await fetchProject() // Refresh project data
        e.target.value = '' // Reset file input
      } else {
        console.error('Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-red-600">Project not found</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => router.push('/projects')}
          className="text-gray-600 hover:text-gray-900 mb-4"
        >
          ← Back to Projects
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
        {project.description && (
          <p className="text-gray-600">{project.description}</p>
        )}
      </div>

      <div className="space-y-8">
        {/* Upload Area */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
          <p className="text-gray-600 text-sm mb-4">
            Upload PDFs, text files, or other research artifacts
          </p>
          <label className="inline-block">
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".pdf,.txt,.doc,.docx"
              className="hidden"
            />
            <span className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer inline-block disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? 'Uploading...' : 'Choose File'}
            </span>
          </label>
        </div>

        {/* Documents List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Documents</h2>
          {project.documents.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-600">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {project.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{doc.title}</h3>
                    <p className="text-sm text-gray-500">{doc.originalFileName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Analysis Button */}
        <div className="border-t border-gray-200 pt-8">
          <button
            disabled={project.documents.length === 0}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Run AI Analysis
          </button>
          {project.documents.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Upload at least one document to run AI analysis
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

