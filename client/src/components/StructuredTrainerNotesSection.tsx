"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Edit,
  Plus,
  Save,
  Trash2,
  Brain,
  Cpu,
  Sparkles,
  BarChart3,
  Target,
  Lightbulb,
  Star,
  AlertTriangle,
  CheckCircle,
  CalendarDays,
  Search as SearchIcon,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"

// Interface for trainer notes
interface TrainerNote {
  id: string
  date: string
  notes: string
  createdAt: string
}

// Props interface for the component
interface StructuredTrainerNotesSectionProps {
  client: any
  trainerNotes: string
  setTrainerNotes: (notes: string) => void
  handleSaveTrainerNotes: () => void
  isSavingNotes: boolean
  isEditingNotes: boolean
  setIsEditingNotes: (editing: boolean) => void
  notesDraft: string
  setNotesDraft: (draft: string) => void
  notesError: string | null
  setNotesError: (error: string | null) => void
  isGeneratingAnalysis: boolean
  handleSummarizeNotes: () => void
  isSummarizingNotes: boolean


  lastAIRecommendation: any
}

/**
 * StructuredTrainerNotesSection Component
 * 
 * This component provides a comprehensive trainer notes management system with:
 * - Add, edit, and delete structured notes with dates
 * - Search functionality for notes
 * - AI-powered analysis with multiple tabs (Summary, Action Plan, Recommendations, Insights)
 * - Support for both ChatGPT and Local LLM analysis
 * 
 * Features:
 * - Structured note format with dates and timestamps
 * - Real-time search and filtering
 * - AI analysis with tabbed interface
 * - Responsive design with proper loading states
 * - Error handling and validation
 */
export function StructuredTrainerNotesSection({ 
  client, 
  trainerNotes, 
  setTrainerNotes, 
  handleSaveTrainerNotes, 
  isSavingNotes, 
  isEditingNotes, 
  setIsEditingNotes,
  notesDraft,
  setNotesDraft,
  notesError,
  setNotesError,
  isGeneratingAnalysis,
  handleSummarizeNotes,
  isSummarizingNotes,
  lastAIRecommendation 
}: StructuredTrainerNotesSectionProps) {
  const [notes, setNotes] = useState<TrainerNote[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState({ date: new Date().toISOString().split('T')[0], notes: "" })
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<TrainerNote | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'action_plan' | 'recommendations' | 'insights'>('summary')

  // Load existing notes from trainerNotes string
  useEffect(() => {
    if (trainerNotes) {
      try {
        const parsedNotes = JSON.parse(trainerNotes)
        if (Array.isArray(parsedNotes)) {
          setNotes(parsedNotes)
        } else {
          // Convert old format to new format
          setNotes([{
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            notes: trainerNotes,
            createdAt: new Date().toISOString()
          }])
        }
      } catch {
        // If not JSON, treat as old format
        if (trainerNotes.trim()) {
          setNotes([{
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            notes: trainerNotes,
            createdAt: new Date().toISOString()
          }])
        }
      }
    }
  }, [trainerNotes])

  // Save notes to parent component
  const saveNotesToParent = (notesToSave: TrainerNote[]) => {
    const notesString = JSON.stringify(notesToSave)
    setTrainerNotes(notesString)
  }

  // Add new note
  const handleAddNote = () => {
    if (!newNote.notes.trim()) return
    
    const note: TrainerNote = {
      id: Date.now().toString(),
      date: newNote.date,
      notes: newNote.notes.trim(),
      createdAt: new Date().toISOString()
    }
    
    const updatedNotes = [note, ...notes]
    setNotes(updatedNotes)
    saveNotesToParent(updatedNotes)
    
    setNewNote({ date: new Date().toISOString().split('T')[0], notes: "" })
    setIsAddingNote(false)
  }

  // Update note
  const handleUpdateNote = () => {
    if (!editingNote || !editingNote.notes.trim()) return
    
    const updatedNotes = notes.map(note => 
      note.id === editingNote.id ? editingNote : note
    )
    setNotes(updatedNotes)
    saveNotesToParent(updatedNotes)
    
    setEditingNoteId(null)
    setEditingNote(null)
  }

  // Delete note
  const handleDeleteNote = (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id)
    setNotes(updatedNotes)
    saveNotesToParent(updatedNotes)
  }

  // Filter notes based on search query
  const filteredNotes = notes.filter(note =>
    note.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.date.includes(searchQuery)
  )

  return (
    <div className="mb-8">
      {/* Structured Trainer Notes Card */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-yellow-600" />
            Trainer Notes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
              disabled={isSavingNotes || isGeneratingAnalysis}
              className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
            
            {notes.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSummarizeNotes}
                  disabled={isSavingNotes || isGeneratingAnalysis || isSummarizingNotes}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-900/20"
                >
                  {isSummarizingNotes ? (
                    <>
                      <LoadingSpinner size="small" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      AI Summary
                    </>
                  )}
                </Button>
                

              </>
            )}
          </div>
          
          {isGeneratingAnalysis && (
            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
              <LoadingSpinner size="small" />
              Generating AI Analysis...
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Search Bar */}
          {notes.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notes by date or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Add New Note Form */}
          {isAddingNote && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <Label htmlFor="note-date">Date:</Label>
                  </div>
                  <Input
                    id="note-date"
                    type="date"
                    value={newNote.date}
                    onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                    className="w-40"
                  />
                </div>
                
                <div>
                  <Label htmlFor="note-content">Notes:</Label>
                  <Textarea
                    id="note-content"
                    value={newNote.notes}
                    onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                    placeholder="Add your notes about the client..."
                    className="min-h-[100px] mt-1"
                    style={{ 
                      minHeight: '100px',
                      height: Math.max(100, newNote.notes.split('\n').length * 20)
                    }}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddNote}
                    disabled={!newNote.notes.trim()}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Note
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingNote(false)
                      setNewNote({ date: new Date().toISOString().split('T')[0], notes: "" })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notes List - Fixed Height with Scroll */}
          {filteredNotes.length > 0 ? (
            <div className="relative">
              <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    {editingNoteId === note.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-gray-500" />
                            <Label htmlFor={`edit-date-${note.id}`}>Date:</Label>
                          </div>
                          <Input
                            id={`edit-date-${note.id}`}
                            type="date"
                            value={editingNote?.date || note.date}
                            onChange={(e) => setEditingNote(editingNote ? { ...editingNote, date: e.target.value } : null)}
                            className="w-40"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`edit-content-${note.id}`}>Notes:</Label>
                          <Textarea
                            id={`edit-content-${note.id}`}
                            value={editingNote?.notes || note.notes}
                            onChange={(e) => setEditingNote(editingNote ? { ...editingNote, notes: e.target.value } : null)}
                            className="mt-1"
                            style={{ 
                              minHeight: '100px',
                              height: Math.max(100, (editingNote?.notes || note.notes).split('\n').length * 20)
                            }}
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdateNote}
                            disabled={!editingNote?.notes.trim()}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Update Note
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingNoteId(null)
                              setEditingNote(null)
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CalendarDays className="h-4 w-4" />
                            {new Date(note.date).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingNoteId(note.id)
                                setEditingNote(note)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                          {note.notes}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Scroll indicator */}
              {filteredNotes.length > 3 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-yellow-50 dark:from-yellow-900/20 to-transparent pointer-events-none rounded-b-lg"></div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? "No notes found" : "No notes added yet"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Click 'Add Note' to start documenting your sessions"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setIsAddingNote(true)}
                  className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Note
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Coach Analysis - Always Visible */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI Coach Analysis
            </span>
          </CardTitle>
          
          {/* Tab Navigation with Icons */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mt-4">
            {[
              { id: 'summary', label: 'Summary', icon: BarChart3 },
              { id: 'action_plan', label: 'Action Plan', icon: Target },
              { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
              { id: 'insights', label: 'Insights', icon: Brain }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </CardHeader>
        
        <CardContent>
          {lastAIRecommendation ? (
            <div className="space-y-6">
              {/* Summary Tab */}
              {activeTab === 'summary' && lastAIRecommendation.summary && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600">Client Status Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">
                        {typeof lastAIRecommendation.summary.client_status === 'string' 
                          ? lastAIRecommendation.summary.client_status 
                          : 'No client status available'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-600">Progress Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">
                        {typeof lastAIRecommendation.summary.progress_assessment === 'string' 
                          ? lastAIRecommendation.summary.progress_assessment 
                          : 'No progress assessment available'}
                      </p>
                    </CardContent>
                  </Card>

                  {lastAIRecommendation.summary.key_insights && lastAIRecommendation.summary.key_insights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-600">Key Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {lastAIRecommendation.summary.key_insights.map((insight: any, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {String(insight)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lastAIRecommendation.summary.immediate_concerns && lastAIRecommendation.summary.immediate_concerns.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Immediate Concerns
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {lastAIRecommendation.summary.immediate_concerns.map((concern: any, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">
                                • {String(concern)}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {lastAIRecommendation.summary.positive_developments && lastAIRecommendation.summary.positive_developments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg text-green-600 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            Positive Developments
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1">
                            {lastAIRecommendation.summary.positive_developments.map((development: any, index: number) => (
                              <li key={index} className="text-gray-700 dark:text-gray-300">
                                • {String(development)}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Action Plan Tab */}
              {activeTab === 'action_plan' && lastAIRecommendation.action_plan && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600">Immediate Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {lastAIRecommendation.action_plan.immediate_actions?.map((action: any, index: number) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                                {typeof action === 'string' ? action : action.action}
                              </p>
                              {typeof action === 'object' && (
                                <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                  {action.priority && (
                                    <span className="inline-block bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded text-xs">
                                      Priority: {action.priority}
                                    </span>
                                  )}
                                  {action.timeframe && (
                                    <span className="inline-block bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded text-xs ml-2">
                                      {action.timeframe}
                                    </span>
                                  )}
                                  {action.category && (
                                    <span className="inline-block bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded text-xs ml-2">
                                      {action.category}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {lastAIRecommendation.action_plan.weekly_focus && lastAIRecommendation.action_plan.weekly_focus.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg text-indigo-600">Weekly Focus Areas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {lastAIRecommendation.action_plan.weekly_focus.map((focus: any, index: number) => (
                            <div key={index} className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                              <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                                {focus.focus_area || `Focus Area ${index + 1}`}
                              </h4>
                              {focus.specific_actions && (
                                <ul className="space-y-1">
                                  {focus.specific_actions.map((action: string, actionIndex: number) => (
                                    <li key={actionIndex} className="flex items-start gap-2 text-sm text-indigo-700 dark:text-indigo-300">
                                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                      {action}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && lastAIRecommendation.coaching_recommendations && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(lastAIRecommendation.coaching_recommendations).map(([key, recommendations]: [string, any]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-lg capitalize">{key.replace('_', ' ')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {recommendations?.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && lastAIRecommendation.client_insights && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-purple-600">Engagement Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">{lastAIRecommendation.client_insights.engagement_level}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(lastAIRecommendation.client_insights)
                      .filter(([key]) => key !== 'engagement_level')
                      .map(([key, items]: [string, any]) => (
                        <Card key={key}>
                          <CardHeader>
                            <CardTitle className="text-lg capitalize">{key.replace('_', ' ')}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-1">
                              {items?.map((item: string, index: number) => (
                                <li key={index} className="text-gray-700 dark:text-gray-300">• {item}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No AI Analysis Available</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Generate comprehensive AI analysis from your trainer notes to unlock detailed insights</p>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Add detailed trainer notes above, then the AI will automatically generate comprehensive analysis including client status, action plans, and coaching recommendations.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 