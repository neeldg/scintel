import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/projects/[id] - Get a single project with documents
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

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        userId: user.id, // Ensure user owns the project
      },
      include: {
        documents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

