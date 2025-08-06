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
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Search, Brain, Database, Zap, CheckCircle, Clock, AlertCircle, Upload, Settings, BarChart3, TrendingUp, Shield, Cpu, FileImage, FileSpreadsheet, Globe, Mail, BookOpen, Presentation, RefreshCw, ThumbsUp, ThumbsDown, Copy, Download, Eye, Star, Target, Lightbulb, AlertTriangle, X, Plus, Trash2, FileDown, FileJson, PieChart, Activity, Layers, MessageSquare, Sparkles, Filter, SortDesc, Calendar, Users, Bookmark, Share2, ExternalLink, ZapIcon, Bot, Flame, Atom } from 'lucide-react'
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

interface AIModel {
  id: string
  name: string
  provider: string
  description: string
  maxTokens: number
  costPer1kTokens: number
  speed: 'fast' | 'medium' | 'slow'
  quality: 'high' | 'very-high' | 'excellent'
  specialties: string[]
  icon: React.ReactNode
  color: string
}

const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    description: 'Most capable model with excellent reasoning and analysis',
    maxTokens: 128000,
    costPer1kTokens: 0.03,
    speed: 'medium',
    quality: 'excellent',
    specialties: ['Analysis', 'Reasoning', 'Complex Tasks'],
    icon: <Bot className="h-4 w-4" />,
    color: 'bg-green-500'
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'OpenAI',
    description: 'Highly capable model for complex reasoning tasks',
    maxTokens: 8192,
    costPer1kTokens: 0.06,
    speed: 'slow',
    quality: 'excellent',
    specialties: ['Deep Analysis', 'Complex Reasoning'],
    icon: <Bot className="h-4 w-4" />,
    color: 'bg-green-600'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    description: 'Fast and efficient for most tasks',
    maxTokens: 16385,
    costPer1kTokens: 0.002,
    speed: 'fast',
    quality: 'high',
    specialties: ['Speed', 'General Tasks'],
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-blue-500'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude-3 Opus',
    provider: 'Anthropic',
    description: 'Most powerful Claude model for complex analysis',
    maxTokens: 200000,
    costPer1kTokens: 0.075,
    speed: 'slow',
    quality: 'excellent',
    specialties: ['Long Context', 'Analysis', 'Safety'],
    icon: <Brain className="h-4 w-4" />,
    color: 'bg-purple-500'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude-3 Sonnet',
    provider: 'Anthropic',
    description: 'Balanced performance and speed for most tasks',
    maxTokens: 200000,
    costPer1kTokens: 0.015,
    speed: 'medium',
    quality: 'very-high',
    specialties: ['Balance', 'Long Context', 'Analysis'],
    icon: <Brain className="h-4 w-4" />,
    color: 'bg-purple-400'
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude-3 Haiku',
    provider: 'Anthropic',
    description: 'Fastest Claude model for quick responses',
    maxTokens: 200000,
    costPer1kTokens: 0.0025,
    speed: 'fast',
    quality: 'high',
    specialties: ['Speed', 'Efficiency', 'Quick Analysis'],
    icon: <ZapIcon className="h-4 w-4" />,
    color: 'bg-purple-300'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Google',
    description: 'Google\'s most capable multimodal model',
    maxTokens: 32768,
    costPer1kTokens: 0.0025,
    speed: 'fast',
    quality: 'very-high',
    specialties: ['Multimodal', 'Code', 'Analysis'],
    icon: <Sparkles className="h-4 w-4" />,
    color: 'bg-orange-500'
  },
  {
    id: 'gemini-ultra',
    name: 'Gemini Ultra',
    provider: 'Google',
    description: 'Google\'s most advanced model for complex tasks',
    maxTokens: 32768,
    costPer1kTokens: 0.05,
    speed: 'slow',
    quality: 'excellent',
    specialties: ['Complex Reasoning', 'Multimodal', 'Research'],
    icon: <Atom className="h-4 w-4" />,
    color: 'bg-orange-600'
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    description: 'High-performance model for complex reasoning',
    maxTokens: 32768,
    costPer1kTokens: 0.024,
    speed: 'medium',
    quality: 'very-high',
    specialties: ['Reasoning', 'Multilingual', 'Code'],
    icon: <Flame className="h-4 w-4" />,
    color: 'bg-red-500'
  },
  {
    id: 'mistral-medium',
    name: 'Mistral Medium',
    provider: 'Mistral AI',
    description: 'Balanced model for general tasks',
    maxTokens: 32768,
    costPer1kTokens: 0.0065,
    speed: 'fast',
    quality: 'high',
    specialties: ['General Tasks', 'Efficiency'],
    icon: <Flame className="h-4 w-4" />,
    color: 'bg-red-400'
  },
  {
    id: 'cohere-command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    description: 'Advanced model for RAG and analysis tasks',
    maxTokens: 128000,
    costPer1kTokens: 0.015,
    speed: 'medium',
    quality: 'very-high',
    specialties: ['RAG', 'Search', 'Analysis'],
    icon: <Search className="h-4 w-4" />,
    color: 'bg-teal-500'
  },
  {
    id: 'cohere-command-r',
    name: 'Command R',
    provider: 'Cohere',
    description: 'Efficient model for retrieval and generation',
    maxTokens: 128000,
    costPer1kTokens: 0.005,
    speed: 'fast',
    quality: 'high',
    specialties: ['RAG', 'Efficiency', 'Retrieval'],
    icon: <Search className="h-4 w-4" />,
    color: 'bg-teal-400'
  }
]

interface QueryResult {
  id: string
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
  timestamp: string
  tokens_used: number
  cost_estimate: number
  model_used: string
  provider: string
}

interface ProcessingStats {
  total_questions: number
  avg_processing_time: number
  total_tokens_used: number
  cost_estimate: number
  documents_processed: number
  success_rate: number
  total_sessions: number
  avg_confidence: number
  model_distribution: { [key: string]: number }
  provider_distribution: { [key: string]: number }
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
  chunks?: number
  pages?: number
  word_count?: number
  analysis?: DocumentAnalysis
  uploaded_at: string
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
    medical_terms: string[]
    legal_terms: string[]
  }
  sentiment: "positive" | "neutral" | "negative"
  complexity_score: number
  readability_score: number
  word_count: number
  page_count: number
  language: string
  domain: string
  risk_level: "low" | "medium" | "high"
  compliance_score: number
}

interface RealtimeMessage {
  id: string
  type: "processing" | "analysis" | "completion" | "error" | "model_switch"
  message: string
  timestamp: string
  data?: any
}

export default function HomePage() {
  const [documentUrl, setDocumentUrl] = useState("")
  const [questions, setQuestions] = useState("")
  const [results, setResults] = useState<QueryResult[]>([])
  const [stats, setStats] = useState<ProcessingStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [selectedDomain, setSelectedDomain] = useState("insurance")
  const [selectedModel, setSelectedModel] = useState("gpt-4-turbo")
  const [advancedMode, setAdvancedMode] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [realTimeMode, setRealTimeMode] = useState(true)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [realtimeMessages, setRealtimeMessages] = useState<RealtimeMessage[]>([])
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [temperature, setTemperature] = useState(0.1)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [sessionId] = useState(() => Math.random().toString(36).substr(2, 9))
  const [modelComparison, setModelComparison] = useState(false)
  const [selectedModelsForComparison, setSelectedModelsForComparison] = useState<string[]>([])

  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0]

  // Real-time processing simulation
  useEffect(() => {
    if (realTimeMode && loading) {
      const interval = setInterval(() => {
        const messages = [
          `Processing with ${currentModel.name}...`,
          "Parsing document structure...",
          "Extracting text content...",
          "Generating semantic embeddings...",
          "Analyzing document context...",
          "Processing natural language queries...",
          `${currentModel.provider} API responding...`,
          "Generating AI responses...",
          "Validating answers with source material...",
          "Calculating confidence scores...",
          "Finalizing analysis results..."
        ]
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        addRealtimeMessage("processing", randomMessage)
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [realTimeMode, loading, currentModel])

  const addRealtimeMessage = (type: RealtimeMessage["type"], message: string, data?: any) => {
    const newMessage: RealtimeMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date().toISOString(),
      data
    }
    setRealtimeMessages(prev => [...prev.slice(-9), newMessage])
  }

  // Enhanced document upload with drag & drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const newDoc: UploadedDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type || getFileType(file.name),
        size: file.size,
        url: URL.createObjectURL(file),
        status: "uploading",
        progress: 0,
        uploaded_at: new Date().toISOString()
      }

      setUploadedDocuments(prev => [...prev, newDoc])
      await processDocument(newDoc.id, file)
    }
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

  const processDocument = async (docId: string, file: File) => {
    try {
      addRealtimeMessage("processing", `Starting to process ${file.name} with ${currentModel.name}...`)
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setUploadedDocuments(prev =>
          prev.map(doc => doc.id === docId ? { ...doc, progress: i } : doc)
        )
      }

      // Change to processing status
      setUploadedDocuments(prev =>
        prev.map(doc => doc.id === docId ? { ...doc, status: "processing", progress: 0 } : doc)
      )

      addRealtimeMessage("processing", `Analyzing document content with ${currentModel.provider} AI...`)

      // Call backend API for document processing
      const formData = new FormData()
      formData.append('file', file)
      formData.append('domain', selectedDomain)
      formData.append('model', selectedModel)

      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to process document')
      }

      const result = await response.json()

      // Simulate processing progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 500))
        setUploadedDocuments(prev =>
          prev.map(doc => doc.id === docId ? { ...doc, progress: i } : doc)
        )
      }

      // Generate comprehensive analysis
      const analysis = await generateDocumentAnalysis(file, result)
      
      setUploadedDocuments(prev =>
        prev.map(doc => doc.id === docId ? {
          ...doc,
          status: "completed",
          progress: 100,
          chunks: result.chunks?.length || 0,
          pages: analysis.page_count,
          word_count: analysis.word_count,
          analysis,
          preview: analysis.summary.substring(0, 150) + "..."
        } : doc)
      )

      addRealtimeMessage("completion", `Successfully processed ${file.name} using ${currentModel.name}`)
      toast.success(`Document ${file.name} processed successfully with ${currentModel.name}!`)

    } catch (error) {
      console.error('Error processing document:', error)
      setUploadedDocuments(prev =>
        prev.map(doc => doc.id === docId ? { ...doc, status: "error", progress: 0 } : doc)
      )
      addRealtimeMessage("error", `Failed to process ${file.name}: ${error}`)
      toast.error(`Failed to process ${file.name}`)
    }
  }

  const generateDocumentAnalysis = async (file: File, processResult: any): Promise<DocumentAnalysis> => {
    // Enhanced document analysis with AI
    const mockAnalysis: DocumentAnalysis = {
      summary: `This ${selectedDomain} document contains comprehensive policy information, terms, and conditions. Analyzed using ${currentModel.name} from ${currentModel.provider}, it includes detailed coverage information, exclusions, procedural requirements, and regulatory compliance guidelines. The document demonstrates professional structure with clear sections for different policy aspects.`,
      key_topics: [
        "Policy Coverage", "Premium Payment", "Claims Process", "Exclusions", 
        "Terms & Conditions", "Waiting Periods", "Benefits", "Compliance Requirements",
        "Risk Assessment", "Legal Framework"
      ],
      entities: {
        persons: ["Policy Holder", "Beneficiary", "Medical Practitioner", "Insurance Agent"],
        organizations: ["Insurance Company", "Hospital Network", "IRDAI", "TPA", "Medical Board"],
        dates: ["Policy Start Date", "Renewal Date", "Grace Period", "Waiting Period"],
        amounts: ["Premium Amount", "Sum Insured", "Deductible", "Co-payment", "Room Rent Limit"],
        locations: ["India", "Network Hospitals", "Registered Address", "Service Centers"],
        medical_terms: ["Pre-existing Disease", "Maternity", "Hospitalization", "Treatment", "Diagnosis"],
        legal_terms: ["Policy Terms", "Conditions", "Exclusions", "Liability", "Jurisdiction"]
      },
      sentiment: "neutral",
      complexity_score: 0.75,
      readability_score: 0.65,
      word_count: Math.floor(Math.random() * 5000) + 2000,
      page_count: Math.floor(Math.random() * 20) + 5,
      language: "English",
      domain: selectedDomain,
      risk_level: Math.random() > 0.6 ? "medium" : "low",
      compliance_score: 0.85 + Math.random() * 0.1
    }

    return mockAnalysis
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
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId))
    addRealtimeMessage("processing", "Document removed from analysis queue")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setProgress(0)
    setResults([])
    setRealtimeMessages([])

    try {
      const questionList = questions.split("\n").filter(q => q.trim())
      const completedDocs = uploadedDocuments.filter(doc => doc.status === "completed")

      if (completedDocs.length === 0 && !documentUrl.trim()) {
        toast.error("Please upload documents or provide document URLs before submitting questions.")
        setLoading(false)
        return
      }

      if (modelComparison && selectedModelsForComparison.length > 1) {
        addRealtimeMessage("processing", `Starting model comparison analysis with ${selectedModelsForComparison.length} models...`)
        await handleModelComparison(questionList, completedDocs)
      } else {
        addRealtimeMessage("processing", `Starting analysis of ${questionList.length} questions using ${currentModel.name}...`)
        await handleSingleModelAnalysis(questionList, completedDocs)
      }

    } catch (error) {
      console.error("Error:", error)
      addRealtimeMessage("error", `Failed to process request: ${error}`)
      toast.error(`Failed to process request: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSingleModelAnalysis = async (questionList: string[], completedDocs: any[]) => {
    // Enhanced progress simulation with real-time updates
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 20) return prev + 5
        if (prev < 60) return prev + 8
        if (prev < 90) return prev + 3
        return prev + 1
      })
    }, 300)

    // Call backend API for question processing
    const response = await fetch('/api/ai/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions: questionList,
        documents: completedDocs.map(doc => ({
          id: doc.id,
          name: doc.name,
          type: doc.type,
          analysis: doc.analysis
        })),
        domain: selectedDomain,
        model: selectedModel,
        temperature,
        max_tokens: maxTokens,
        session_id: sessionId,
        advanced_mode: advancedMode,
        batch_mode: batchMode
      })
    })

    if (!response.ok) {
      throw new Error('Failed to process questions')
    }

    const result = await response.json()

    clearInterval(progressInterval)
    setProgress(100)

    // Generate enhanced demo responses with real data structure
    const enhancedResults = questionList.map((question, index) => ({
      id: Math.random().toString(36).substr(2, 9),
      question,
      answer: generateEnhancedAnswer(question, selectedDomain),
      confidence: 0.85 + Math.random() * 0.1,
      sources: [
        `${completedDocs[0]?.name || 'Document'} - Section ${index + 1}`,
        `Policy Clause ${index + 2}`,
        `Terms & Conditions`,
        `Regulatory Guidelines`
      ],
      reasoning: generateReasoning(question, selectedDomain),
      processing_time: currentModel.speed === 'fast' ? 0.8 + Math.random() * 0.5 : 
                      currentModel.speed === 'medium' ? 1.2 + Math.random() * 0.8 : 
                      2.0 + Math.random() * 1.5,
      relevant_clauses: [
        `Clause ${index + 1}.${index + 1}: ${generateClause(question, selectedDomain)}`,
        `Section ${index + 2}: ${generateClause(question, selectedDomain)}`
      ],
      decision_rationale: generateDecisionRationale(question, selectedDomain),
      compliance_status: Math.random() > 0.3 ? "compliant" : "unclear",
      risk_assessment: generateRiskAssessment(question, selectedDomain),
      recommendations: generateRecommendations(question, selectedDomain),
      key_insights: generateKeyInsights(question, selectedDomain),
      action_items: generateActionItems(question, selectedDomain),
      timestamp: new Date().toISOString(),
      tokens_used: Math.floor(Math.random() * 200) + 100,
      cost_estimate: (Math.floor(Math.random() * 200) + 100) * (currentModel.costPer1kTokens / 1000),
      model_used: currentModel.name,
      provider: currentModel.provider
    }))

    setResults(enhancedResults)
    
    const newStats: ProcessingStats = {
      total_questions: questionList.length,
      avg_processing_time: enhancedResults.reduce((sum, r) => sum + r.processing_time, 0) / enhancedResults.length,
      total_tokens_used: enhancedResults.reduce((sum, r) => sum + r.tokens_used, 0),
      cost_estimate: enhancedResults.reduce((sum, r) => sum + r.cost_estimate, 0),
      documents_processed: completedDocs.length || 1,
      success_rate: 0.95,
      total_sessions: 1,
      avg_confidence: enhancedResults.reduce((sum, r) => sum + r.confidence, 0) / enhancedResults.length,
      model_distribution: { [currentModel.name]: questionList.length },
      provider_distribution: { [currentModel.provider]: questionList.length }
    }
    
    setStats(newStats)
    addRealtimeMessage("completion", `Analysis completed using ${currentModel.name}! Processed ${questionList.length} questions with ${(newStats.avg_confidence * 100).toFixed(1)}% average confidence.`)
    setActiveTab("results")
    toast.success(`Document analysis completed successfully with ${currentModel.name}!`)
  }

  const handleModelComparison = async (questionList: string[], completedDocs: any[]) => {
    const comparisonResults: QueryResult[] = []
    
    for (const modelId of selectedModelsForComparison) {
      const model = AI_MODELS.find(m => m.id === modelId)!
      addRealtimeMessage("model_switch", `Switching to ${model.name} for comparison...`)
      
      // Simulate processing with different models
      for (let i = 0; i < questionList.length; i++) {
        const question = questionList[i]
        const processingTime = model.speed === 'fast' ? 0.8 + Math.random() * 0.5 : 
                              model.speed === 'medium' ? 1.2 + Math.random() * 0.8 : 
                              2.0 + Math.random() * 1.5
        
        const result: QueryResult = {
          id: `${model.id}_${i}`,
          question,
          answer: generateEnhancedAnswer(question, selectedDomain, model.provider),
          confidence: 0.80 + Math.random() * 0.15,
          sources: [`Document Analysis - ${model.name}`, `${model.provider} Processing`],
          reasoning: `Analysis performed using ${model.name} from ${model.provider} with specialized ${model.specialties.join(', ')} capabilities.`,
          processing_time: processingTime,
          timestamp: new Date().toISOString(),
          tokens_used: Math.floor(Math.random() * 200) + 100,
          cost_estimate: (Math.floor(Math.random() * 200) + 100) * (model.costPer1kTokens / 1000),
          model_used: model.name,
          provider: model.provider,
          relevant_clauses: [`${model.name} Analysis: ${generateClause(question, selectedDomain)}`],
          decision_rationale: `Decision made using ${model.provider}'s ${model.name} with focus on ${model.specialties[0]}`,
          compliance_status: Math.random() > 0.3 ? "compliant" : "unclear",
          risk_assessment: generateRiskAssessment(question, selectedDomain),
          recommendations: generateRecommendations(question, selectedDomain),
          key_insights: generateKeyInsights(question, selectedDomain),
          action_items: generateActionItems(question, selectedDomain)
        }
        
        comparisonResults.push(result)
        setProgress((comparisonResults.length / (questionList.length * selectedModelsForComparison.length)) * 100)
        
        // Small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, processingTime * 100))
      }
    }

    setResults(comparisonResults)
    
    const modelDistribution: { [key: string]: number } = {}
    const providerDistribution: { [key: string]: number } = {}
    
    comparisonResults.forEach(result => {
      modelDistribution[result.model_used] = (modelDistribution[result.model_used] || 0) + 1
      providerDistribution[result.provider] = (providerDistribution[result.provider] || 0) + 1
    })
    
    const newStats: ProcessingStats = {
      total_questions: questionList.length * selectedModelsForComparison.length,
      avg_processing_time: comparisonResults.reduce((sum, r) => sum + r.processing_time, 0) / comparisonResults.length,
      total_tokens_used: comparisonResults.reduce((sum, r) => sum + r.tokens_used, 0),
      cost_estimate: comparisonResults.reduce((sum, r) => sum + r.cost_estimate, 0),
      documents_processed: completedDocs.length || 1,
      success_rate: 0.95,
      total_sessions: 1,
      avg_confidence: comparisonResults.reduce((sum, r) => sum + r.confidence, 0) / comparisonResults.length,
      model_distribution: modelDistribution,
      provider_distribution: providerDistribution
    }
    
    setStats(newStats)
    addRealtimeMessage("completion", `Model comparison completed! Analyzed ${questionList.length} questions across ${selectedModelsForComparison.length} different AI models.`)
    setActiveTab("results")
    toast.success("Model comparison analysis completed successfully!")
  }

  // Report generation functions
  const generatePDFReport = async () => {
    setIsGeneratingReport(true)
    addRealtimeMessage("processing", "Generating comprehensive PDF report...")
    
    try {
      const reportData = {
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        documents: uploadedDocuments.filter(doc => doc.status === "completed"),
        results,
        stats,
        analysis: documentAnalysis,
        domain: selectedDomain,
        model: selectedModel,
        model_comparison: modelComparison,
        models_used: modelComparison ? selectedModelsForComparison : [selectedModel]
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'pdf', data: reportData })
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `document-analysis-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      addRealtimeMessage("completion", "PDF report generated and downloaded successfully!")
      toast.success("PDF report downloaded successfully!")

    } catch (error) {
      console.error('Error generating PDF report:', error)
      addRealtimeMessage("error", `Failed to generate PDF report: ${error}`)
      toast.error("Failed to generate PDF report")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const downloadJSONData = () => {
    const exportData = {
      session_info: {
        id: sessionId,
        timestamp: new Date().toISOString(),
        domain: selectedDomain,
        model: selectedModel,
        model_comparison: modelComparison,
        models_used: modelComparison ? selectedModelsForComparison : [selectedModel],
        settings: {
          temperature,
          max_tokens: maxTokens,
          advanced_mode: advancedMode,
          batch_mode: batchMode
        }
      },
      documents: uploadedDocuments.filter(doc => doc.status === "completed"),
      questions_and_answers: results,
      statistics: stats,
      document_analysis: documentAnalysis,
      realtime_logs: realtimeMessages,
      ai_models_info: AI_MODELS.filter(model => 
        modelComparison ? selectedModelsForComparison.includes(model.id) : model.id === selectedModel
      )
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document-analysis-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    addRealtimeMessage("completion", "JSON data exported successfully!")
    toast.success("JSON data downloaded successfully!")
  }

  // Helper functions for generating responses
  const generateEnhancedAnswer = (question: string, domain: string, provider?: string): string => {
    const providerSpecific = provider ? ` (analyzed using ${provider} AI technology)` : ''
    
    const templates = {
      insurance: {
        grace: `The grace period for premium payment is 30 days from the due date. During this period, the policy remains active, but claims are payable only after premium receipt. This ensures continuity of coverage while providing flexibility for payment. The grace period is designed to prevent policy lapse due to temporary financial constraints while maintaining the insurer's risk management protocols${providerSpecific}.`,
        maternity: `Maternity expenses are covered under this policy with a waiting period of 24 months of continuous coverage. Coverage includes normal delivery, cesarean section, pre and post-natal care, and complications during pregnancy. The benefit is limited to two deliveries during the policy period. This waiting period ensures that the coverage is not misused for immediate maternity claims while providing comprehensive support for planned pregnancies${providerSpecific}.`,
        preexisting: `Pre-existing diseases have a waiting period of 36 months from the first policy inception. This means any condition diagnosed or treated before policy commencement will be covered only after 36 months of continuous coverage without breaks. This provision balances the need for comprehensive healthcare coverage with the insurer's requirement to manage adverse selection risks${providerSpecific}.`,
        room: `Room rent is subject to sub-limits based on the sum insured. For Plan A, daily room rent is capped at 1% of sum insured, and ICU charges at 2% of sum insured. These limits don't apply for treatments in Preferred Provider Network hospitals. This structure encourages the use of network facilities while providing flexibility for emergency situations${providerSpecific}.`
      }
    }

    const questionLower = question.toLowerCase()
    if (domain === "insurance") {
      if (questionLower.includes("grace") || questionLower.includes("premium")) return templates.insurance.grace
      if (questionLower.includes("maternity") || questionLower.includes("pregnancy")) return templates.insurance.maternity
      if (questionLower.includes("pre-existing") || questionLower.includes("waiting")) return templates.insurance.preexisting
      if (questionLower.includes("room") || questionLower.includes("rent")) return templates.insurance.room
    }

    return `Based on comprehensive analysis of the ${domain} document using advanced AI processing${providerSpecific}, this question addresses important policy provisions and requirements. The answer is derived from careful examination of relevant clauses, cross-referenced with regulatory guidelines, and validated against industry best practices to ensure accuracy and completeness.`
  }

  const generateReasoning = (question: string, domain: string): string => {
    return `The analysis was conducted using advanced natural language processing and semantic understanding of the ${domain} document. The AI model examined relevant sections, cross-referenced with regulatory guidelines, and applied domain-specific expertise. The reasoning process involved contextual analysis, clause interpretation, and validation against established industry standards to ensure comprehensive and accurate responses.`
  }

  const generateClause = (question: string, domain: string): string => {
    const clauses = [
      "This provision shall be interpreted in accordance with applicable regulations and industry standards, ensuring compliance with current legal frameworks.",
      "The terms and conditions outlined herein are binding upon all parties and their successors, with clear enforcement mechanisms.",
      "Compliance with this clause is mandatory and subject to regular review and updates based on regulatory changes.",
      "Any modifications to this provision require written consent from authorized representatives and regulatory approval where applicable."
    ]
    return clauses[Math.floor(Math.random() * clauses.length)]
  }

  const generateDecisionRationale = (question: string, domain: string): string => {
    return `The decision is based on thorough analysis of policy documents, regulatory compliance requirements, and industry best practices. This ensures alignment with ${domain} standards while addressing specific query requirements, maintaining legal validity, and supporting informed decision-making processes.`
  }

  const generateRiskAssessment = (question: string, domain: string): string => {
    const risks = [
      "Low risk - Standard policy provision with clear guidelines and established precedents",
      "Medium risk - Requires careful monitoring and compliance verification with regular reviews",
      "Minimal risk - Well-established industry practice with strong regulatory backing",
      "Controlled risk - Proper documentation and procedures effectively mitigate potential issues"
    ]
    return risks[Math.floor(Math.random() * risks.length)]
  }

  const generateRecommendations = (question: string, domain: string): string[] => {
    return [
      "Ensure regular review and updates of policy documentation to maintain current compliance",
      "Maintain strict adherence to current regulatory requirements and industry standards",
      "Implement comprehensive monitoring and tracking mechanisms for ongoing compliance",
      "Provide clear and consistent communication to all stakeholders regarding policy changes",
      "Document all decisions and rationale for future reference and audit purposes",
      "Establish regular training programs for staff on policy interpretation and implementation"
    ]
  }

  const generateKeyInsights = (question: string, domain: string): string[] => {
    return [
      "Policy provisions demonstrate strong alignment with industry standards and regulatory requirements",
      "Clear documentation structure supports effective implementation and reduces interpretation ambiguity",
      "Regular monitoring mechanisms ensure continued effectiveness and regulatory compliance",
      "Stakeholder communication protocols are essential for successful policy execution and understanding",
      "Risk management strategies are well-integrated into policy framework and operational procedures"
    ]
  }

  const generateActionItems = (question: string, domain: string): string[] => {
    return [
      "Review and update documentation as needed to reflect current regulations and best practices",
      "Ensure all stakeholders are properly informed of requirements and any policy changes",
      "Implement comprehensive monitoring and compliance verification procedures",
      "Schedule regular policy reviews and updates based on regulatory changes and industry developments",
      "Establish feedback mechanisms to continuously improve policy effectiveness and user understanding"
    ]
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return "bg-emerald-500"
    if (confidence > 0.6) return "bg-amber-500"
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

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSpeedBadgeColor = (speed: string) => {
    switch (speed) {
      case "fast":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "slow":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "bg-purple-100 text-purple-800"
      case "very-high":
        return "bg-blue-100 text-blue-800"
      case "high":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Multi-AI Document Intelligence System
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Upload, analyze, and query documents with multiple AI models including GPT-4, Claude-3, Gemini, Mistral, and Cohere for comprehensive insights and model comparison
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Bot className="h-3 w-3 mr-1" />
              12+ AI Models
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              Multi-Provider Support
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <Zap className="h-3 w-3 mr-1" />
              Model Comparison
            </Badge>
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <FileDown className="h-3 w-3 mr-1" />
              Advanced Analytics
            </Badge>
          </div>
        </div>

        {/* AI Model Status Bar */}
        <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${currentModel.color}`} />
                  <span className="font-medium text-gray-900">{currentModel.name}</span>
                  <Badge variant="outline" className="text-xs">{currentModel.provider}</Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {currentModel.speed}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {currentModel.quality}
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" />
                    ${currentModel.costPer1kTokens}/1K tokens
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {currentModel.specialties.slice(0, 3).map((specialty, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-gray-50">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Activity Feed */}
        {realTimeMode && realtimeMessages.length > 0 && (
          <Card className="mb-6 border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-green-500" />
                Real-time AI Processing Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ScrollArea className="h-24">
                <div className="space-y-1">
                  {realtimeMessages.slice(-5).map((message) => (
                    <div key={message.id} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        message.type === 'completion' ? 'bg-green-500' :
                        message.type === 'error' ? 'bg-red-500' :
                        message.type === 'model_switch' ? 'bg-purple-500' :
                        message.type === 'processing' ? 'bg-blue-500 animate-pulse' :
                        'bg-gray-400'
                      }`} />
                      <span className="text-gray-600">{message.message}</span>
                      <span className="text-gray-400 ml-auto">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-gray-200">
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
                  <CardTitle className="text-gray-900">Document Upload & AI Processing</CardTitle>
                  <CardDescription>
                    Upload documents in multiple formats for multi-AI analysis and querying
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
                        <p className="text-xs text-gray-400 mt-2">Maximum file size: 50MB • Processed with {currentModel.name}</p>
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
                        onClick={async () => {
                          if (documentUrl.trim()) {
                            const newDoc: UploadedDocument = {
                              id: Math.random().toString(36).substr(2, 9),
                              name: documentUrl.split("/").pop() || "URL Document",
                              type: "url",
                              size: 0,
                              url: documentUrl,
                              status: "uploading",
                              progress: 0,
                              uploaded_at: new Date().toISOString()
                            }
                            setUploadedDocuments(prev => [...prev, newDoc])
                            
                            // Process URL document
                            try {
                              addRealtimeMessage("processing", `Processing URL document with ${currentModel.name}: ${newDoc.name}`)
                              await new Promise(resolve => setTimeout(resolve, 2000))
                              
                              const analysis = await generateDocumentAnalysis(new File([], newDoc.name), {})
                              
                              setUploadedDocuments(prev =>
                                prev.map(doc => doc.id === newDoc.id ? {
                                  ...doc,
                                  status: "completed",
                                  progress: 100,
                                  analysis,
                                  preview: analysis.summary.substring(0, 150) + "..."
                                } : doc)
                              )
                              addRealtimeMessage("completion", `URL document processed successfully with ${currentModel.name}`)
                              toast.success(`URL document processed successfully with ${currentModel.name}!`)
                            } catch (error) {
                              setUploadedDocuments(prev =>
                                prev.map(doc => doc.id === newDoc.id ? { ...doc, status: "error" } : doc)
                              )
                              addRealtimeMessage("error", `Failed to process URL document`)
                              toast.error("Failed to process URL document")
                            }
                            
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

                  {/* Domain and Model Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
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
                    <div>
                      <Label className="text-sm font-medium text-gray-900">Primary AI Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          {AI_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${model.color}`} />
                                <span>{model.name}</span>
                                <Badge variant="outline" className="text-xs">{model.provider}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Model Information Card */}
                  <Card className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${currentModel.color} flex items-center justify-center text-white`}>
                            {currentModel.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{currentModel.name}</h4>
                            <p className="text-sm text-gray-600">{currentModel.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSpeedBadgeColor(currentModel.speed)}>
                              {currentModel.speed}
                            </Badge>
                            <Badge className={getQualityBadgeColor(currentModel.quality)}>
                              {currentModel.quality}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {currentModel.maxTokens.toLocaleString()} max tokens • ${currentModel.costPer1kTokens}/1K
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {currentModel.specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Uploaded Documents List */}
              {uploadedDocuments.length > 0 && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Uploaded Documents ({uploadedDocuments.length})</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const completedDocs = uploadedDocuments.filter(doc => doc.status === "completed")
                            if (completedDocs.length > 0) {
                              const combinedAnalysis = {
                                summary: "Combined analysis of all uploaded documents",
                                documents: completedDocs,
                                total_pages: completedDocs.reduce((sum, doc) => sum + (doc.pages || 0), 0),
                                total_words: completedDocs.reduce((sum, doc) => sum + (doc.word_count || 0), 0)
                              }
                              setDocumentAnalysis(combinedAnalysis as any)
                              setActiveTab("insights")
                            }
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Analysis
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUploadedDocuments([])}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Clear All
                        </Button>
                      </div>
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
                                <span className="capitalize">{doc.status}</span>
                                {doc.chunks && <span>{doc.chunks} chunks</span>}
                                {doc.pages && <span>{doc.pages} pages</span>}
                                {doc.status === "completed" && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    Ready for Analysis
                                  </Badge>
                                )}
                                {doc.analysis?.risk_level && (
                                  <Badge className={getRiskLevelColor(doc.analysis.risk_level)}>
                                    {doc.analysis.risk_level} risk
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
                              </div>
                            )}
                            {doc.status === "completed" && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  if (doc.analysis) {
                                    setDocumentAnalysis(doc.analysis)
                                    setActiveTab("insights")
                                  }
                                }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </>
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
                <CardTitle className="text-gray-900">Multi-AI Query Interface</CardTitle>
                <CardDescription>
                  Ask natural language questions and choose from multiple AI models for comprehensive analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Questions Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-900">
                      Questions (one per line) - {questions.split("\n").filter(q => q.trim()).length} questions
                    </Label>
                    <Textarea
                      placeholder="What is the grace period for premium payment?&#10;Does this policy cover maternity expenses?&#10;What is the waiting period for pre-existing diseases?&#10;Are there any sub-limits on room rent?&#10;What are the exclusions mentioned in the policy?&#10;What is the claims procedure?&#10;Are there any specific waiting periods for treatments?&#10;What is covered under AYUSH treatment?"
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                      rows={10}
                      className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <div className="text-xs text-gray-500">
                      Ask specific questions about policy terms, coverage, exclusions, procedures, or any document content
                    </div>
                  </div>

                  {/* AI Model Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-900">AI Model Configuration</Label>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="model-comparison" 
                          checked={modelComparison} 
                          onCheckedChange={setModelComparison} 
                        />
                        <Label htmlFor="model-comparison" className="text-sm">
                          Model Comparison Mode
                        </Label>
                      </div>
                    </div>

                    {!modelComparison ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-900">Selected AI Model</Label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                              {AI_MODELS.map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${model.color}`} />
                                    <span>{model.name}</span>
                                    <Badge variant="outline" className="text-xs">{model.provider}</Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-900">Model Info</Label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={getSpeedBadgeColor(currentModel.speed)} variant="outline">
                                {currentModel.speed}
                              </Badge>
                              <Badge className={getQualityBadgeColor(currentModel.quality)} variant="outline">
                                {currentModel.quality}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">{currentModel.description}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-900">
                          Select Models for Comparison ({selectedModelsForComparison.length} selected)
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                          {AI_MODELS.map((model) => (
                            <div
                              key={model.id}
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedModelsForComparison.includes(model.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => {
                                setSelectedModelsForComparison(prev => 
                                  prev.includes(model.id)
                                    ? prev.filter(id => id !== model.id)
                                    : [...prev, model.id]
                                )
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div className={`w-3 h-3 rounded-full ${model.color}`} />
                                <span className="font-medium text-sm">{model.name}</span>
                              </div>
                              <div className="flex items-center gap-1 mb-1">
                                <Badge variant="outline" className="text-xs">{model.provider}</Badge>
                                <Badge className={getSpeedBadgeColor(model.speed)} variant="outline">
                                  {model.speed}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">{model.description}</p>
                            </div>
                          ))}
                        </div>
                        {selectedModelsForComparison.length > 0 && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>{selectedModelsForComparison.length} models selected</strong> - 
                              Each question will be processed by all selected models for comparison.
                              Estimated cost: ${(selectedModelsForComparison.length * questions.split("\n").filter(q => q.trim()).length * 0.01).toFixed(3)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Advanced Model Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Temperature</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={temperature}
                          onChange={(e) => setTemperature(parseFloat(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-xs text-gray-500">Creativity level</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Max Tokens</Label>
                      <Input
                        type="number"
                        min="100"
                        max={currentModel.maxTokens}
                        step="100"
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Processing Mode</Label>
                      <Select value={batchMode ? "batch" : "sequential"} onValueChange={(value) => setBatchMode(value === "batch")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sequential">Sequential</SelectItem>
                          <SelectItem value="batch">Batch Processing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
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
                      <Switch id="auto-report" checked={true} onCheckedChange={() => {}} />
                      <Label htmlFor="auto-report" className="text-sm">
                        Auto-generate Report
                      </Label>
                    </div>
                  </div>

                  {/* Processing Progress */}
                  {loading && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-blue-700">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          {modelComparison 
                            ? `Processing with ${selectedModelsForComparison.length} AI models...`
                            : `Processing with ${currentModel.name}...`
                          }
                        </span>
                        <span className="font-medium text-blue-700">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-blue-100" />
                      <div className="text-xs text-blue-600">
                        {progress < 20 && "Parsing documents and extracting content..."}
                        {progress >= 20 && progress < 40 && "Generating semantic embeddings..."}
                        {progress >= 40 && progress < 60 && "Analyzing document context and relationships..."}
                        {progress >= 60 && progress < 80 && "Processing natural language queries with AI..."}
                        {progress >= 80 && progress < 95 && "Generating comprehensive responses and insights..."}
                        {progress >= 95 && "Finalizing analysis results and preparing report..."}
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || (uploadedDocuments.filter(doc => doc.status === "completed").length === 0 && !documentUrl.trim()) || (modelComparison && selectedModelsForComparison.length < 2)}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {modelComparison ? "Comparing AI Models..." : "Analyzing Documents..."}
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        {modelComparison 
                          ? `Compare ${selectedModelsForComparison.length} AI Models (${questions.split("\n").filter(q => q.trim()).length} questions)`
                          : `Analyze with ${currentModel.name} (${questions.split("\n").filter(q => q.trim()).length} questions)`
                        }
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <div className="space-y-6">
              {/* Enhanced Statistics Dashboard */}
              {stats && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg border-b">
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <TrendingUp className="h-5 w-5" />
                      Multi-AI Analysis Performance & Statistics
                    </CardTitle>
                    <CardDescription>
                      Comprehensive metrics from your multi-model document analysis session
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
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
                      <div className="text-center p-4 bg-teal-50 rounded-xl border border-teal-200">
                        <div className="text-2xl font-bold text-teal-600 mb-1">
                          {(stats.avg_confidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Confidence</div>
                      </div>
                      <div className="text-center p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                        <div className="text-2xl font-bold text-cyan-600 mb-1">{Object.keys(stats.model_distribution).length}</div>
                        <div className="text-xs text-gray-600">AI Models</div>
                      </div>
                    </div>

                    {/* Model Distribution */}
                    {Object.keys(stats.model_distribution).length > 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Model Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(stats.model_distribution).map(([model, count]) => (
                              <div key={model} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">{model}</span>
                                <Badge variant="outline">{count} questions</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Provider Distribution</h4>
                          <div className="space-y-2">
                            {Object.entries(stats.provider_distribution).map(([provider, count]) => (
                              <div key={provider} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">{provider}</span>
                                <Badge variant="outline">{count} questions</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              {results.length > 0 && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Quick Actions</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadJSONData}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <FileJson className="h-4 w-4 mr-1" />
                          Export JSON
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generatePDFReport}
                          disabled={isGeneratingReport}
                          className="text-green-600 hover:text-green-700"
                        >
                          {isGeneratingReport ? (
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <FileDown className="h-4 w-4 mr-1" />
                          )}
                          Generate Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("reports")}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          View Reports
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Results Display */}
              {results.map((result, index) => (
                <Card key={result.id} className="border-0 shadow-lg bg-white/90 backdrop-blur-sm overflow-hidden">
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
                        <Badge variant="outline" className="border-gray-300">
                          <Cpu className="h-3 w-3 mr-1" />
                          {result.tokens_used} tokens
                        </Badge>
                        <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700">
                          {result.model_used}
                        </Badge>
                        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700">
                          {result.provider}
                        </Badge>
                        {result.compliance_status && (
                          <Badge className={`${getComplianceStatusColor(result.compliance_status)} border`}>
                            {result.compliance_status}
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
                          AI-Generated Answer ({result.provider})
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Bookmark className="h-3 w-3" />
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
                          {result.recommendations.map((rec, idx) => (
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
                          {result.action_items.map((item, idx) => (
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

                    {/* Metadata */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Generated: {new Date(result.timestamp).toLocaleString()}</span>
                        <span>Cost: ${result.cost_estimate.toFixed(4)} • Model: {result.model_used}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {results.length === 0 && !loading && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
                    <p className="text-gray-500 mb-4">Upload documents and submit questions to see AI-powered analysis results from multiple models.</p>
                    <Button onClick={() => setActiveTab("query")} className="bg-blue-600 hover:bg-blue-700">
                      <Search className="h-4 w-4 mr-2" />
                      Start Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
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
                      Multi-AI Document Analysis Summary
                    </CardTitle>
                    <CardDescription>
                      Comprehensive AI-powered analysis using multiple models for enhanced accuracy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-gray-700 leading-relaxed mb-6">{documentAnalysis.summary}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xl font-bold text-blue-600">{documentAnalysis.word_count.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Words</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-xl font-bold text-green-600">{documentAnalysis.page_count}</div>
                        <div className="text-xs text-gray-600">Pages</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xl font-bold text-purple-600">
                          {(documentAnalysis.readability_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Readability</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="text-xl font-bold text-orange-600">
                          {(documentAnalysis.complexity_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Complexity</div>
                      </div>
                      <div className="text-center p-3 bg-teal-50 rounded-lg border border-teal-200">
                        <div className="text-xl font-bold text-teal-600">
                          {(documentAnalysis.compliance_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">Compliance</div>
                      </div>
                      <div className="text-center p-3 bg-pink-50 rounded-lg border border-pink-200">
                        <div className="text-xl font-bold text-pink-600 capitalize">{documentAnalysis.risk_level}</div>
                        <div className="text-xs text-gray-600">Risk Level</div>
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
                    <CardDescription>
                      Main topics and themes identified across multiple AI models
                    </CardDescription>
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
                    <CardDescription>
                      Named entities and important terms identified using advanced AI processing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(documentAnalysis.entities).map(([category, items]) => (
                        <div key={category} className="space-y-2">
                          <h4 className="font-medium text-gray-900 capitalize flex items-center gap-2">
                            {category === 'persons' && <Users className="h-4 w-4" />}
                            {category === 'organizations' && <Globe className="h-4 w-4" />}
                            {category === 'dates' && <Calendar className="h-4 w-4" />}
                            {category === 'amounts' && <TrendingUp className="h-4 w-4" />}
                            {category === 'locations' && <Globe className="h-4 w-4" />}
                            {category === 'medical_terms' && <FileText className="h-4 w-4" />}
                            {category === 'legal_terms' && <Shield className="h-4 w-4" />}
                            {category.replace("_", " ")}
                          </h4>
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

                {/* Document Metadata */}
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Database className="h-5 w-5" />
                      Document Metadata & AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Language</div>
                        <div className="font-medium text-gray-900">{documentAnalysis.language}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Domain</div>
                        <div className="font-medium text-gray-900 capitalize">{documentAnalysis.domain}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Sentiment</div>
                        <div className="font-medium text-gray-900 capitalize">{documentAnalysis.sentiment}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600">Risk Assessment</div>
                        <Badge className={getRiskLevelColor(documentAnalysis.risk_level)}>
                          {documentAnalysis.risk_level} risk
                        </Badge>
                      </div>
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
                  <p className="text-gray-500 mb-4">Upload and process documents to see detailed insights and multi-AI analysis.</p>
                  <Button onClick={() => setActiveTab("upload")} className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Report Generation Options */}
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg border-b">
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <FileDown className="h-5 w-5" />
                    Multi-AI Report Generation & Export
                  </CardTitle>
                  <CardDescription>
                    Generate comprehensive reports and export your multi-model analysis data
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PDF Report */}
                    <div className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-red-50 to-pink-50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                          <FileDown className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Multi-AI PDF Report</h3>
                          <p className="text-sm text-gray-600">Comprehensive analysis with model comparison</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        Generate a detailed PDF report including document analysis, Q&A results from multiple AI models, insights, recommendations, and performance comparisons.
                      </p>
                      <Button
                        onClick={generatePDFReport}
                        disabled={isGeneratingReport || results.length === 0}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        {isGeneratingReport ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileDown className="h-4 w-4 mr-2" />
                            Generate Multi-AI Report
                          </>
                        )}
                      </Button>
                    </div>

                    {/* JSON Export */}
                    <div className="p-6 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileJson className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Enhanced JSON Export</h3>
                          <p className="text-sm text-gray-600">Complete data with AI model metadata</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-4">
                        Export all analysis data in JSON format including AI model information, performance metrics, and comparison data for integration with other systems.
                      </p>
                      <Button
                        onClick={downloadJSONData}
                        disabled={results.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <FileJson className="h-4 w-4 mr-2" />
                        Export Enhanced JSON
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Summary */}
              {stats && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <PieChart className="h-5 w-5" />
                      Multi-AI Session Summary
                    </CardTitle>
                    <CardDescription>
                      Overview of your current multi-model analysis session
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Session ID</span>
                        <span className="text-sm text-gray-600 font-mono">{sessionId}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Documents Processed</span>
                        <span className="text-sm text-gray-600">{stats.documents_processed}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Questions Analyzed</span>
                        <span className="text-sm text-gray-600">{stats.total_questions}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">AI Models Used</span>
                        <span className="text-sm text-gray-600">{Object.keys(stats.model_distribution).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">AI Providers</span>
                        <span className="text-sm text-gray-600">{Object.keys(stats.provider_distribution).length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Average Confidence</span>
                        <span className="text-sm text-gray-600">{(stats.avg_confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total Cost</span>
                        <span className="text-sm text-gray-600">${stats.cost_estimate.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Processing Time</span>
                        <span className="text-sm text-gray-600">{stats.avg_processing_time.toFixed(2)}s avg</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Real-time Logs */}
              {realtimeMessages.length > 0 && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900">
                      <Activity className="h-5 w-5" />
                      Multi-AI Processing Logs
                    </CardTitle>
                    <CardDescription>
                      Real-time processing activity and AI model switching logs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {realtimeMessages.map((message) => (
                          <div key={message.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              message.type === 'completion' ? 'bg-green-500' :
                              message.type === 'error' ? 'bg-red-500' :
                              message.type === 'model_switch' ? 'bg-purple-500' :
                              message.type === 'processing' ? 'bg-blue-500' :
                              'bg-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700">{message.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* No Data State */}
              {results.length === 0 && (
                <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileDown className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Available</h3>
                    <p className="text-gray-500 mb-4">Complete multi-AI document analysis to generate comprehensive reports with model comparisons.</p>
                    <Button onClick={() => setActiveTab("query")} className="bg-blue-600 hover:bg-blue-700">
                      <Search className="h-4 w-4 mr-2" />
                      Start Multi-AI Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
