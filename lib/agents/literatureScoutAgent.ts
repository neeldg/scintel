import OpenAI from 'openai'
import { ProjectProfile, ScoutedPaper } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface LiteratureScoutAgentInput {
  projectProfile: ProjectProfile
  numPapers?: number
}

export interface LiteratureScoutAgentOutput {
  scoutedPapers: ScoutedPaper[]
}

/**
 * Literature Scout Agent: Generates pseudo-papers relevant to the project
 * In production, this would query PubMed, Semantic Scholar, etc.
 */
export async function literatureScoutAgent(
  input: LiteratureScoutAgentInput
): Promise<LiteratureScoutAgentOutput> {
  const { projectProfile, numPapers = 5 } = input

  const contextText = `
Research Area: ${projectProfile.researchArea}
Goals: ${projectProfile.goals.join(', ')}
Methods: ${projectProfile.methods.join(', ')}
Key Findings: ${projectProfile.keyFindings.join(', ')}
`.trim()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a literature review assistant. Based on the research project profile, generate a list of relevant research papers that would be found in a literature search. These should be realistic, relevant papers that address similar topics, methods, or questions.`,
      },
      {
        role: 'user',
        content: `${contextText}

Generate ${numPapers} relevant research papers. For each paper, provide:
- title: A realistic research paper title
- summary: A 2-3 sentence summary of the paper's main contributions
- relevanceReason: Why this paper is relevant to the project
- limitations: What limitations or gaps this paper has

Return ONLY a valid JSON object with this structure:
{
  "scoutedPapers": [
    {
      "title": "...",
      "summary": "...",
      "relevanceReason": "...",
      "limitations": "..."
    }
  ]
}`,
      },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from LLM')
  }

  try {
    const result = JSON.parse(content) as { scoutedPapers: ScoutedPaper[] }
    return { scoutedPapers: result.scoutedPapers }
  } catch (error) {
    console.error('Error parsing scouted papers:', error)
    throw new Error('Failed to parse scouted papers from LLM response')
  }
}

