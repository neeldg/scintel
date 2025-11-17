import OpenAI from 'openai'
import { ProposedDirection, CriticizedDirection } from './types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface PiCriticAgentInput {
  directions: ProposedDirection[]
}

export interface PiCriticAgentOutput {
  criticizedDirections: CriticizedDirection[]
}

/**
 * PI Critic Agent: Reviews proposed directions from a Principal Investigator perspective
 */
export async function piCriticAgent(
  input: PiCriticAgentInput
): Promise<PiCriticAgentOutput> {
  const { directions } = input

  const directionsText = directions
    .map(
      (dir, idx) => `
Direction ${idx + 1}: ${dir.title}
Hypothesis: ${dir.hypothesis}
Proposed Experiments: ${dir.proposedExperiments.join('\n- ')}
Required Data: ${dir.requiredData.join(', ')}
Feasibility: ${dir.feasibility}
Impact: ${dir.impact}
`
    )
    .join('\n---\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a Principal Investigator (PI) reviewing research proposals. Provide critical, constructive feedback from the perspective of an experienced researcher who evaluates proposals for funding, feasibility, and scientific rigor. Be thorough but fair.`,
      },
      {
        role: 'user',
        content: `${directionsText}

Review each proposed research direction from a PI perspective. For each direction, provide:
- strengths: Array of 2-3 strengths
- weaknesses: Array of 2-3 weaknesses or concerns
- risks: Array of potential risks or challenges
- suggestedImprovements: Array of specific suggestions to improve the direction
- piComment: A 2-3 sentence overall comment from the PI perspective

Keep all original fields (title, hypothesis, proposedExperiments, requiredData, feasibility, impact).

Return ONLY a valid JSON object with this structure:
{
  "criticizedDirections": [
    {
      "title": "...",
      "hypothesis": "...",
      "proposedExperiments": ["...", "..."],
      "requiredData": ["...", "..."],
      "feasibility": "high|medium|low",
      "impact": "high|medium|low",
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "risks": ["...", "..."],
      "suggestedImprovements": ["...", "..."],
      "piComment": "..."
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
    const result = JSON.parse(content) as {
      criticizedDirections: CriticizedDirection[]
    }
    return { criticizedDirections: result.criticizedDirections }
  } catch (error) {
    console.error('Error parsing criticized directions:', error)
    throw new Error('Failed to parse criticized directions from LLM response')
  }
}

