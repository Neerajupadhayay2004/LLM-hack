"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Settings, CheckCircle, AlertCircle, FileDown, FileSpreadsheet, Code, RefreshCw } from 'lucide-react'

interface ReportGeneratorProps {
  analysisResults?: any[]
  statistics?: any
  documentInfo?: any
  onReportGenerated?: (reportUrl: string) => void
}

export function ReportGenerator({ 
  analysisResults = [], 
  statistics = {}, 
  documentInfo = {},
  onReportGenerated 
}: ReportGeneratorProps) {
  const [reportFormat, setReportFormat] = useState("pdf")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [reportTitle, setReportTitle] = useState("Document Analysis Report")
  const [executiveSummary, setExecutiveSummary] = useState("")
  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    statistics: true,
    results: true,
    insights: true,
    recommendations: true,
    appendix: false
  })
  const [customizations, setCustomizations] = useState({
    includeCharts: true,
    includeRawData: false,
    includeTimestamps: true,
    includeSources: true,
    colorScheme: "professional"
  })
  const [generatedReports, setGeneratedReports] = useState<any[]>([])

  const generateReport = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev < 90) return prev + 10
          return prev
        })
      }, 200)

      const reportData = {
        title: reportTitle,
        summary: executiveSummary || generateAutoSummary(),
        analysis_results: analysisResults,
        statistics: statistics,
        document_info: documentInfo,
        timestamp: new Date().toISOString(),
        sections: selectedSections,
        customizations: customizations,
        insights: generateInsights(),
        recommendations: generateRecommendations()
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportData,
          format: reportFormat
        })
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        
        // Add to generated reports list
        const newReport = {
          id: Date.now().toString(),
          title: reportTitle,
          format: reportFormat,
          size: blob.size,
          url: url,
          timestamp: new Date().toISOString(),
          status: 'completed'
        }
        
        setGeneratedReports(prev => [newReport, ...prev])
        onReportGenerated?.(url)

        // Auto-download
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportTitle.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${reportFormat}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        throw new Error('Report generation failed')
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setIsGenerating(false)
      setTimeout(() => setGenerationProgress(0), 2000)
    }
  }

  const downloadReport = (report: any) => {
    const a = document.createElement('a')
    a.href = report.url
    a.download = `${report.title.replace(/\s+/g, '-').toLowerCase()}.${report.format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const generateAutoSummary = () => {
    return `This comprehensive report analyzes ${analysisResults.length} queries across ${statistics.documents_processed || 1} document(s). 
    The analysis achieved an average confidence score of ${((statistics.avg_confidence || 0.85) * 100).toFixed(1)}% 
    with a total processing time of ${(statistics.avg_processing_time || 1.5).toFixed(2)} seconds per query.`
  }

  const generateInsights = () => [
    "Document structure indicates comprehensive policy coverage with clear terms and conditions",
    "High confidence scores suggest well-structured content suitable for automated analysis",
    "Processing efficiency demonstrates optimal system performance for document type",
    "Query patterns reveal common areas of user interest in policy details"
  ]

  const generateRecommendations = () => [
    "Consider implementing automated FAQ generation based on common query patterns",
    "Regular updates to document structure could improve processing efficiency",
    "Additional training data in domain-specific terminology could enhance accuracy",
    "Implementation of user feedback loop would improve future analysis quality"
  ]

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'summary': return <FileText className="h-4 w-4" />
      case 'statistics': return <FileSpreadsheet className="h-4 w-4" />
      case 'results': return <CheckCircle className="h-4 w-4" />
      case 'insights': return <AlertCircle className="h-4 w-4" />
      case 'recommendations': return <Settings className="h-4 w-4" />
      case 'appendix': return <Code className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>
            Configure your analysis report settings and content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-title">Report Title</Label>
              <Input
                id="report-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Enter report title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-format">Export Format</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger id="report-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileDown className="h-4 w-4" />
                      PDF Document
                    </div>
                  </SelectItem>
                  <SelectItem value="docx">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Word Document
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      JSON Data
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <Label htmlFor="executive-summary">Executive Summary (Optional)</Label>
            <Textarea
              id="executive-summary"
              value={executiveSummary}
              onChange={(e) => setExecutiveSummary(e.target.value)}
              placeholder="Enter custom executive summary or leave blank for auto-generated"
              rows={3}
            />
          </div>

          {/* Section Selection */}
          <div className="space-y-3">
            <Label>Report Sections</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(selectedSections).map(([section, checked]) => (
                <div key={section} className="flex items-center space-x-2">
                  <Checkbox
                    id={section}
                    checked={checked}
                    onCheckedChange={(checked) =>
                      setSelectedSections(prev => ({
                        ...prev,
                        [section]: checked === true
                      }))
                    }
                  />
                  <Label htmlFor={section} className="flex items-center gap-2 cursor-pointer">
                    {getSectionIcon(section)}
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-3">
            <Label>Customization Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-charts"
                  checked={customizations.includeCharts}
                  onCheckedChange={(checked) =>
                    setCustomizations(prev => ({
                      ...prev,
                      includeCharts: checked === true
                    }))
                  }
                />
                <Label htmlFor="include-charts" className="cursor-pointer">
                  Include Charts & Visualizations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-raw-data"
                  checked={customizations.includeRawData}
                  onCheckedChange={(checked) =>
                    setCustomizations(prev => ({
                      ...prev,
                      includeRawData: checked === true
                    }))
                  }
                />
                <Label htmlFor="include-raw-data" className="cursor-pointer">
                  Include Raw Data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-timestamps"
                  checked={customizations.includeTimestamps}
                  onCheckedChange={(checked) =>
                    setCustomizations(prev => ({
                      ...prev,
                      includeTimestamps: checked === true
                    }))
                  }
                />
                <Label htmlFor="include-timestamps" className="cursor-pointer">
                  Include Timestamps
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-sources"
                  checked={customizations.includeSources}
                  onCheckedChange={(checked) =>
                    setCustomizations(prev => ({
                      ...prev,
                      includeSources: checked === true
                    }))
                  }
                />
                <Label htmlFor="include-sources" className="cursor-pointer">
                  Include Source References
                </Label>
              </div>
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <Alert>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Generating report...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateReport}
            disabled={isGenerating || analysisResults.length === 0}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate & Download Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      {generatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
            <CardDescription>
              Download previously generated reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{report.format.toUpperCase()}</span>
                        <span>{formatFileSize(report.size)}</span>
                        <span>{new Date(report.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {report.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
