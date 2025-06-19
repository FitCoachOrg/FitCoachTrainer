import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Activity, 
  Clock, 
  Zap, 
  BarChart3, 
  Brain,
  DollarSign,
  CheckCircle,
  X
} from "lucide-react"

interface AIMetrics {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  model: string
  timestamp: string
  responseTime?: number
  estimatedCost?: number
}

interface AIMetricsPopupProps {
  isOpen: boolean
  onClose: () => void
  metrics: AIMetrics | null
  clientName?: string
}

export const AIMetricsPopup: React.FC<AIMetricsPopupProps> = ({
  isOpen,
  onClose,
  metrics,
  clientName = "Client"
}) => {
  if (!metrics) return null

  // Calculate estimated cost (rough estimate for GPT-4)
  const estimatedCost = ((metrics.inputTokens * 0.03 + metrics.outputTokens * 0.06) / 1000).toFixed(4)
  
  // Format timestamp
  const formattedTime = new Date(metrics.timestamp).toLocaleString()
  
  // Calculate efficiency metrics
  const tokensPerSecond = metrics.responseTime ? Math.round(metrics.totalTokens / (metrics.responseTime / 1000)) : null
  const compressionRatio = ((metrics.outputTokens / metrics.inputTokens) * 100).toFixed(1)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Generation Metrics
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Fitness plan generated for <span className="font-medium">{clientName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success Status */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">
                  AI Plan Generated Successfully
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Token Usage Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Input Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.inputTokens.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Prompt & context
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-green-600" />
                  Output Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.outputTokens.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Generated response
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  Total Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.totalTokens.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Combined usage
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Model and Cost Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Model Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Model:</span>
                  <Badge variant="outline" className="font-mono">
                    {metrics.model}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Generated:</span>
                  <span className="text-sm font-medium">{formattedTime}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated Cost:</span>
                  <span className="text-sm font-bold text-green-600">
                    ${estimatedCost}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Output Ratio:</span>
                  <span className="text-sm font-medium">
                    {compressionRatio}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          {(metrics.responseTime || tokensPerSecond) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {metrics.responseTime && (
                    <div>
                      <span className="text-sm text-muted-foreground">Response Time:</span>
                      <div className="text-lg font-bold text-orange-600">
                        {(metrics.responseTime / 1000).toFixed(2)}s
                      </div>
                    </div>
                  )}
                  {tokensPerSecond && (
                    <div>
                      <span className="text-sm text-muted-foreground">Tokens/Second:</span>
                      <div className="text-lg font-bold text-orange-600">
                        {tokensPerSecond}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Token Usage Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Token Usage Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Input Tokens ({((metrics.inputTokens / metrics.totalTokens) * 100).toFixed(1)}%)</span>
                  <span className="font-medium">{metrics.inputTokens.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.inputTokens / metrics.totalTokens) * 100}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm mt-3">
                  <span>Output Tokens ({((metrics.outputTokens / metrics.totalTokens) * 100).toFixed(1)}%)</span>
                  <span className="font-medium">{metrics.outputTokens.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(metrics.outputTokens / metrics.totalTokens) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} className="w-full md:w-auto">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 