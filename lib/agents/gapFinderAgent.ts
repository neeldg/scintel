import OpenAI from 'openai'
import { ProjectProfile, ScoutedPaper, Gap } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GapFinderAgentInput {
  projectProfile: ProjectProfile
  scoutedPapers: ScoutedPaper[]
}

export interface GapFinderAgentOutput {
  gaps: Gap[]
}

/**
 * Gap Finder Agent: Identifies research gaps by comparing project work with literature
 */
export async function gapFinderAgent(
  input: GapFinderAgentInput
): Promise<GapFinderAgentOutput> {
  const { projectProfile, scoutedPapers } = input

  const papersText = scoutedPapers
    .map(
      (paper, idx) => `
Paper ${idx + 1}: ${paper.title}
Summary: ${paper.summary}
Relevance: ${paper.relevanceReason}
Limitations: ${paper.limitations}
`
    )
    .join('\n---\n')

  const contextText = `
Project Profile:
Research Area: ${projectProfile.researchArea}
Goals: ${projectProfile.goals.join('\n- ')}
Methods: ${projectProfile.methods.join('\n- ')}
Key Findings: ${projectProfile.keyFindings.join('\n- ')}
Known Limitations: ${projectProfile.knownLimitations.join('\n- ')}
Open Questions: ${projectProfile.openQuestions.join('\n- ')}

Relevant Literature:
${papersText}
`.trim()

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a research gap analysis expert. Compare the project work with the relevant literature to identify specific research gaps, missing approaches, or underexplored areas. Be specific and actionable.`,
      },
      {
        role: 'user',
        content: `${contextText}

Identify 3-5 specific research gaps by comparing what the project has done versus what exists in the literature. For each gap, provide:
- description: A clear description of the gap
- whyItMatters: Why addressing this gap is important
- whatSeemsMissing: What specific elements, methods, or knowledge are missing
- supportingRefs: Array of references (paper titles or project findings) that support this gap identification

Return ONLY a valid JSON object with this structure:
{
  "gaps": [
    {
      "description": "...",
      "whyItMatters": "...",
      "whatSeemsMissing": "...",
      "supportingRefs": ["...", "..."]
    }
  ]
}`,
      },
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from LLM')
  }

  try {
    const result = JSON.parse(content) as { gaps: Gap[] }
    return { gaps: result.gaps }
  } catch (error) {
    console.error('Error parsing gaps:', error)
    throw new Error('Failed to parse gaps from LLM response')
  }
}

