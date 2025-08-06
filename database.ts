import { Pool, type PoolClient } from "pg"

export interface Document {
  id?: number
  url: string
  title: string
  content: string
  document_type: string
  file_size: number
  page_count: number
  language: string
  domain: string
  processing_status: "pending" | "processing" | "completed" | "failed"
  created_at?: Date
  updated_at?: Date
  metadata: Record<string, any>
}

export interface QueryLog {
  id?: number
  document_id: number
  query_text: string
  answer: string
  confidence_score: number
  processing_time: number
  tokens_used: number
  cost_estimate: number
  user_feedback?: "positive" | "negative" | "neutral"
  created_at?: Date
  metadata: Record<string, any>
}

export class AdvancedDatabaseService {
  private pool: Pool

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  async executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const client: PoolClient = await this.pool.connect()
    try {
      const result = await client.query(query, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  async createDocument(document: Omit<Document, "id" | "created_at" | "updated_at">): Promise<Document> {
    const query = `
      INSERT INTO documents (url, title, content, document_type, file_size, page_count, language, domain, processing_status, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `
    const params = [
      document.url,
      document.title,
      document.content,
      document.document_type,
      document.file_size,
      document.page_count,
      document.language,
      document.domain,
      document.processing_status,
      JSON.stringify(document.metadata),
    ]

    const results = await this.executeQuery<Document>(query, params)
    return results[0]
  }

  async updateDocumentStatus(id: number, status: Document["processing_status"], metadata?: Record<string, any>) {
    const query = `
      UPDATE documents 
      SET processing_status = $1, updated_at = CURRENT_TIMESTAMP, metadata = COALESCE($2, metadata)
      WHERE id = $3
      RETURNING *
    `
    const params = [status, metadata ? JSON.stringify(metadata) : null, id]
    return await this.executeQuery<Document>(query, params)
  }

  async logQuery(queryLog: Omit<QueryLog, "id" | "created_at">): Promise<QueryLog> {
    const query = `
      INSERT INTO query_logs (document_id, query_text, answer, confidence_score, processing_time, tokens_used, cost_estimate, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `
    const params = [
      queryLog.document_id,
      queryLog.query_text,
      queryLog.answer,
      queryLog.confidence_score,
      queryLog.processing_time,
      queryLog.tokens_used,
      queryLog.cost_estimate,
      JSON.stringify(queryLog.metadata),
    ]

    const results = await this.executeQuery<QueryLog>(query, params)
    return results[0]
  }

  async getAnalytics(timeRange: "1h" | "24h" | "7d" | "30d" = "24h") {
    const timeFilter = {
      "1h": "INTERVAL '1 hour'",
      "24h": "INTERVAL '24 hours'",
      "7d": "INTERVAL '7 days'",
      "30d": "INTERVAL '30 days'",
    }[timeRange]

    const analytics = await Promise.all([
      // Query count and performance
      this.executeQuery(`
        SELECT 
          COUNT(*) as total_queries,
          AVG(processing_time) as avg_processing_time,
          AVG(confidence_score) as avg_confidence,
          SUM(tokens_used) as total_tokens,
          SUM(cost_estimate) as total_cost
        FROM query_logs 
        WHERE created_at > NOW() - ${timeFilter}
      `),

      // Document processing stats
      this.executeQuery(`
        SELECT 
          COUNT(*) as total_documents,
          COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as completed_documents,
          COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_documents,
          AVG(file_size) as avg_file_size
        FROM documents 
        WHERE created_at > NOW() - ${timeFilter}
      `),

      // Domain distribution
      this.executeQuery(`
        SELECT domain, COUNT(*) as count
        FROM documents 
        WHERE created_at > NOW() - ${timeFilter}
        GROUP BY domain
        ORDER BY count DESC
      `),

      // Hourly query trends
      this.executeQuery(`
        SELECT 
          DATE_TRUNC('hour', created_at) as hour,
          COUNT(*) as query_count,
          AVG(processing_time) as avg_time
        FROM query_logs 
        WHERE created_at > NOW() - ${timeFilter}
        GROUP BY hour
        ORDER BY hour DESC
        LIMIT 24
      `),
    ])

    return {
      summary: analytics[0][0],
      documents: analytics[1][0],
      domains: analytics[2],
      trends: analytics[3],
    }
  }

  async getTopPerformingDocuments(limit = 10) {
    const query = `
      SELECT 
        d.id, d.title, d.domain,
        COUNT(ql.id) as query_count,
        AVG(ql.confidence_score) as avg_confidence,
        AVG(ql.processing_time) as avg_processing_time
      FROM documents d
      LEFT JOIN query_logs ql ON d.id = ql.document_id
      WHERE d.processing_status = 'completed'
      GROUP BY d.id, d.title, d.domain
      HAVING COUNT(ql.id) > 0
      ORDER BY query_count DESC, avg_confidence DESC
      LIMIT $1
    `
    return await this.executeQuery(query, [limit])
  }

  async searchDocuments(
    searchTerm: string,
    filters: {
      domain?: string
      document_type?: string
      language?: string
      status?: string
    } = {},
  ) {
    let query = `
      SELECT d.*, 
        ts_rank(to_tsvector('english', d.title || ' ' || d.content), plainto_tsquery('english', $1)) as relevance_score
      FROM documents d
      WHERE to_tsvector('english', d.title || ' ' || d.content) @@ plainto_tsquery('english', $1)
    `
    const params: any[] = [searchTerm]
    let paramIndex = 2

    if (filters.domain) {
      query += ` AND d.domain = $${paramIndex}`
      params.push(filters.domain)
      paramIndex++
    }

    if (filters.document_type) {
      query += ` AND d.document_type = $${paramIndex}`
      params.push(filters.document_type)
      paramIndex++
    }

    if (filters.language) {
      query += ` AND d.language = $${paramIndex}`
      params.push(filters.language)
      paramIndex++
    }

    if (filters.status) {
      query += ` AND d.processing_status = $${paramIndex}`
      params.push(filters.status)
      paramIndex++
    }

    query += ` ORDER BY relevance_score DESC, d.created_at DESC LIMIT 50`

    return await this.executeQuery(query, params)
  }

  async close() {
    await this.pool.end()
  }
}
