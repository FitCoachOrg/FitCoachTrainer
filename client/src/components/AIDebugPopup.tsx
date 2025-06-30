"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Download, Bug, Zap, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIDebugPopupProps {
  isOpen: boolean
  onClose: () => void
  rawResponse: any
  parsedData: any[]
  clientName?: string
}

export const AIDebugPopup: React.FC<AIDebugPopupProps> = ({
  isOpen,
  onClose,
  rawResponse,
  parsedData,
  clientName
}) => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"raw" | "parsed" | "comparison">("raw")

  const copyToClipboard = (data: any, type: string) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${type} data copied successfully`,
    })
  }

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-950/30 dark:to-purple-950/30 border-0 shadow-2xl">
        <DialogHeader className="border-b border-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 pb-6 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
              <Bug className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                AI Workout Plan Debug
              </span>
              {clientName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mt-1">
                  Client: {clientName}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4 flex-shrink-0">
              <TabsTrigger value="raw" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Raw AI Response
              </TabsTrigger>
              <TabsTrigger value="parsed" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Parsed Database Data
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Comparison & Issues
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0">
              <TabsContent value="raw" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <Card className="flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-0 shadow-lg flex flex-col">
                  <CardHeader className="pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        OpenAI Raw Response
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(rawResponse, "Raw Response")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadJSON(rawResponse, `ai-raw-response-${Date.now()}.json`)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    {rawResponse?.timestamp && (
                      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Generated: {formatTime(rawResponse.timestamp)}</span>
                        {rawResponse?.model && <span>Model: {rawResponse.model}</span>}
                        {rawResponse?.usage && (
                          <Badge variant="outline">
                            {rawResponse.usage.total_tokens} tokens
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ScrollArea className="h-full w-full">
                      <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap break-words">
                        {rawResponse?.response || JSON.stringify(rawResponse, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="parsed" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <Card className="flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-0 shadow-lg flex flex-col">
                  <CardHeader className="pb-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-green-600" />
                        Parsed Database Data
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(parsedData, "Parsed Data")}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadJSON(parsedData, `parsed-workout-data-${Date.now()}.json`)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Records to Insert: {parsedData?.length || 0}</span>
                      {parsedData?.length > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          Ready for Database
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ScrollArea className="h-full w-full">
                      <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-4 rounded-lg whitespace-pre-wrap break-words">
                        {JSON.stringify(parsedData, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col">
                <Card className="flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-0 shadow-lg flex flex-col">
                  <CardHeader className="pb-4 flex-shrink-0">
                    <CardTitle className="flex items-center gap-2">
                      <Bug className="h-5 w-5 text-orange-600" />
                      Data Analysis & Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-0 p-4">
                    <ScrollArea className="h-full w-full">
                      <div className="space-y-4 pr-4">
                        {/* Analysis Summary */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">AI Response Analysis</h4>
                            <div className="space-y-1 text-sm">
                              <div>Response Type: {typeof rawResponse?.response}</div>
                              <div>Response Length: {rawResponse?.response?.length || 0} chars</div>
                              <div>Contains JSON: {rawResponse?.response?.includes('{') ? '✅ Yes' : '❌ No'}</div>
                              <div>Model Used: {rawResponse?.model || 'Unknown'}</div>
                            </div>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Parsed Data Analysis</h4>
                            <div className="space-y-1 text-sm">
                              <div>Parsed Records: {parsedData?.length || 0}</div>
                              <div>Data Type: {Array.isArray(parsedData) ? 'Array' : typeof parsedData}</div>
                              <div>Valid Structure: {parsedData?.length > 0 ? '✅ Yes' : '❌ No'}</div>
                              <div>Ready for DB: {parsedData?.length > 0 ? '✅ Yes' : '❌ No'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Field Validation */}
                        {parsedData?.length > 0 && (
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Field Validation</h4>
                            <div className="space-y-2 text-sm">
                              {parsedData.map((record: any, index: number) => (
                                <div key={index} className="border-l-2 border-yellow-300 pl-3">
                                  <div className="font-medium">Record {index + 1}:</div>
                                  <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                                    <div>client_id: {record.client_id ? '✅' : '❌'}</div>
                                    <div>workout: {record.workout ? '✅' : '❌'}</div>
                                    <div>for_date: {record.for_date ? '✅' : '❌'}</div>
                                    <div>for_time: {record.for_time ? '✅' : '❌'}</div>
                                    <div>sets: {record.sets ? '✅' : '⚠️'}</div>
                                    <div>reps: {record.reps ? '✅' : '⚠️'}</div>
                                  </div>
                                  {record.for_time && !record.for_time.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/) && (
                                    <div className="text-red-600 text-xs mt-1">
                                      ⚠️ Invalid time format: {record.for_time}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                                                 {/* Raw JSON Preview */}
                         {rawResponse?.response && (
                           <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                             <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">JSON Extraction Preview</h4>
                             <div className="max-h-96 overflow-auto">
                               <pre className="text-xs whitespace-pre-wrap break-words">
                                 {(() => {
                                   try {
                                     const jsonMatch = rawResponse.response.match(/\{[\s\S]*\}/)
                                     return jsonMatch ? JSON.stringify(JSON.parse(jsonMatch[0]), null, 2) : 'No valid JSON found'
                                   } catch (e) {
                                     return 'Error parsing JSON: ' + e.message
                                   }
                                 })()}
                               </pre>
                             </div>
                           </div>
                         )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close Debug View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AIDebugPopup 