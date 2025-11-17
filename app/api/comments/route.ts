import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { projectId, analysisId, targetType, targetId, content } = body

    if (!projectId || !targetType || !targetId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, targetType, targetId, content' },
        { status: 400 }
      )
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // If analysisId is provided, verify it exists and belongs to the project
    if (analysisId) {
      const analysis = await prisma.analysis.findFirst({
        where: {
          id: analysisId,
          projectId: projectId,
        },
      })

      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis not found' },
          { status: 404 }
        )
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        projectId,
        analysisId: analysisId || null,
        userId: user.id,
        targetType,
        targetId,
        content: content.trim(),
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

