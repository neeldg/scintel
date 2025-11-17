import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { processDocument } from '@/lib/documentProcessor'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const email = request.headers.get('x-user-email')

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', projectId)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const originalFileName = file.name
    const fileExtension = originalFileName.split('.').pop()
    const fileName = `${timestamp}-${originalFileName}`
    const filePath = join(uploadsDir, fileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Save document metadata to database
    const document = await prisma.document.create({
      data: {
        projectId,
        title: originalFileName.replace(/\.[^/.]+$/, ''), // Remove extension for title
        filePath: filePath,
        originalFileName,
      },
    })

    // Process document asynchronously (extract text, generate summary, embed)
    // Don't await to avoid blocking the response
    processDocument(document.id, projectId, filePath).catch((error) => {
      console.error(`Error processing document ${document.id}:`, error)
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

