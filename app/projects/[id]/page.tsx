'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/app/providers'
import { useRole } from '@/app/role-provider'

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

interface ProjectProfile {
  researchArea: string
  goals: string[]
  methods: string[]
  keyFindings: string[]
  knownLimitations: string[]
  openQuestions: string[]
}

interface ScoutedPaper {
  title: string
  summary: string
  relevanceReason: string
  limitations: string
}

interface Gap {
  description: string
  whyItMatters: string
  whatSeemsMissing: string
  supportingRefs: string[]
}

interface ProposedDirection {
  title: string
  hypothesis: string
  proposedExperiments: string[]
  requiredData: string[]
  feasibility: 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
}

interface CriticizedDirection extends ProposedDirection {
  strengths: string[]
  weaknesses: string[]
  risks: string[]
  suggestedImprovements: string[]
  piComment: string
}

interface AnalysisResult {
  id?: string
  createdAt?: string
  projectProfile: ProjectProfile
  scoutedPapers: ScoutedPaper[]
  gaps: Gap[]
  directions: ProposedDirection[]
  criticizedDirections: CriticizedDirection[]
}

interface AnalysisPreview {
  id: string
  createdAt: string
  preview: {
    researchArea: string
  }
}

interface Comment {
  id: string
  targetType: 'direction' | 'gap' | 'general'
  targetId: string
  content: string
  createdAt: string
}

interface FullAnalysis extends AnalysisResult {
  id: string
  createdAt: string
  commentsByTarget: Record<string, Comment[]>
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { role } = useRole()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analyses, setAnalyses] = useState<AnalysisPreview[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<FullAnalysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)
  const [analysisStep, setAnalysisStep] = useState<string>('')

  useEffect(() => {
    if (user && params.id) {
      fetchProject()
      fetchAnalyses()
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

  const fetchAnalyses = async () => {
    if (!user || !params.id) return
    
    try {
      const response = await fetch(`/api/projects/${params.id}/analyses`, {
        headers: {
          'x-user-email': user.email,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAnalyses(data)
      }
    } catch (error) {
      console.error('Failed to fetch analyses:', error)
    }
  }

  const fetchAnalysis = async (analysisId: string) => {
    if (!user) return
    
    setLoadingAnalysis(true)
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        headers: {
          'x-user-email': user.email,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedAnalysis(data)
      } else {
        const error = await response.json()
        setAnalysisError(error.error || 'Failed to load analysis')
      }
    } catch (error) {
      console.error('Failed to fetch analysis:', error)
      setAnalysisError('An error occurred while loading the analysis')
    } finally {
      setLoadingAnalysis(false)
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
        await fetchProject()
        e.target.value = ''
      } else {
        const error = await response.json()
        setAnalysisError(error.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setAnalysisError('An error occurred while uploading the file')
    } finally {
      setUploading(false)
    }
  }

  const handleRunAnalysis = async () => {
    if (!project || !user) return

    setAnalyzing(true)
    setAnalysisError(null)
    setSelectedAnalysis(null)
    setAnalysisStep('Starting analysis...')

    try {
      const response = await fetch(`/api/projects/${project.id}/analyze`, {
        method: 'POST',
        headers: {
          'x-user-email': user.email,
        },
      })

      if (response.ok) {
        const result = await response.json()
        await fetchAnalyses()
        // Automatically load the new analysis
        if (result.id) {
          await fetchAnalysis(result.id)
        }
        setAnalysisStep('')
      } else {
        const error = await response.json()
        setAnalysisError(error.error || 'Failed to run analysis')
        setAnalysisStep('')
      }
    } catch (error) {
      console.error('Error running analysis:', error)
      setAnalysisError('An error occurred while running the analysis. Please try again.')
      setAnalysisStep('')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAddComment = async (
    analysisId: string,
    targetType: 'direction' | 'gap' | 'general',
    targetId: string
  ) => {
    if (!user || !project) return

    const key = `${targetType}:${targetId}`
    const content = commentTexts[key]?.trim()
    if (!content) return

    setSubmittingComment(key)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
        },
        body: JSON.stringify({
          projectId: project.id,
          analysisId,
          targetType,
          targetId,
          content,
        }),
      })

      if (response.ok) {
        setCommentTexts({ ...commentTexts, [key]: '' })
        // Refresh the analysis to show new comment
        await fetchAnalysis(analysisId)
      } else {
        const error = await response.json()
        setAnalysisError(error.error || 'Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      setAnalysisError('An error occurred while adding the comment')
    } finally {
      setSubmittingComment(null)
    }
  }

  const getComments = (targetType: 'direction' | 'gap' | 'general', targetId: string): Comment[] => {
    if (!selectedAnalysis) return []
    const key = `${targetType}:${targetId}`
    return selectedAnalysis.commentsByTarget[key] || []
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
    <div className="p-8 max-w-6xl mx-auto">
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

      {/* Error Messages */}
      {analysisError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{analysisError}</p>
          <button
            onClick={() => setAnalysisError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step 1: Upload Documents */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 font-semibold">1</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
        </div>
        <div className="ml-11">
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
          {project.documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {project.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Run Analysis Button */}
      <div className="mb-8">
        <button
          onClick={handleRunAnalysis}
          disabled={project.documents.length === 0 || analyzing}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
        {analyzing && analysisStep && (
          <p className="mt-2 text-sm text-gray-600">{analysisStep}</p>
        )}
        {project.documents.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">
            Upload at least one document to run AI analysis
          </p>
        )}
      </div>

      {/* Past Analyses List */}
      {analyses.length > 0 && (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Analyses</h2>
          <div className="space-y-2">
            {analyses.map((analysis) => (
              <button
                key={analysis.id}
                onClick={() => fetchAnalysis(analysis.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedAnalysis?.id === analysis.id
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {analysis.preview.researchArea}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(analysis.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {selectedAnalysis?.id === analysis.id && loadingAnalysis && (
                    <div className="text-blue-600">Loading...</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results - Step-like Layout */}
      {selectedAnalysis && !loadingAnalysis && (
        <div className="space-y-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <p className="text-sm text-gray-500">
              {new Date(selectedAnalysis.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Step 2: Project Profile */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-semibold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Project Profile</h3>
            </div>
            <div className="ml-11 space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Research Area</h4>
                <p className="text-gray-600">{selectedAnalysis.projectProfile.researchArea}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Goals</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {selectedAnalysis.projectProfile.goals.map((goal, idx) => (
                    <li key={idx}>{goal}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Methods</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {selectedAnalysis.projectProfile.methods.map((method, idx) => (
                    <li key={idx}>{method}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Key Findings</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {selectedAnalysis.projectProfile.keyFindings.map((finding, idx) => (
                    <li key={idx}>{finding}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Known Limitations</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {selectedAnalysis.projectProfile.knownLimitations.map((limitation, idx) => (
                    <li key={idx}>{limitation}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Open Questions</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  {selectedAnalysis.projectProfile.openQuestions.map((question, idx) => (
                    <li key={idx}>{question}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3: Literature Scout */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-semibold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Literature Scout</h3>
            </div>
            <div className="ml-11 space-y-4">
              {selectedAnalysis.scoutedPapers.map((paper, idx) => (
                <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h4 className="font-medium text-gray-900">{paper.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{paper.summary}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    <span className="font-medium">Relevance:</span> {paper.relevanceReason}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Limitations:</span> {paper.limitations}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4: Research Gaps */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-yellow-600 font-semibold">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Identified Research Gaps</h3>
            </div>
            <div className="ml-11 space-y-6">
              {selectedAnalysis.gaps.map((gap, idx) => {
                const gapId = `gap-${idx}`
                const comments = getComments('gap', gapId)
                const commentKey = `gap:${gapId}`
                
                return (
                  <div key={idx} className="border-l-4 border-yellow-500 pl-4 py-2">
                    <h4 className="font-medium text-gray-900">Gap {idx + 1}</h4>
                    <p className="text-sm text-gray-600 mt-1">{gap.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      <span className="font-medium">Why it matters:</span> {gap.whyItMatters}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">What's missing:</span> {gap.whatSeemsMissing}
                    </p>
                    {gap.supportingRefs.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">Supporting refs:</span> {gap.supportingRefs.join(', ')}
                      </p>
                    )}

                    {/* Comments for this gap */}
                    {comments.length > 0 && (
                      <div className="mt-4 ml-4 space-y-2 border-l-2 border-gray-200 pl-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded p-2">
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment form for this gap */}
                    <div className="mt-4 ml-4">
                      <textarea
                        value={commentTexts[commentKey] || ''}
                        onChange={(e) => setCommentTexts({ ...commentTexts, [commentKey]: e.target.value })}
                        placeholder="Add a comment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                      <button
                        onClick={() => handleAddComment(selectedAnalysis.id, 'gap', gapId)}
                        disabled={!commentTexts[commentKey]?.trim() || submittingComment === commentKey}
                        className="mt-2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingComment === commentKey ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 5: Research Directions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-indigo-600 font-semibold">5</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Research Directions</h3>
            </div>
            <div className="ml-11 space-y-6">
              {selectedAnalysis.criticizedDirections.map((direction, idx) => {
                const directionId = `direction-${idx}`
                const comments = getComments('direction', directionId)
                const commentKey = `direction:${directionId}`
                
                return (
                  <div key={idx} className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-lg">{direction.title}</h4>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          direction.feasibility === 'high' ? 'bg-green-100 text-green-800' :
                          direction.feasibility === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          Feasibility: {direction.feasibility}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          direction.impact === 'high' ? 'bg-blue-100 text-blue-800' :
                          direction.impact === 'medium' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Impact: {direction.impact}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      <span className="font-medium">Hypothesis:</span> {direction.hypothesis}
                    </p>
                    <div className="grid md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <h5 className="font-medium text-gray-700 text-sm mb-1">Proposed Experiments</h5>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {direction.proposedExperiments.map((exp, expIdx) => (
                            <li key={expIdx}>{exp}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 text-sm mb-1">Required Data</h5>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {direction.requiredData.map((data, dataIdx) => (
                            <li key={dataIdx}>{data}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Comments for this direction */}
                    {comments.length > 0 && (
                      <div className="mt-4 space-y-2 border-l-2 border-gray-200 pl-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded p-2">
                            <p className="text-sm text-gray-700">{comment.content}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment form for this direction */}
                    <div className="mt-4">
                      <textarea
                        value={commentTexts[commentKey] || ''}
                        onChange={(e) => setCommentTexts({ ...commentTexts, [commentKey]: e.target.value })}
                        placeholder="Add a comment..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={2}
                      />
                      <button
                        onClick={() => handleAddComment(selectedAnalysis.id, 'direction', directionId)}
                        disabled={!commentTexts[commentKey]?.trim() || submittingComment === commentKey}
                        className="mt-2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingComment === commentKey ? 'Adding...' : 'Add Comment'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 6: PI Critic + Comments */}
          <div className={`bg-white rounded-lg border-2 p-6 shadow-sm ${
            role === 'pi' ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
          }`}>
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-red-600 font-semibold">6</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">PI Critic & Feedback</h3>
                {role === 'pi' && (
                  <p className="text-sm text-blue-700 font-medium mt-1">PI Feedback Zone</p>
                )}
              </div>
            </div>
            {role === 'student' && (
              <div className="ml-11 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Note:</span> These directions are drafts. Ask your PI to review and comment.
                </p>
              </div>
            )}
            <div className="ml-11 space-y-6">
              {selectedAnalysis.criticizedDirections.map((direction, idx) => {
                const directionId = `direction-${idx}`
                const comments = getComments('direction', directionId)
                const commentKey = `direction:${directionId}`
                
                return (
                  <div key={idx} className={`border rounded-lg p-4 ${
                    role === 'pi' ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                  }`}>
                    <h4 className="font-semibold text-gray-900 text-lg mb-3">{direction.title}</h4>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <h5 className="font-medium text-green-700 text-sm mb-1">Strengths</h5>
                          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                            {direction.strengths.map((strength, sIdx) => (
                              <li key={sIdx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h5 className="font-medium text-red-700 text-sm mb-1">Weaknesses</h5>
                          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                            {direction.weaknesses.map((weakness, wIdx) => (
                              <li key={wIdx}>{weakness}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mb-3">
                        <h5 className="font-medium text-orange-700 text-sm mb-1">Risks</h5>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {direction.risks.map((risk, rIdx) => (
                            <li key={rIdx}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mb-3">
                        <h5 className="font-medium text-blue-700 text-sm mb-1">Suggested Improvements</h5>
                        <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                          {direction.suggestedImprovements.map((improvement, iIdx) => (
                            <li key={iIdx}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-gray-50 rounded p-3 mb-3">
                        <h5 className="font-medium text-gray-700 text-sm mb-1">PI Comment</h5>
                        <p className="text-sm text-gray-600">{direction.piComment}</p>
                      </div>

                      {/* Comments for this direction */}
                      {comments.length > 0 && (
                        <div className="mt-4 space-y-2 border-l-2 border-gray-200 pl-4">
                          {comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 rounded p-2">
                              <p className="text-sm text-gray-700">{comment.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Comment form for this direction */}
                      {role === 'pi' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Add your feedback:
                          </label>
                          <textarea
                            value={commentTexts[commentKey] || ''}
                            onChange={(e) => setCommentTexts({ ...commentTexts, [commentKey]: e.target.value })}
                            placeholder="Add your PI feedback..."
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                          <button
                            onClick={() => handleAddComment(selectedAnalysis.id, 'direction', directionId)}
                            disabled={!commentTexts[commentKey]?.trim() || submittingComment === commentKey}
                            className="mt-2 bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {submittingComment === commentKey ? 'Adding...' : 'Add Feedback'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
