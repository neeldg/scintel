import { generateEmbedding } from './embedding'

export interface DocumentChunk {
  id: string
  text: string
  embedding: number[]
  metadata: {
    documentId: string
    projectId: string
    chunkIndex: number
  }
}

// Simple in-memory vector store
// In production, replace with Postgres+pgvector, Pinecone, or similar
class VectorStore {
  private store: Map<string, DocumentChunk[]> = new Map()

  /**
   * Upsert documents into the vector store for a project
   */
  async upsertDocuments(
    projectId: string,
    docs: { id: string; text: string; metadata?: Record<string, any> }[]
  ): Promise<void> {
    const chunks: DocumentChunk[] = []

    for (const doc of docs) {
      // Split text into chunks (simple approach: ~500 chars per chunk with overlap)
      const textChunks = this.splitIntoChunks(doc.text, 500, 100)

      // Generate embeddings for each chunk
      // For MVP: use first chunk's embedding for the whole document
      // In production, generate one embedding per chunk
      const firstChunk = textChunks[0] || doc.text.substring(0, 500)
      const embedding = await generateEmbedding(firstChunk)

      // Store document with embedding
      const chunk: DocumentChunk = {
        id: `${doc.id}-0`,
        text: doc.text.substring(0, 2000), // Store first 2000 chars for retrieval
        embedding: embedding,
        metadata: {
          documentId: doc.id,
          projectId,
          chunkIndex: 0,
          ...doc.metadata,
        },
      }

      chunks.push(chunk)
    }

    // Store chunks for this project
    const existing = this.store.get(projectId) || []
    this.store.set(projectId, [...existing, ...chunks])
  }

  /**
   * Query documents by similarity
   */
  async queryDocuments(
    projectId: string,
    query: string,
    topK: number = 5
  ): Promise<{ text: string; metadata: Record<string, any>; score: number }[]> {
    const projectChunks = this.store.get(projectId) || []

    if (projectChunks.length === 0) {
      return []
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)

    // Calculate cosine similarity
    const results = projectChunks
      .map(chunk => ({
        text: chunk.text,
        metadata: chunk.metadata,
        score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return results
  }

  /**
   * Get all chunks for a project
   */
  getProjectChunks(projectId: string): DocumentChunk[] {
    return this.store.get(projectId) || []
  }

  /**
   * Clear all chunks for a project
   */
  clearProject(projectId: string): void {
    this.store.delete(projectId)
  }

  /**
   * Split text into chunks with overlap
   */
  private splitIntoChunks(
    text: string,
    chunkSize: number,
    overlap: number
  ): string[] {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.substring(start, end))
      start = end - overlap
    }

    return chunks
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }
}

// Export singleton instance
export const vectorStore = new VectorStore()

