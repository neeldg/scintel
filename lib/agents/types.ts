/**
 * Type definitions for AI agents
 */

export interface ProjectProfile {
  researchArea: string
  goals: string[]
  methods: string[]
  keyFindings: string[]
  knownLimitations: string[]
  openQuestions: string[]
}

export interface ScoutedPaper {
  title: string
  summary: string
  relevanceReason: string
  limitations: string
}

export interface Gap {
  description: string
  whyItMatters: string
  whatSeemsMissing: string
  supportingRefs: string[]
}

export interface ProposedDirection {
  title: string
  hypothesis: string
  proposedExperiments: string[]
  requiredData: string[]
  feasibility: 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
}

export interface CriticizedDirection extends ProposedDirection {
  strengths: string[]
  weaknesses: string[]
  risks: string[]
  suggestedImprovements: string[]
  piComment: string
}

export interface AnalysisResult {
  projectProfile: ProjectProfile
  scoutedPapers: ScoutedPaper[]
  gaps: Gap[]
  directions: ProposedDirection[]
  criticizedDirections: CriticizedDirection[]
}

