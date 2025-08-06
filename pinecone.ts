import { Pinecone } from "@pinecone-database/pinecone"
import { OpenAIEmbeddings } from "@langchain/openai"

export interface VectorMetadata {
  documentId: string
  chunkIndex: number
  text: string
  section: string
  domain: string
  confidence: number
  timestamp: string
  keywords: string[]
  entityType: string
}

export class AdvancedPineconeService {
  private pinecone: Pinecone
  private embeddings: OpenAIEmbeddings
  private indexName: string

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "your-api-key",
    })
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-large",
      dimensions: 3072,
    })
    this.indexName = "llm-retrieval-system"
  }

  async initializeIndex() {
    try {
      const indexList = await this.pinecone.listIndexes()
      const indexExists = indexList.indexes?.some((index) => index.name === this.indexName)

      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 3072,
          metric: "cosine",
          spec: {
            serverless: {
              cloud: "aws",
              region: "us-east-1",
            },
          },
        })
        console.log(`Created Pinecone index: ${this.indexName}`)
      }
    } catch (error) {
      console.error("Error initializing Pinecone index:", error)
    }
  }

  async upsertVectors(
    documents: Array<{
      id: string
      text: string
      metadata: VectorMetadata
    }>,
  ) {
    const index = this.pinecone.Index(this.indexName)

    const vectors = await Promise.all(
      documents.map(async (doc) => {
        const embedding = await this.embeddings.embedQuery(doc.text)
        return {
          id: doc.id,
          values: embedding,
          metadata: doc.metadata,
        }
      }),
    )

    await index.upsert(vectors)
    return vectors.length
  }

  async semanticSearch(
    query: string,
    options: {
      topK?: number
      filters?: Record<string, any>
      includeMetadata?: boolean
    } = {},
  ) {
    const { topK = 10, filters = {}, includeMetadata = true } = options

    const queryEmbedding = await this.embeddings.embedQuery(query)
    const index = this.pinecone.Index(this.indexName)

    const searchRequest: any = {
      vector: queryEmbedding,
      topK,
      includeMetadata,
    }

    if (Object.keys(filters).length > 0) {
      searchRequest.filter = filters
    }

    const results = await index.query(searchRequest)

    return (
      results.matches?.map((match) => ({
        id: match.id,
        score: match.score || 0,
        text: match.metadata?.text || "",
        metadata: match.metadata,
      })) || []
    )
  }

  async hybridSearch(
    query: string,
    keywords: string[],
    options: {
      semanticWeight?: number
      keywordWeight?: number
      topK?: number
    } = {},
  ) {
    const { semanticWeight = 0.7, keywordWeight = 0.3, topK = 10 } = options

    // Semantic search
    const semanticResults = await this.semanticSearch(query, { topK: topK * 2 })

    // Keyword-based filtering
    const keywordFiltered = semanticResults.filter((result) =>
      keywords.some(
        (keyword) =>
          result.text.toLowerCase().includes(keyword.toLowerCase()) ||
          result.metadata?.keywords?.some((k: string) => k.toLowerCase().includes(keyword.toLowerCase())),
      ),
    )

    // Combine and re-rank results
    const hybridResults = semanticResults.map((result) => {
      const keywordBoost = keywordFiltered.includes(result) ? keywordWeight : 0
      const finalScore = result.score * semanticWeight + keywordBoost

      return {
        ...result,
        hybridScore: finalScore,
      }
    })

    return hybridResults.sort((a, b) => b.hybridScore - a.hybridScore).slice(0, topK)
  }

  async deleteVectors(ids: string[]) {
    const index = this.pinecone.Index(this.indexName)
    await index.deleteMany(ids)
  }

  async getIndexStats() {
    const index = this.pinecone.Index(this.indexName)
    return await index.describeIndexStats()
  }
}
