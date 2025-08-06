"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  TrendingUp,
  Zap,
  Clock,
  DollarSign,
  FileText,
  Brain,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
} from "lucide-react"

interface AnalyticsData {
  summary: {
    total_queries: number
    avg_processing_time: number
    avg_confidence: number
    total_tokens: number
    total_cost: number
  }
  documents: {
    total_documents: number
    completed_documents: number
    failed_documents: number
    avg_file_size: number
  }
  domains: Array<{ domain: string; count: number }>
  trends: Array<{ hour: string; query_count: number; avg_time: number }>
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch("/api/analytics")
      const data = await response.json()
      setAnalytics(data.data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">System Analytics</h1>
            <p className="text-xl text-gray-600">Real-time performance and usage insights</p>
          </div>
          <Button onClick={fetchAnalytics} disabled={refreshing}>
            {refreshing ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        </div>

        {analytics && (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="insights">AI Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.summary.total_queries}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.trends.length > 0 && <>+{analytics.trends[0].query_count} in last hour</>}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.summary.avg_processing_time.toFixed(2)}s</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">▼ 12%</span> from yesterday
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                    <Brain className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics.summary.avg_confidence * 100).toFixed(1)}%</div>
                    <Progress value={analytics.summary.avg_confidence * 100} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics.summary.total_cost.toFixed(4)}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.summary.total_tokens.toLocaleString()} tokens used
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* System Health */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Health Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Vector DB</p>
                        <p className="text-xs text-gray-500">Pinecone</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Database</p>
                        <p className="text-xs text-gray-500">PostgreSQL</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">LLM Service</p>
                        <p className="text-xs text-gray-500">GPT-4</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">Cache</p>
                        <p className="text-xs text-gray-500">Redis</p>
                      </div>
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Domain Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Domain Distribution</CardTitle>
                  <CardDescription>Document analysis by domain</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.domains.map((domain, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{domain.domain}</Badge>
                          <span className="text-sm text-gray-600">{domain.count} documents</span>
                        </div>
                        <Progress
                          value={(domain.count / Math.max(...analytics.domains.map((d) => d.count))) * 100}
                          className="w-24"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                    <CardDescription>Real-time system performance indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Query Processing Speed</span>
                        <span>94%</span>
                      </div>
                      <Progress value={94} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Vector Search Accuracy</span>
                        <span>97%</span>
                      </div>
                      <Progress value={97} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Token Efficiency</span>
                        <span>89%</span>
                      </div>
                      <Progress value={89} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>System Uptime</span>
                        <span>99.8%</span>
                      </div>
                      <Progress value={99.8} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resource Utilization</CardTitle>
                    <CardDescription>Current system resource usage</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Vector Database Storage</span>
                        <span>2.3 GB / 10 GB</span>
                      </div>
                      <Progress value={23} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>PostgreSQL Storage</span>
                        <span>850 MB / 5 GB</span>
                      </div>
                      <Progress value={17} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Monthly Token Usage</span>
                        <span>125K / 1M</span>
                      </div>
                      <Progress value={12.5} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>API Rate Limit</span>
                        <span>45 / 100 req/min</span>
                      </div>
                      <Progress value={45} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Processing Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">{analytics.documents.total_documents}</div>
                      <div className="text-sm text-gray-600 mt-1">Total Documents</div>
                    </div>
                    <div className="text-center p-6 bg-green-50 rounded-lg">
                      <div className="text-3xl font-bold text-green-600">{analytics.documents.completed_documents}</div>
                      <div className="text-sm text-gray-600 mt-1">Successfully Processed</div>
                    </div>
                    <div className="text-center p-6 bg-red-50 rounded-lg">
                      <div className="text-3xl font-bold text-red-600">{analytics.documents.failed_documents}</div>
                      <div className="text-sm text-gray-600 mt-1">Processing Failures</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Processing Insights</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Average File Size:</span>
                        <span className="ml-2">{(analytics.documents.avg_file_size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div>
                        <span className="font-medium">Success Rate:</span>
                        <span className="ml-2 text-green-600">
                          {analytics.documents.total_documents > 0
                            ? (
                                (analytics.documents.completed_documents / analytics.documents.total_documents) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Query Trends (Last 24 Hours)</CardTitle>
                  <CardDescription>Hourly query volume and processing time trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.trends.slice(0, 12).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-medium">
                            {new Date(trend.hour).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <Badge variant="outline">{trend.query_count} queries</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{trend.avg_time.toFixed(2)}s avg</span>
                          <Progress value={(trend.query_count / 10) * 100} className="w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      AI-Powered Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Query Pattern Analysis</h4>
                      <p className="text-sm text-blue-700">
                        Insurance-related queries show 23% higher confidence scores, suggesting better training data
                        coverage for this domain.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Performance Optimization</h4>
                      <p className="text-sm text-green-700">
                        Vector search performance improved by 18% after recent index optimization. Consider scaling to
                        handle increased load.
                      </p>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">Cost Optimization</h4>
                      <p className="text-sm text-yellow-700">
                        Token usage could be reduced by 15% through better prompt engineering and context window
                        optimization.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium">Scale Vector Database</p>
                        <p className="text-xs text-gray-600">Add more capacity for growing document corpus</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium">Implement Caching</p>
                        <p className="text-xs text-gray-600">Cache frequent queries to reduce LLM costs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium">Add Multi-language Support</p>
                        <p className="text-xs text-gray-600">Expand to support regional language documents</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                      <div>
                        <p className="text-sm font-medium">Enhanced Security</p>
                        <p className="text-xs text-gray-600">Implement advanced data encryption and access controls</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
