"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileText, Search, Brain, Database, Zap, CheckCircle, Clock, AlertCircle, Upload, Settings, BarChart3, TrendingUp, Shield, Cpu, FileImage, FileSpreadsheet, Globe, Mail, BookOpen, Presentation, RefreshCw, ThumbsUp, ThumbsDown, Copy, Download, Eye, Star, Target, Lightbulb, AlertTriangle, X, Plus, Trash2, Activity, Bell, FileDown } from 'lucide-react'
import { useDropzone } from "react-dropzone"
import { RealtimeMonitor } from "@/components/real-time-monitor"
import { ReportGenerator } from "@/components/report-generator"

interface QueryResult {
  question: string
  answer: string
  confidence: number
  sources: string[]
  reasoning: string
  processing_time: number
  relevant_clauses?: string[]
  decision_rationale?: string
  compliance_status?: string
  risk_assessment?: string
  recommendations?: string[]
  key_insights?: string[]
  action_items?: string[]
}

interface ProcessingStats {
  total_questions: number
  avg_processing_time: number
  total_tokens_used: number
  cost_estimate: number
  documents_processed: number
  success_rate: number
  avg_confidence: number
}

interface UploadedDocument {
  id: string
  name: string
  type: string
  size: number
  url: string
  status: "uploading" | "processing" | "completed" | "error"
  progress: number
  preview?: string
}

interface DocumentAnalysis {
  summary: string
  key_topics: string[]
  entities: {
    persons: string[]
    organizations: string[]
    dates: string[]
    amounts: string[]
    locations: string[]
  }
  sentiment: "positive" | "neutral" | "negative"
  complexity_score: number
  readability_score: number
  word_count: number
  page_count: number
}

interface RealtimeStatus {
  isActive: boolean
  currentStage: string
  progress: number
  insights: number
}

export default function HomePage() {
  const [documentUrl, setDocumentUrl] = useState("")
  const [questions, setQuestions] = useState("")
  const [results, setResults] = useState<QueryResult[]>([])
  const [stats, setStats] = useState<ProcessingStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedDomain, setSelectedDomain] = useState("insurance")
  const [advancedMode, setAdvancedMode] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [realTimeMode, setRealTimeMode] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "demo" | "checking">("checking")
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>({
    isActive: false,
    currentStage: '',
    progress: 0,
    insights: 0
  })
  const [notifications, setNotifications] = useState<any[]>([])

  // Enhanced document upload with drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const newDoc: UploadedDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type || getFileType(file.name),
        size: file.size,
        url: URL.createObjectURL(file),
        status: "uploading",
        progress: 0,
      }

      setUploadedDocuments((prev) => [...prev, newDoc])
      simulateUpload(newDoc.id, file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/csv": [".csv"],
      "application/json": [".json"],
      "text/html": [".html"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  // Real-time notifications
  useEffect(() => {
    if (realtimeStatus.isActive) {
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          addNotification({
            id: Date.now(),
            type: 'info',
            title: 'Processing Update',
            message: `Completed ${realtimeStatus.currentStage} analysis`,
            timestamp: new Date().toISOString()
          })
        }
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [realtimeStatus.isActive])

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 10000)
  }

  const simulateUpload = async (docId: string, file: File) => {
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setUploadedDocuments((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, progress: i } : doc))
      )
    }

    // Simulate processing
    setUploadedDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, status: "processing", progress: 0 } : doc))
    )

    // Start real-time monitoring if enabled
    if (realTimeMode) {
      setRealtimeStatus(prev => ({
        ...prev,
        isActive: true,
        currentStage: 'Document parsing'
      }))
    }

    // Simulate document analysis
    await analyzeDocument(file, docId)
  }

  const analyzeDocument = async (file: File, docId: string) => {
    try {
      const stages = [
        'Extracting content',
        'Generating embeddings',
        'Semantic analysis',
        'Entity extraction',
        'Finalizing results'
      ]

      for (let i = 0; i < stages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        const progress = ((i + 1) / stages.length) * 100
        
        setUploadedDocuments((prev) =>
          prev.map((doc) => (doc.id === docId ? { ...doc, progress } : doc))
        )

        if (realTimeMode) {
          setRealtimeStatus(prev => ({
            ...prev,
            currentStage: stages[i],
            progress,
            insights: Math.floor(Math.random() * 5) + 1
          }))
        }
      }

      // Generate comprehensive analysis results
      const analysis: DocumentAnalysis = {
        summary: `This ${selectedDomain} document has been successfully processed and analyzed. The document contains comprehensive information about policy terms, coverage details, exclusions, and procedural requirements. Advanced AI analysis has extracted key entities, relationships, and semantic structures to enable precise question-answering capabilities.`,
        key_topics: [
          "Policy Coverage Terms",
          "Premium Payment Procedures",
          "Claims Process Guidelines",
          "Coverage Exclusions",
          "Terms & Conditions",
          "Waiting Period Requirements",
          "Beneficiary Information",
          "Compliance Standards",
          "Risk Assessment Criteria",
          "Renewal Procedures"
        ],
        entities: {
          persons: ["Policy Holder", "Beneficiary", "Medical Practitioner", "Insurance Agent", "Claims Officer"],
          organizations: ["Insurance Company", "Hospital Network", "IRDAI", "Third Party Administrator", "Regulatory Authority"],
          dates: ["Policy Inception Date", "Renewal Date", "Grace Period", "Waiting Period", "Claim Filing Deadline"],
          amounts: ["Premium Amount", "Sum Insured", "Deductible Amount", "Co-payment", "Room Rent Limit", "ICU Charges"],
          locations: ["India", "Network Hospitals", "Registered Address", "Service Areas", "Coverage Territories"],
        },
        sentiment: "neutral",
        complexity_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
        readability_score: Math.random() * 0.2 + 0.6, // 0.6-0.8
        word_count: Math.floor(Math.random() * 8000) + 5000,
        page_count: Math.floor(Math.random() * 25) + 15,
      }

      setDocumentAnalysis(analysis)
      setUploadedDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                status: "completed",
                progress: 100,
                preview: analysis.summary.substring(0, 120) + "...",
              }
            : doc
        )
      )

      // Stop real-time monitoring
      if (realTimeMode) {
        setRealtimeStatus(prev => ({
          ...prev,
          isActive: false,
          currentStage: 'Analysis completed',
          progress: 100
        }))

        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Document Processing Complete',
          message: `${file.name} has been successfully analyzed`,
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      setUploadedDocuments((prev) =>
        prev.map((doc) => (doc.id === docId ? { ...doc, status: "error", progress: 0 } : doc))
      )

      addNotification({
        id: Date.now(),
        type: 'error',
        title: 'Processing Failed',
        message: `Failed to process ${file.name}`,
        timestamp: new Date().toISOString()
      })
    }
  }

  const getFileType = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase()
    const typeMap: { [key: string]: string } = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      csv: "text/csv",
      json: "application/json",
      html: "text/html",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }
    return typeMap[extension || ""] || "application/octet-stream"
  }

  const removeDocument = (docId: string) => {
    setUploadedDocuments((prev) => prev.filter((doc) => doc.id !== docId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProgress(0)
    setResults([])

    try {
      const questionList = questions.split("\n").filter((q) => q.trim())
      const completedDocs = uploadedDocuments.filter((doc) => doc.status === "completed")

      if (completedDocs.length === 0 && !documentUrl.trim()) {
        alert("Please upload documents or provide document URLs before submitting questions.")
        setLoading(false)
        return
      }

      // Start real-time analysis
      if (realTimeMode) {
        setRealtimeStatus({
          isActive: true,
          currentStage: 'Query processing',
          progress: 0,
          insights: 0
        })
      }

      // Enhanced progress simulation with real-time updates
      const progressStages = [
        'Preparing document context',
        'Generating semantic embeddings',
        'Performing vector search',
        'Running AI analysis',
        'Generating insights',
        'Finalizing results'
      ]

      for (let i = 0; i < progressStages.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        const stageProgress = ((i + 1) / progressStages.length) * 90 // Leave 10% for final processing
        setProgress(stageProgress)

        if (realTimeMode) {
          setRealtimeStatus(prev => ({
            ...prev,
            currentStage: progressStages[i],
            progress: stageProgress
          }))
        }
      }

      // Generate enhanced demo responses with advanced features
      const demoResults = questionList.map((question, index) => ({
        question,
        answer: generateEnhancedAnswer(question, selectedDomain),
        confidence: 0.82 + Math.random() * 0.15,
        sources: [
          `Policy Document Section ${index + 1}`,
          `Regulatory Clause ${index + 2}`,
          `Terms & Conditions Chapter ${index + 3}`,
          `Industry Guidelines Reference`,
        ],
        reasoning: generateReasoning(question, selectedDomain),
        processing_time: 1.1 + Math.random() * 1.2,
        relevant_clauses: [
          `Section ${index + 1}.${index + 1}: ${generateClause(question, selectedDomain)}`,
          `Article ${index + 2}: ${generateClause(question, selectedDomain)}`,
        ],
        decision_rationale: generateDecisionRationale(question, selectedDomain),
        compliance_status: Math.random() > 0.25 ? "compliant" : Math.random() > 0.5 ? "unclear" : "requires_review",
        risk_assessment: generateRiskAssessment(question, selectedDomain),
        recommendations: generateRecommendations(question, selectedDomain),
        key_insights: generateKeyInsights(question, selectedDomain),
        action_items: generateActionItems(question, selectedDomain),
      }))

      setProgress(100)
      setResults(demoResults)
      
      const enhancedStats: ProcessingStats = {
        total_questions: questionList.length,
        avg_processing_time: 1.3,
        total_tokens_used: questionList.length * 180,
        cost_estimate: questionList.length * 0.0025,
        documents_processed: completedDocs.length || 1,
        success_rate: 0.96,
        avg_confidence: demoResults.reduce((sum, r) => sum + r.confidence, 0) / demoResults.length
      }

      setStats(enhancedStats)

      // Final real-time update
      if (realTimeMode) {
        setRealtimeStatus({
          isActive: false,
          currentStage: 'Analysis completed',
          progress: 100,
          insights: demoResults.length
        })

        addNotification({
          id: Date.now(),
          type: 'success',
          title: 'Query Analysis Complete',
          message: `Successfully analyzed ${questionList.length} questions`,
          timestamp: new Date().toISOString()
        })
      }

      setActiveTab("results")
    } catch (error) {
      console.error("Error:", error)
      alert(`Failed to process request: ${error}`)
      
      if (realTimeMode) {
        setRealtimeStatus(prev => ({ ...prev, isActive: false }))
        addNotification({
          id: Date.now(),
          type: 'error',
          title: 'Analysis Failed',
          message: 'An error occurred during processing',
          timestamp: new Date().toISOString()
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Enhanced answer generation with domain-specific intelligence
  const generateEnhancedAnswer = (question: string, domain: string): string => {
    const templates = {
      insurance: {
        grace: "The grace period for premium payment is 30 days from the due date as per policy terms. During this period, the policy remains in force and provides full coverage, but claims will only be processed after premium payment is received. This grace period ensures continuity of coverage while providing reasonable flexibility for premium payment delays.",
        maternity: "Maternity benefits are covered under this policy with a mandatory waiting period of 24 months from the date of continuous coverage. The coverage includes normal delivery, cesarean section, pre-natal and post-natal care, and pregnancy-related complications. Benefits are limited to two deliveries per policy period, and coverage extends to newborn care for the first 90 days.",
        preexisting: "Pre-existing diseases and conditions have a waiting period of 36 months from the first policy inception date. Any condition, ailment, injury, or disease that was diagnosed by a physician or for which medical advice or treatment was received before the policy effective date falls under this category. After completion of the waiting period, these conditions are covered subject to policy terms.",
        room: "Room rent charges are subject to sub-limits as specified in the policy schedule. For standard plans, daily room rent is typically capped at 1% of the Sum Insured, while ICU charges are limited to 2% of the Sum Insured. These restrictions do not apply when treatment is received at Preferred Provider Network hospitals or for specific listed procedures.",
      }
    }

    const questionLower = question.toLowerCase()
    if (domain === "insurance") {
      if (questionLower.includes("grace") || questionLower.includes("premium")) return templates.insurance.grace
      if (questionLower.includes("maternity") || questionLower.includes("pregnancy")) return templates.insurance.maternity
      if (questionLower.includes("pre-existing") || questionLower.includes("waiting")) return templates.insurance.preexisting
      if (questionLower.includes("room") || questionLower.includes("rent")) return templates.insurance.room
    }

    return `Based on comprehensive AI analysis of the ${domain} documentation, this query addresses critical policy provisions and regulatory requirements. The response is formulated through advanced semantic analysis of relevant document sections, cross-referenced with industry standards and compliance frameworks to ensure accuracy and completeness.`
  }

  const generateReasoning = (question: string, domain: string): string => {
    return `The analysis employed multi-layered reasoning combining document semantic search, entity relationship mapping, and domain-specific knowledge graphs. The system identified relevant policy clauses through vector similarity matching (confidence score > 0.8), validated against regulatory compliance frameworks, and synthesized the response using advanced language models trained on ${domain} documentation.`
  }

  const generateClause = (question: string, domain: string): string => {
    const clauses = [
      "This provision shall be interpreted in strict accordance with applicable regulatory guidelines and industry best practices established by competent authorities.",
      "The terms and conditions outlined herein constitute binding obligations upon all parties, their successors, assigns, and legal representatives as permitted by law.",
      "Compliance with this clause is mandatory and subject to periodic review, audit, and updates as required by regulatory changes or business requirements.",
      "Any modifications, amendments, or waivers to this provision must be documented in writing and require explicit authorization from designated representatives.",
      "This clause operates in conjunction with other policy provisions and should be read as part of the comprehensive coverage framework established herein."
    ]
    return clauses[Math.floor(Math.random() * clauses.length)]
  }

  const generateDecisionRationale = (question: string, domain: string): string => {
    return `The decision framework incorporates comprehensive document analysis, regulatory compliance verification, risk assessment protocols, and industry standard benchmarking. This multi-faceted approach ensures that responses align with ${domain} best practices while maintaining legal validity and operational feasibility. The analysis considered precedent cases, regulatory guidance, and stakeholder impact assessments.`
  }

  const generateRiskAssessment = (question: string, domain: string): string => {
    const risks = [
      "Low operational risk - Standard policy provision with established implementation procedures and clear compliance pathways.",
      "Medium compliance risk - Requires ongoing monitoring and periodic validation to ensure continued adherence to evolving regulatory requirements.",
      "Minimal financial risk - Well-established industry practice with robust risk mitigation frameworks and regulatory oversight mechanisms.",
      "Controlled implementation risk - Proper documentation, stakeholder communication, and systematic procedures effectively mitigate potential operational challenges.",
      "Low reputational risk - Transparent processes, clear communication protocols, and established grievance mechanisms minimize stakeholder concerns."
    ]
    return risks[Math.floor(Math.random() * risks.length)]
  }

  const generateRecommendations = (question: string, domain: string): string[] => {
    return [
      "Establish systematic review cycles to ensure policy documentation remains current with regulatory changes and industry developments",
      "Implement comprehensive stakeholder communication protocols to ensure clear understanding of requirements and procedures",
      "Deploy advanced monitoring and compliance tracking systems to identify potential issues before they impact operations",
      "Develop staff training programs to maintain expertise in policy interpretation and implementation procedures",
      "Create detailed audit trails and documentation protocols to support compliance verification and regulatory reporting",
      "Establish feedback mechanisms to continuously improve policy effectiveness and stakeholder satisfaction"
    ]
  }

  const generateKeyInsights = (question: string, domain: string): string[] => {
    return [
      "Policy provisions demonstrate strong alignment with current regulatory frameworks and industry best practices for comprehensive risk management",
      "Documentation structure supports efficient implementation and compliance verification through clear hierarchical organization and cross-referencing",
      "Systematic monitoring capabilities enable proactive identification of compliance requirements and operational optimization opportunities",
      "Stakeholder communication frameworks facilitate transparent information sharing and effective grievance resolution mechanisms",
      "Risk management protocols integrate multiple assessment dimensions to provide comprehensive coverage of potential operational challenges"
    ]
  }

  const generateActionItems = (question: string, domain: string): string[] => {
    return [
      "Conduct quarterly policy review sessions with relevant stakeholders to identify improvement opportunities and regulatory updates",
      "Implement digital notification systems to ensure timely communication of policy changes and important deadlines to all stakeholders",
      "Establish metrics-based monitoring dashboards to track compliance performance and identify areas requiring immediate attention",
      "Schedule annual training programs for staff members involved in policy implementation and compliance management activities",
      "Create comprehensive documentation libraries with search capabilities to improve access to policy information and procedures"
    ]
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addNotification({
      id: Date.now(),
      type: 'info',
      title: 'Copied to Clipboard',
      message: 'Text has been copied successfully',
      timestamp: new Date().toISOString()
    })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.85) return "bg-emerald-500"
    if (confidence > 0.7) return "bg-amber-500"
    return "bg-red-500"
  }

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800 border-green-200"
      case "non-compliant":
        return "bg-red-100 text-red-800 border-red-200"
      case "unclear":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "requires_review":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "uploading":
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />
      case "processing":
        return <RefreshCw className="h-4 w-4 text-orange-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            className={`w-80 shadow-lg border transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-50 border-green-200' :
              notification.type === 'error' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}
          >
            <Bell className="h-4 w-4" />
            <AlertDescription>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm opacity-90">{notification.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Advanced Document Intelligence System
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Upload, analyze, and query documents with AI-powered intelligence for comprehensive insights, real-time analysis, and professional reporting
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Cpu className="h-3 w-3 mr-1" />
              AI-Powered Analysis
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              Secure Processing
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Zap className="h-3 w-3 mr-1" />
              Real-time Insights
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <FileDown className="h-3 w-3 mr-1" />
              Report Generation
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm border border-gray-200">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="query" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Search className="h-4 w-4 mr-2" />
              Query
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Lightbulb className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="realtime" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Activity className="h-4 w-4 mr-2" />
              Live Monitor
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileDown className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <div className="space-y-6">
              {/* Document Upload Section */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b">
                  <CardTitle className="text-gray-900">Document Upload & Processing</CardTitle>
                  <CardDescription>
                    Upload documents in multiple formats for AI-powered analysis and querying
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Drag & Drop Upload Area */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          {isDragActive ? "Drop files here..." : "Drag & drop files here"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          or click to browse • PDF, DOCX, TXT, CSV, JSON, HTML, XLSX, PPTX supported
                        </p>
                        <p className="text-xs text-gray-400 mt-2">Maximum file size: 50MB</p>
                      </div>
                    </div>
                  </div>

                  {/* URL Upload Option */}
                  <div className="mt-6">
                    <Label className="text-sm font-medium text-gray-900">Or provide document URL</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="https://example.com/document.pdf"
                        value={documentUrl}
                        onChange={(e) => setDocumentUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => {
                          if (documentUrl.trim()) {
                            const newDoc: UploadedDocument = {
                              id: Math.random().toString(36).substr(2, 9),
                              name: documentUrl.split("/").pop() || "URL Document",
                              type: "url",
                              size: 0,
                              url: documentUrl,
                              status: "uploading",
                              progress: 0,
                            }
                            setUploadedDocuments((prev) => [...prev, newDoc])
                            // Simulate URL processing
                            setTimeout(() => {
                              setUploadedDocuments((prev) =>
                                prev.map((doc) =>
                                  doc.id === newDoc.id ? { ...doc, status: "completed", progress: 100 } : doc
                                )
                              )
                            }, 3000)
                            setDocumentUrl("")
                          }
                        }}
                        disabled={!documentUrl.trim()}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add URL
                      </Button>
                    </div>
                  </div>

                  {/* Domain Selection */}
                  <div className="mt-6">
                    <Label className="text-sm font-medium text-gray-900">Document Domain</Label>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insurance">🏥 Insurance & Healthcare</SelectItem>
                        <SelectItem value="legal">⚖️ Legal & Contracts</SelectItem>
                        <SelectItem value="hr">👥 Human Resources</SelectItem>
                        <SelectItem value="compliance">📋 Compliance & Audit</SelectItem>
                        <SelectItem value="financial">💰 Financial Services</SelectItem>
                        <SelectItem value="medical">🩺 Medical & Clinical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Real-time Processing Toggle */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium text-gray-900">Real-time Processing</Label>
                        <p className="text-xs text-gray-500 mt-1">Enable live monitoring and progress updates</p>
                      </div>
                      <Switch checked={realTimeMode} onCheckedChange={setRealTimeMode} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uploaded Documents List */}
              {uploadedDocuments.length > 0 && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Uploaded Documents ({uploadedDocuments.length})</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadedDocuments([])}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {uploadedDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50"
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            {getStatusIcon(doc.status)}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                <span className="capitalize">{doc.status.replace('_', ' ')}</span>
                                {doc.status === "completed" && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Ready for Analysis
                                  </Badge>
                                )}
                              </div>
                              {doc.preview && (
                                <p className="text-xs text-gray-400 mt-1 truncate">{doc.preview}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {(doc.status === "uploading" || doc.status === "processing") && (
                              <div className="w-24">
                                <Progress value={doc.progress} className="h-2" />
                                <p className="text-xs text-center mt-1">{doc.progress.toFixed(0)}%</p>
                              </div>
                            )}
                            {doc.status === "completed" && (
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => removeDocument(doc.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="query">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b">
                <CardTitle className="text-gray-900">Intelligent Query Interface</CardTitle>
                <CardDescription>
                  Ask natural language questions about your uploaded documents for AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Questions Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">
                      Questions (one per line) - {questions.split("\n").filter((q) => q.trim()).length} questions
                    </Label>
                    <Textarea
                      placeholder="What is the grace period for premium payment?&#10;Does this policy cover maternity expenses?&#10;What is the waiting period for pre-existing diseases?&#10;Are there any sub-limits on room rent?&#10;What are the exclusions mentioned in the policy?"
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                      rows={8}
                      className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <div className="text-xs text-gray-500">
                      Ask specific questions about policy terms, coverage, exclusions, procedures, or any document content
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Switch id="advanced-mode" checked={advancedMode} onCheckedChange={setAdvancedMode} />
                      <Label htmlFor="advanced-mode" className="text-sm">
                        Advanced Analysis
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="real-time-mode" checked={realTimeMode} onCheckedChange={setRealTimeMode} />
                      <Label htmlFor="real-time-mode" className="text-sm">
                        Real-time Updates
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="batch-mode" checked={batchMode} onCheckedChange={setBatchMode} />
                      <Label htmlFor="batch-mode" className="text-sm">
                        Batch Processing
                      </Label>
                    </div>
                  </div>

                  {/* Processing Progress */}
                  {loading && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-blue-700">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          {realtimeStatus.currentStage || "Processing documents and analyzing queries..."}
                        </span>
                        <span className="font-medium text-blue-700">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-blue-100" />
                      <div className="text-xs text-blue-600">
                        {progress < 15 && "Parsing documents and extracting content..."}
                        {progress >= 15 && progress < 30 && "Generating embeddings and semantic analysis..."}
                        {progress >= 30 && progress < 60 && "Performing vector search and context matching..."}
                        {progress >= 60 && progress < 85 && "AI reasoning and answer generation..."}
                        {progress >= 85 && "Finalizing results and generating insights..."}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || (uploadedDocuments.filter((doc) => doc.status === "completed").length === 0 && !documentUrl.trim())}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing Documents...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze Documents ({questions.split("\n").filter((q) => q.trim()).length} questions)
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <div className="space-y-6">
              {/* Enhanced Statistics */}
              {stats && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <TrendingUp className="h-5 w-5" />
                      Analysis Performance & Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="text-2xl font-bold text-blue-600 mb-1">{stats.total_questions}</div>
                        <div className="text-xs text-gray-600">Questions</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="text-2xl font-bold text-green-600 mb-1">{stats.documents_processed}</div>
                        <div className="text-xs text-gray-600">Documents</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {stats.avg_processing_time.toFixed(1)}s
                        </div>
                        <div className="text-xs text-gray-600">Avg Time</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <div className="text-2xl font-bold text-orange-600 mb-1">
                          {(stats.success_rate * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Success Rate</div>
                      </div>
                      <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                        <div className="text-2xl font-bold text-indigo-600 mb-1">
                          {stats.total_tokens_used.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Tokens</div>
                      </div>
                      <div className="text-center p-4 bg-pink-50 rounded-xl border border-pink-200">
                        <div className="text-2xl font-bold text-pink-600 mb-1">${stats.cost_estimate.toFixed(3)}</div>
                        <div className="text-xs text-gray-600">Cost</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Average Confidence: {(stats.avg_confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Results Display */}
              {results.map((result, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg text-gray-900 flex-1 pr-4">{result.question}</CardTitle>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={`${getConfidenceColor(result.confidence)} text-white border-0`}>
                          {(result.confidence * 100).toFixed(1)}% confidence
                        </Badge>
                        <Badge variant="outline" className="border-gray-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {result.processing_time.toFixed(2)}s
                        </Badge>
                        {result.compliance_status && (
                          <Badge className={`${getComplianceStatusColor(result.compliance_status)} border`}>
                            {result.compliance_status.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Answer Section */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Brain className="h-4 w-4 text-blue-600" />
                          AI-Generated Answer
                        </h4>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(result.answer)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-gray-800 leading-relaxed">{result.answer}</p>
                      </div>
                    </div>

                    {/* Key Insights */}
                    {result.key_insights && result.key_insights.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          Key Insights
                        </h4>
                        <div className="space-y-2">
                          {result.key_insights.map((insight, idx) => (
                            <div key={idx} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                              <p className="text-sm text-gray-700 flex items-start gap-2">
                                <Star className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                {insight}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk Assessment */}
                    {result.risk_assessment && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          Risk Assessment
                        </h4>
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-gray-700 text-sm leading-relaxed">{result.risk_assessment}</p>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {result.recommendations && result.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          Recommendations
                        </h4>
                        <div className="space-y-2">
                          {result.recommendations.slice(0, 4).map((rec, idx) => (
                            <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-sm text-gray-700 flex items-start gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                {rec}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Items */}
                    {result.action_items && result.action_items.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-purple-600" />
                          Action Items
                        </h4>
                        <div className="space-y-2">
                          {result.action_items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <p className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                {item}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reasoning Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Search className="h-4 w-4 text-purple-600" />
                        AI Reasoning & Analysis
                      </h4>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-gray-700 text-sm leading-relaxed">{result.reasoning}</p>
                      </div>
                    </div>

                    {/* Decision Rationale */}
                    {result.decision_rationale && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Decision Rationale
                        </h4>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-gray-700 text-sm leading-relaxed">{result.decision_rationale}</p>
                        </div>
                      </div>
                    )}

                    {/* Relevant Clauses */}
                    {result.relevant_clauses && result.relevant_clauses.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-indigo-600" />
                          Relevant Clauses & Citations
                        </h4>
                        <div className="space-y-2">
                          {result.relevant_clauses.map((clause, idx) => (
                            <div key={idx} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                              <p className="text-sm text-gray-700">{clause}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources Section */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4 text-orange-600" />
                        Sources & References
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.sources.map((source, idx) => (
                          <Badge key={idx} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            {documentAnalysis ? (
              <div className="space-y-6">
                {/* Document Summary */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg border-b">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <FileText className="h-5 w-5" />
                      Document Analysis Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed mb-4">{documentAnalysis.summary}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">{documentAnalysis.word_count.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Words</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">{documentAnalysis.page_count}</div>
                        <div className="text-xs text-gray-600">Pages</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                          {(documentAnalysis.readability_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Readability</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-xl font-bold text-orange-600">
                          {(documentAnalysis.complexity_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Complexity</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Topics */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Lightbulb className="h-5 w-5" />
                      Key Topics & Themes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {documentAnalysis.key_topics.map((topic, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Extracted Entities */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Target className="h-5 w-5" />
                      Extracted Entities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(documentAnalysis.entities).map(([category, items]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-gray-900 capitalize">{category.replace("_", " ")}</h4>
                          <div className="space-y-1">
                            {items.map((item, idx) => (
                              <div key={idx} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Analysis Available</h3>
                  <p className="text-gray-500 mb-4">Upload and process documents to see detailed insights and analysis.</p>
                  <Button onClick={() => setActiveTab("upload")} className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="realtime">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Real-time Monitor */}
              <RealtimeMonitor
                isActive={realtimeStatus.isActive}
                onStatusChange={(status) => {
                  console.log('Status changed:', status)
                }}
              />

              {/* System Status */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Vector DB</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500">Operational</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">LLM Service</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500">Online</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Database</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-500">Connected</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cache</span>
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <p className="text-xs text-gray-500">Degraded</p>
                    </div>
                  </div>

                  {/* Current Processing Status */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Current Processing</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Stage: {realtimeStatus.currentStage || 'Idle'}</span>
                        <span>Progress: {realtimeStatus.progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={realtimeStatus.progress} className="h-2" />
                      <p className="text-xs text-blue-700">
                        Insights Generated: {realtimeStatus.insights}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <ReportGenerator
              analysisResults={results}
              statistics={stats}
              documentInfo={documentAnalysis}
              onReportGenerated={(url) => {
                addNotification({
                  id: Date.now(),
                  type: 'success',
                  title: 'Report Generated',
                  message: 'Your analysis report has been generated and downloaded',
                  timestamp: new Date().toISOString()
                })
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
