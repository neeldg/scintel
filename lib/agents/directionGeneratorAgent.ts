import OpenAI from 'openai'
import { Gap, ProposedDirection } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface DirectionGeneratorAgentInput {
  gaps: Gap[]
}

export interface DirectionGeneratorAgentOutput {
  directions: ProposedDirection[]
}

/**
 * Direction Generator Agent: Proposes concrete research directions based on identified gaps
 */
export async function directionGeneratorAgent(
  input: DirectionGeneratorAgentInput
): Promise<DirectionGeneratorAgentOutput> {
  const { gaps } = input

  const gapsText = gaps
    .map(
      (gap, idx) => `
Gap ${idx + 1}: ${gap.description}
Why it matters: ${gap.whyItMatters}
What's missing: ${gap.whatSeemsMissing}
Supporting refs: ${gap.supportingRefs.join(', ')}
`
    )
    .join('\n---\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a research strategy advisor. Based on identified research gaps, propose concrete, actionable research directions with specific hypotheses and experimental approaches.`,
      },
      {
        role: 'user',
        content: `${gapsText}

For each gap, propose 1-2 concrete research directions. For each direction, provide:
- title: A clear, descriptive title
- hypothesis: A testable hypothesis
- proposedExperiments: Array of 2-4 specific experiments or studies
- requiredData: Array of data or resources needed
- feasibility: "high", "medium", or "low"
- impact: "high", "medium", or "low"

Return ONLY a valid JSON object with this structure:
{
  "directions": [
    {
      "title": "...",
      "hypothesis": "...",
      "proposedExperiments": ["...", "..."],
      "requiredData": ["...", "..."],
      "feasibility": "high|medium|low",
      "impact": "high|medium|low"
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
    const result = JSON.parse(content) as { directions: ProposedDirection[] }
    return { directions: result.directions }
  } catch (error) {
    console.error('Error parsing directions:', error)
    throw new Error('Failed to parse directions from LLM response')
  }
}

