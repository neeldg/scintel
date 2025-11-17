import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { vectorStore } from '@/lib/vectorStore'
import { ProjectProfile } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface IngestionAgentInput {
  projectId: string
}

export interface IngestionAgentOutput {
  projectProfile: ProjectProfile
}

/**
 * Ingestion Agent: Analyzes all documents in a project and generates a structured profile
 */
export async function ingestionAgent(
  input: IngestionAgentInput
): Promise<IngestionAgentOutput> {
  const { projectId } = input

  // Fetch project and documents
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!project) {
    throw new Error(`Project ${projectId} not found`)
  }

  if (project.documents.length === 0) {
    throw new Error(`Project ${projectId} has no documents`)
  }

  // Get document summaries and retrieve relevant chunks
  const documentSummaries = project.documents
    .map(doc => `- ${doc.title}: ${doc.summary || 'No summary available'}`)
    .join('\n')

  // Query vector store for key information
  const researchQueries = [
    'research objectives and goals',
    'methodology and experimental approach',
    'key findings and results',
    'limitations and constraints',
    'open questions and future work',
  ]

  const relevantChunks: string[] = []
  for (const query of researchQueries) {
    const results = await vectorStore.queryDocuments(projectId, query, 2)
    relevantChunks.push(
      ...results.map(r => r.text).filter(text => text.length > 0)
    )
  }

  const contextText = `
Project Title: ${project.title}
Project Description: ${project.description || 'No description'}

Document Summaries:
${documentSummaries}

Relevant Document Excerpts:
${relevantChunks.slice(0, 5).join('\n\n---\n\n')}
`.trim()

  // Call LLM to generate project profile
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a research analysis assistant. Analyze the provided research project documents and generate a structured project profile. Be specific and extract concrete information from the documents.`,
      },
      {
        role: 'user',
        content: `${contextText}

Generate a structured project profile with the following fields:
- researchArea: A concise description of the research domain/area
- goals: Array of 3-5 specific research goals
- methods: Array of methods, techniques, or approaches used
- keyFindings: Array of 3-5 key findings or results
- knownLimitations: Array of limitations mentioned or apparent
- openQuestions: Array of open questions or areas for future investigation

Return ONLY a valid JSON object with this structure:
{
  "researchArea": "...",
  "goals": ["...", "..."],
  "methods": ["...", "..."],
  "keyFindings": ["...", "..."],
  "knownLimitations": ["...", "..."],
  "openQuestions": ["...", "..."]
}`,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from LLM')
  }

  try {
    const projectProfile = JSON.parse(content) as ProjectProfile
    return { projectProfile }
  } catch (error) {
    console.error('Error parsing project profile:', error)
    throw new Error('Failed to parse project profile from LLM response')
  }
}

