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
  projectProfile: ProjectProfile
  scoutedPapers: ScoutedPaper[]
  gaps: Gap[]
  directions: ProposedDirection[]
  criticizedDirections: CriticizedDirection[]
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

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

  const handleRunAnalysis = async () => {
    if (!project || !user) return

    setAnalyzing(true)
    setAnalysisError(null)
    setAnalysisResult(null)

    try {
      const response = await fetch(`/api/projects/${project.id}/analyze`, {
        method: 'POST',
        headers: {
          'x-user-email': user.email,
        },
      })

      if (response.ok) {
        const result = await response.json()
        setAnalysisResult(result)
      } else {
        const error = await response.json()
        setAnalysisError(error.error || 'Failed to run analysis')
      }
    } catch (error) {
      console.error('Error running analysis:', error)
      setAnalysisError('An error occurred while running the analysis')
    } finally {
      setAnalyzing(false)
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
            onClick={handleRunAnalysis}
            disabled={project.documents.length === 0 || analyzing}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
          {project.documents.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Upload at least one document to run AI analysis
            </p>
          )}
        </div>

        {/* Analysis Results */}
        {analysisError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{analysisError}</p>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-8 border-t border-gray-200 pt-8">
            <h2 className="text-2xl font-bold text-gray-900">AI Analysis Results</h2>

            {/* Project Profile */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Profile</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Research Area</h4>
                  <p className="text-gray-600">{analysisResult.projectProfile.researchArea}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Goals</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {analysisResult.projectProfile.goals.map((goal, idx) => (
                      <li key={idx}>{goal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Methods</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {analysisResult.projectProfile.methods.map((method, idx) => (
                      <li key={idx}>{method}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Key Findings</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {analysisResult.projectProfile.keyFindings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Known Limitations</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {analysisResult.projectProfile.knownLimitations.map((limitation, idx) => (
                      <li key={idx}>{limitation}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Open Questions</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {analysisResult.projectProfile.openQuestions.map((question, idx) => (
                      <li key={idx}>{question}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Scouted Papers */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Relevant Literature</h3>
              <div className="space-y-4">
                {analysisResult.scoutedPapers.map((paper, idx) => (
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

            {/* Research Gaps */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Identified Research Gaps</h3>
              <div className="space-y-4">
                {analysisResult.gaps.map((gap, idx) => (
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
                  </div>
                ))}
              </div>
            </div>

            {/* Criticized Directions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Research Directions (PI Reviewed)</h3>
              <div className="space-y-6">
                {analysisResult.criticizedDirections.map((direction, idx) => (
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
                      <div className="bg-gray-50 rounded p-3">
                        <h5 className="font-medium text-gray-700 text-sm mb-1">PI Comment</h5>
                        <p className="text-sm text-gray-600">{direction.piComment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

