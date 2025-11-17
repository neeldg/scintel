import { readFile } from 'fs/promises'
import { join } from 'path'
import pdfParse from 'pdf-parse'
import { vectorStore } from './vectorStore'
import { prisma } from './prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Extract text from a file based on its extension
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  const extension = filePath.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'pdf':
      return await extractTextFromPDF(filePath)
    case 'txt':
      return await extractTextFromTxt(filePath)
    default:
      throw new Error(`Unsupported file type: ${extension}`)
  }
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(filePath)
    const data = await pdfParse(dataBuffer)
    return data.text
  } catch (error) {
    console.error('Error extracting text from PDF:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

/**
 * Extract text from TXT file
 */
async function extractTextFromTxt(filePath: string): Promise<string> {
  try {
    const text = await readFile(filePath, 'utf-8')
    return text
  } catch (error) {
    console.error('Error extracting text from TXT:', error)
    throw new Error('Failed to extract text from TXT file')
  }
}

/**
 * Generate a summary of the document using OpenAI
 */
export async function generateDocumentSummary(text: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'Summary generation requires OPENAI_API_KEY'
  }

  try {
    // Truncate text if too long (keep first 8000 chars for summary)
    const truncatedText = text.substring(0, 8000)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a research assistant. Generate a concise 2-3 sentence summary of the following document, focusing on key findings, methods, and contributions.',
        },
        {
          role: 'user',
          content: `Document text:\n\n${truncatedText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    })

    return response.choices[0]?.message?.content || 'No summary generated'
  } catch (error) {
    console.error('Error generating summary:', error)
    return 'Failed to generate summary'
  }
}

/**
 * Process and ingest a document: extract text, generate summary, chunk, and embed
 */
export async function processDocument(
  documentId: string,
  projectId: string,
  filePath: string
): Promise<void> {
  try {
    // Extract text from file
    const text = await extractTextFromFile(filePath)

    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from document')
    }

    // Generate summary
    const summary = await generateDocumentSummary(text)

    // Update document with summary
    await prisma.document.update({
      where: { id: documentId },
      data: { summary },
    })

    // Chunk and embed document
    await vectorStore.upsertDocuments(projectId, [
      {
        id: documentId,
        text,
        metadata: {
          filePath,
        },
      },
    ])

    console.log(`Processed document ${documentId} for project ${projectId}`)
  } catch (error) {
    console.error('Error processing document:', error)
    throw error
  }
}

