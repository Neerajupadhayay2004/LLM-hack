import { type NextRequest, NextResponse } from "next/server"

// Analytics and monitoring service
class AnalyticsService {
  private static instance: AnalyticsService
  private queryLogs: any[] = []
  private performanceMetrics: any[] = []

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  logQuery(queryData: any) {
    this.queryLogs.push({
      ...queryData,
      timestamp: new Date().toISOString(),
    })
  }

  logPerformance(metricData: any) {
    this.performanceMetrics.push({
      ...metricData,
      timestamp: new Date().toISOString(),
    })
  }

  getAnalytics() {
    const totalQueries = this.queryLogs.length
    const avgResponseTime =
      this.performanceMetrics.length > 0
        ? this.performanceMetrics.reduce((sum, metric) => sum + metric.response_time, 0) /
          this.performanceMetrics.length
        : 0

    const queryTypes = this.queryLogs.reduce((acc, log) => {
      const type = log.category || "general"
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const successRate =
      this.queryLogs.length > 0
        ? (this.queryLogs.filter((log) => log.success).length / this.queryLogs.length) * 100
        : 100

    return {
      total_queries: totalQueries,
      avg_response_time: avgResponseTime,
      success_rate: successRate,
      query_types: queryTypes,
      recent_queries: this.queryLogs.slice(-10),
      performance_trends: this.performanceMetrics.slice(-20),
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const analytics = AnalyticsService.getInstance()
    const data = analytics.getAnalytics()

    return NextResponse.json({
      success: true,
      data,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, data } = await request.json()

    const analytics = AnalyticsService.getInstance()

    if (type === "query") {
      analytics.logQuery(data)
    } else if (type === "performance") {
      analytics.logPerformance(data)
    }

    return NextResponse.json({
      success: true,
      message: "Analytics data logged successfully",
    })
  } catch (error) {
    console.error("Error logging analytics:", error)
    return NextResponse.json({ error: "Failed to log analytics" }, { status: 500 })
  }
}
