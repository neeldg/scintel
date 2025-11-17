import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/analyses/[analysisId] - Get a full analysis with comments
export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
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

    // Get analysis with comments
    const analysis = await prisma.analysis.findUnique({
      where: {
        id: params.analysisId,
      },
      include: {
        comments: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        project: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    })

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      )
    }

    // Verify user owns the project
    if (analysis.project.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Parse JSON fields
    const projectProfile = JSON.parse(analysis.projectProfile)
    const scoutedPapers = JSON.parse(analysis.scoutedPapers)
    const gaps = JSON.parse(analysis.gaps)
    const directions = JSON.parse(analysis.directions)
    const criticizedDirections = JSON.parse(analysis.criticizedDirections)

    // Group comments by target
    const commentsByTarget: Record<string, typeof analysis.comments> = {}
    analysis.comments.forEach(comment => {
      const key = `${comment.targetType}:${comment.targetId}`
      if (!commentsByTarget[key]) {
        commentsByTarget[key] = []
      }
      commentsByTarget[key].push(comment)
    })

    return NextResponse.json({
      id: analysis.id,
      projectId: analysis.projectId,
      createdAt: analysis.createdAt,
      projectProfile,
      scoutedPapers,
      gaps,
      directions,
      criticizedDirections,
      commentsByTarget,
    })
  } catch (error) {
    console.error('Error fetching analysis:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    )
  }
}

