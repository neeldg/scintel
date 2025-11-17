import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runFullAnalysis } from '@/lib/agents/orchestrator'

// POST /api/projects/[id]/analyze - Run full AI analysis on a project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const email = request.headers.get('x-user-email')

    if (!email) {
      return NextResponse.json(
        { error: 'User email required' },
        { status: 401 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        documents: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.documents.length === 0) {
      return NextResponse.json(
        { error: 'Project has no documents. Please upload documents first.' },
        { status: 400 }
      )
    }

    // Run full analysis
    const analysisResult = await runFullAnalysis(params.id)

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('Error running analysis:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to run analysis',
      },
      { status: 500 }
    )
  }
}

