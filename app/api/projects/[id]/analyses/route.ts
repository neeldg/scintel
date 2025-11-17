import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[id]/analyses - Get all analyses for a project
export async function GET(
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
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get all analyses for this project
    const analyses = await prisma.analysis.findMany({
      where: {
        projectId: params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        createdAt: true,
        // Include a preview of the project profile
        projectProfile: true,
      },
    })

    // Parse project profiles for preview
    const analysesWithPreview = analyses.map(analysis => ({
      id: analysis.id,
      createdAt: analysis.createdAt,
      preview: JSON.parse(analysis.projectProfile) as { researchArea: string },
    }))

    return NextResponse.json(analysesWithPreview)
  } catch (error) {
    console.error('Error fetching analyses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    )
  }
}

