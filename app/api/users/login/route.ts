import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/users/login - Create or get user by email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
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

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    console.error('Error in login:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}

