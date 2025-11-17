import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/projects - Get all projects for the current user
export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')
    
    if (!email) {
      return NextResponse.json(
        { error: 'User email required' },
        { status: 401 }
      )
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
        },
      })
    }

    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description } = body
    const email = request.headers.get('x-user-email')

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'User email required' },
        { status: 401 }
      )
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
        },
      })
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        userId: user.id,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}

