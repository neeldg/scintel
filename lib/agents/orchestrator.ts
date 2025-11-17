import { ingestionAgent } from './ingestionAgent'
import { literatureScoutAgent } from './literatureScoutAgent'
import { gapFinderAgent } from './gapFinderAgent'
import { directionGeneratorAgent } from './directionGeneratorAgent'
import { piCriticAgent } from './piCriticAgent'
import { AnalysisResult } from './types'

/**
 * Orchestrator: Coordinates all agents to run a full analysis pipeline
 */
export async function runFullAnalysis(
  projectId: string
): Promise<AnalysisResult> {
  console.log(`[Orchestrator] Starting analysis for project ${projectId}`)

  try {
    // Step 1: Ingestion Agent
    console.log('[Orchestrator] Step 1: Running Ingestion Agent...')
    const { projectProfile } = await ingestionAgent({ projectId })
    console.log('[Orchestrator] ✓ Project profile generated')

    // Step 2: Literature Scout Agent
    console.log('[Orchestrator] Step 2: Running Literature Scout Agent...')
    const { scoutedPapers } = await literatureScoutAgent({
      projectProfile,
      numPapers: 5,
    })
    console.log(`[Orchestrator] ✓ Found ${scoutedPapers.length} relevant papers`)

    // Step 3: Gap Finder Agent
    console.log('[Orchestrator] Step 3: Running Gap Finder Agent...')
    const { gaps } = await gapFinderAgent({
      projectProfile,
      scoutedPapers,
    })
    console.log(`[Orchestrator] ✓ Identified ${gaps.length} research gaps`)

    // Step 4: Direction Generator Agent
    console.log('[Orchestrator] Step 4: Running Direction Generator Agent...')
    const { directions } = await directionGeneratorAgent({ gaps })
    console.log(
      `[Orchestrator] ✓ Generated ${directions.length} research directions`
    )

    // Step 5: PI Critic Agent
    console.log('[Orchestrator] Step 5: Running PI Critic Agent...')
    const { criticizedDirections } = await piCriticAgent({ directions })
    console.log(
      `[Orchestrator] ✓ Critiqued ${criticizedDirections.length} directions`
    )

    console.log('[Orchestrator] ✓ Analysis complete!')

    return {
      projectProfile,
      scoutedPapers,
      gaps,
      directions,
      criticizedDirections,
    }
  } catch (error) {
    console.error('[Orchestrator] Error during analysis:', error)
    throw new Error(
      `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

