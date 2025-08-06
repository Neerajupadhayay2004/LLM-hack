import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Simulated Pinecone Vector Database
class VectorDatabase {
  private static instance: VectorDatabase
  private vectors: Map<string, { id: string; values: number[]; metadata: any }> = new Map()

  static getInstance(): VectorDatabase {
    if (!VectorDatabase.instance) {
      VectorDatabase.instance = new VectorDatabase()
      VectorDatabase.instance.initializeWithSampleData()
    }
    return VectorDatabase.instance
  }

  private initializeWithSampleData() {
    // Sample vectors for insurance policy chunks
    const sampleChunks = [
      {
        id: "chunk_1",
        text: "Grace period of thirty days is provided for premium payment after the due date",
        metadata: { type: "payment_terms", section: "grace_period" },
      },
      {
        id: "chunk_2",
        text: "Waiting period of thirty-six months for pre-existing diseases and their direct complications",
        metadata: { type: "coverage_terms", section: "pre_existing" },
      },
      {
        id: "chunk_3",
        text: "Maternity expenses covered including childbirth and lawful medical termination of pregnancy",
        metadata: { type: "coverage_benefits", section: "maternity" },
      },
      {
        id: "chunk_4",
        text: "Specific waiting period of two years for cataract surgery",
        metadata: { type: "coverage_terms", section: "cataract" },
      },
      {
        id: "chunk_5",
        text: "Medical expenses for organ donor hospitalization covered for harvesting organ",
        metadata: { type: "coverage_benefits", section: "organ_donor" },
      },
    ]

    sampleChunks.forEach((chunk) => {
      // Generate mock embeddings (in real implementation, use actual embedding model)
      const embedding = Array.from({ length: 1536 }, () => Math.random())
      this.vectors.set(chunk.id, {
        id: chunk.id,
        values: embedding,
        metadata: { ...chunk.metadata, text: chunk.text },
      })
    })
  }

  async query(queryEmbedding: number[], topK = 5): Promise<any[]> {
    // Simulate vector similarity search
    const results = Array.from(this.vectors.values()).map((vector) => ({
      ...vector,
      score: Math.random() * 0.3 + 0.7, // Mock similarity score between 0.7-1.0
    }))

    return results.sort((a, b) => b.score - a.score).slice(0, topK)
  }

  async upsert(vectors: { id: string; values: number[]; metadata: any }[]) {
    vectors.forEach((vector) => {
      this.vectors.set(vector.id, vector)
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, topK = 5, filters = {} } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Generate query embedding (in real implementation, use actual embedding model)
    const queryEmbedding = Array.from({ length: 1536 }, () => Math.random())

    // Search vector database
    const vectorDB = VectorDatabase.getInstance()
    const searchResults = await vectorDB.query(queryEmbedding, topK)

    // Filter results based on metadata filters
    const filteredResults = searchResults.filter((result) => {
      if (Object.keys(filters).length === 0) return true

      return Object.entries(filters).every(([key, value]) => result.metadata[key] === value)
    })

    // Generate contextual answer using retrieved chunks
    const context = filteredResults.map((result) => result.metadata.text).join("\n\n")

    const { text: answer } = await generateText({
      model: openai("gpt-4o"),
      system: `You are an expert document analyst. Based on the retrieved context chunks, provide a comprehensive answer to the user's query. Be specific and cite relevant information from the context.`,
      prompt: `Context:\n${context}\n\nQuery: ${query}\n\nProvide a detailed answer based on the context above.`,
    })

    return NextResponse.json({
      query,
      answer,
      results: filteredResults.map((result) => ({
        id: result.id,
        score: result.score,
        text: result.metadata.text,
        metadata: result.metadata,
      })),
      total_results: filteredResults.length,
      processing_time: Date.now(),
    })
  } catch (error) {
    console.error("Error in vector search:", error)
    return NextResponse.json({ error: "Vector search failed" }, { status: 500 })
  }
}
