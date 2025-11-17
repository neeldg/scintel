import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate embeddings for text using OpenAI's embedding model
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}

