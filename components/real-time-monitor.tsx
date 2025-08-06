"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Pause, Play, RefreshCw, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react'

interface RealtimeUpdate {
  type: 'processing' | 'insight' | 'completion' | 'error' | 'connection'
  message: string
  progress?: number
  stage?: string
  confidence?: number
  category?: string
  timestamp: string
  results_count?: number
  processing_time?: string
}

interface RealtimeMonitorProps {
  documentId?: string
  isActive?: boolean
  onStatusChange?: (status: string) => void
}

export function RealtimeMonitor({ documentId, isActive = false, onStatusChange }: RealtimeMonitorProps) {
  const [updates, setUpdates] = useState<RealtimeUpdate[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('')
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (isActive && !isPaused) {
      connectToRealtimeStream()
    } else {
      disconnectFromRealtimeStream()
    }

    return () => {
      disconnectFromRealtimeStream()
    }
  }, [isActive, isPaused, documentId])

  const connectToRealtimeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const url = `/api/realtime/analysis${documentId ? `?documentId=${documentId}` : ''}`
    eventSourceRef.current = new EventSource(url)

    eventSourceRef.current.onopen = () => {
      setIsConnected(true)
      onStatusChange?.('connected')
    }

    eventSourceRef.current.onmessage = (event) => {
      try {
        const update: RealtimeUpdate = JSON.parse(event.data)
        setUpdates(prev => [update, ...prev.slice(0, 49)]) // Keep last 50 updates

        if (update.type === 'processing' && update.progress !== undefined) {
          setCurrentProgress(update.progress)
          setCurrentStage(update.stage || '')
        }

        if (update.type === 'completion') {
          setCurrentProgress(100)
          onStatusChange?.('completed')
        }

        if (update.type === 'error') {
          onStatusChange?.('error')
        }
      } catch (error) {
        console.error('Error parsing realtime update:', error)
      }
    }

    eventSourceRef.current.onerror = () => {
      setIsConnected(false)
      onStatusChange?.('error')
    }
  }

  const disconnectFromRealtimeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setIsConnected(false)
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
    if (isPaused) {
      connectToRealtimeStream()
    } else {
      disconnectFromRealtimeStream()
    }
  }

  const clearUpdates = () => {
    setUpdates([])
    setCurrentProgress(0)
    setCurrentStage('')
  }

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'insight':
        return <Zap className="h-4 w-4 text-yellow-500" />
      case 'completion':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'connection':
        return <Activity className="h-4 w-4 text-purple-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getUpdateColor = (type: string) => {
    switch (type) {
      case 'processing':
        return 'bg-blue-50 border-blue-200'
      case 'insight':
        return 'bg-yellow-50 border-yellow-200'
      case 'completion':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'connection':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Analysis Monitor
            </CardTitle>
            <CardDescription>
              Live updates from document processing pipeline
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-green-500" : ""}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePause}
              disabled={!isActive}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearUpdates}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Progress */}
        {currentProgress > 0 && currentProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{currentStage || 'Processing'}</span>
              <span>{currentProgress.toFixed(0)}%</span>
            </div>
            <Progress value={currentProgress} className="h-2" />
          </div>
        )}

        {/* Updates Feed */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {updates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No updates yet. Start analysis to see real-time progress.</p>
              </div>
            ) : (
              updates.map((update, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all duration-200 ${getUpdateColor(update.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getUpdateIcon(update.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {update.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(update.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {update.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        {update.confidence !== undefined && (
                          <Badge variant="outline" className="bg-white">
                            Confidence: {(update.confidence * 100).toFixed(1)}%
                          </Badge>
                        )}
                        {update.category && (
                          <Badge variant="outline" className="bg-white">
                            {update.category}
                          </Badge>
                        )}
                        {update.results_count !== undefined && (
                          <Badge variant="outline" className="bg-white">
                            {update.results_count} results
                          </Badge>
                        )}
                        {update.processing_time && (
                          <Badge variant="outline" className="bg-white">
                            {update.processing_time}s
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Connection Info */}
        <div className="pt-2 border-t text-xs text-gray-500 flex items-center justify-between">
          <span>Updates: {updates.length}</span>
          <span>Status: {isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </CardContent>
    </Card>
  )
}
