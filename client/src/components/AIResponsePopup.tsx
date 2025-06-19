import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Button } from './ui/button'
import { Copy, ExternalLink } from 'lucide-react'

interface AIResponse {
  response: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  model: string
  timestamp: string
}

interface AIResponsePopupProps {
  isOpen: boolean
  onClose: () => void
  aiResponse: AIResponse | null
  clientName?: string
  onShowMetrics?: () => void
}

export function AIResponsePopup({ isOpen, onClose, aiResponse, clientName, onShowMetrics }: AIResponsePopupProps) {
  if (!aiResponse) return null

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(aiResponse.response)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="text-2xl">🤖</div>
            AI Response for {clientName || 'Client'}
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
              {aiResponse.model}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Response Content */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                ChatGPT Response
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                {onShowMetrics && (
                  <Button
                    onClick={onShowMetrics}
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Metrics
                  </Button>
                )}
              </div>
            </div>
            
            <ScrollArea className="h-[50vh] pr-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                  {aiResponse.response}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Model Used
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {aiResponse.model}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Tokens Used
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {aiResponse.usage.total_tokens}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {aiResponse.usage.prompt_tokens} prompt + {aiResponse.usage.completion_tokens} completion
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Generated At
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {formatTimestamp(aiResponse.timestamp)}
              </div>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                API Usage Information
              </span>
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
              <div>• Prompt tokens: {aiResponse.usage.prompt_tokens} (input)</div>
              <div>• Completion tokens: {aiResponse.usage.completion_tokens} (output)</div>
              <div>• Total tokens: {aiResponse.usage.total_tokens}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 