import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Plus, Save, Trash2, Search as SearchIcon, Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { performComprehensiveCoachAnalysis } from "@/lib/ai-comprehensive-coach-analysis"

// Interface for trainer notes
interface TrainerNote {
  id: string
  date: string
  notes: string
  createdAt: string
}

interface TrainerNotesSectionProps {
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
  setLastAIRecommendation?: (analysis: any) => void
}

export function TrainerNotesSection({ 
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
  lastAIRecommendation,
  setLastAIRecommendation
}: TrainerNotesSectionProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState<TrainerNote[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState({ date: new Date().toISOString().split('T')[0], notes: "" })
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<TrainerNote | null>(null)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

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
    } else {
      setNotes([])
    }
  }, [trainerNotes])

  // Helper function to get notes from last 2 weeks
  const getRecentNotes = (allNotes: TrainerNote[]) => {
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    
    return allNotes.filter(note => {
      const noteDate = new Date(note.date)
      return noteDate >= twoWeeksAgo
    })
  }

  // Helper function to generate AI analysis
  const generateAIAnalysis = async (notesToAnalyze: TrainerNote[]) => {
    if (!client?.client_id || !setLastAIRecommendation) return

    setIsGeneratingAI(true)
    
    try {
      // Convert notes to string format for AI analysis
      const notesString = notesToAnalyze.map(note => 
        `Date: ${note.date}\nNotes: ${note.notes}`
      ).join('\n\n')

      console.log('🤖 Generating AI analysis for recent notes...')
      
      const result = await performComprehensiveCoachAnalysis(
        client.client_id,
        notesString,
        '' // No todo items for now
      )

      if (result.success && result.analysis) {
        setLastAIRecommendation(result.analysis.analysis_data)
        toast({
          title: "AI Analysis Complete",
          description: "Comprehensive analysis has been generated based on your recent notes.",
        })
      } else {
        console.error('❌ AI analysis failed:', result.message)
        toast({
          title: "AI Analysis Failed",
          description: result.message || "Failed to generate AI analysis",
          variant: "destructive"
        })
      }
    } catch (error: any) {
      console.error('❌ Error generating AI analysis:', error)
      toast({
        title: "AI Analysis Error",
        description: error.message || "Failed to generate AI analysis",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Save notes to database and parent component
  const saveNotesToDatabase = async (notesToSave: TrainerNote[]) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session?.user?.email) {
        throw new Error("Not logged in");
      }
      const trainerEmail = sessionData.session.user.email;
      
      // Get trainer ID
      const { data: trainerData, error: trainerError } = await supabase
        .from("trainer")
        .select("id")
        .eq("trainer_email", trainerEmail)
        .single();
      
      if (trainerError || !trainerData?.id || !client?.client_id) {
        throw new Error("Failed to get trainer or client information");
      }
      
      // Convert notes to JSON string
      const notesString = JSON.stringify(notesToSave)
      
      // Save to database
      const { error: saveError } = await supabase
        .from("trainer_client_web")
        .update({ trainer_notes: notesString })
        .eq("trainer_id", trainerData.id)
        .eq("client_id", client.client_id);
        
      if (saveError) {
        throw new Error(saveError.message);
      }
      
      // Update parent component
      setTrainerNotes(notesString)
      
      return true
    } catch (error: any) {
      console.error('Error saving notes:', error)
      throw error
    }
  }

  // Add new note
  const handleAddNote = async () => {
    if (!newNote.notes.trim()) return
    
    try {
      const note: TrainerNote = {
        id: Date.now().toString(),
        date: newNote.date,
        notes: newNote.notes.trim(),
        createdAt: new Date().toISOString()
      }
      
      const updatedNotes = [note, ...notes]
      await saveNotesToDatabase(updatedNotes)
      setNotes(updatedNotes)
      
      setNewNote({ date: new Date().toISOString().split('T')[0], notes: "" })
      setIsAddingNote(false)
      
      toast({
        title: "Note Added",
        description: "New trainer note has been added successfully.",
      })

      // Trigger AI analysis with recent notes (last 2 weeks)
      const recentNotes = getRecentNotes(updatedNotes)
      if (recentNotes.length > 0) {
        await generateAIAnalysis(recentNotes)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive"
      })
    }
  }

  // Update note
  const handleUpdateNote = async () => {
    if (!editingNote || !editingNote.notes.trim()) return
    
    try {
      const updatedNotes = notes.map(note => 
        note.id === editingNote.id ? editingNote : note
      )
      await saveNotesToDatabase(updatedNotes)
      setNotes(updatedNotes)
      
      setEditingNoteId(null)
      setEditingNote(null)
      
      toast({
        title: "Note Updated",
        description: "Trainer note has been updated successfully.",
      })

      // Trigger AI analysis with recent notes (last 2 weeks)
      const recentNotes = getRecentNotes(updatedNotes)
      if (recentNotes.length > 0) {
        await generateAIAnalysis(recentNotes)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update note",
        variant: "destructive"
      })
    }
  }

  // Delete note
  const handleDeleteNote = async (id: string) => {
    try {
      const updatedNotes = notes.filter(note => note.id !== id)
      await saveNotesToDatabase(updatedNotes)
      setNotes(updatedNotes)
      
      toast({
        title: "Note Deleted",
        description: "Trainer note has been deleted successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive"
      })
    }
  }

  // Filter notes based on search query
  const filteredNotes = notes.filter(note =>
    note.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.date.includes(searchQuery)
  )

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Trainer Notes</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
              disabled={isSavingNotes || isGeneratingAnalysis || isGeneratingAI}
              className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </CardTitle>
          
          {/* AI Analysis Status */}
          {isGeneratingAI && (
            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mt-2">
              <Brain className="h-4 w-4 animate-pulse" />
              Generating AI Analysis...
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Add Note Form */}
      {isAddingNote && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-green-800 dark:text-green-300">Date</label>
                <Input
                  type="date"
                  value={newNote.date}
                  onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-green-800 dark:text-green-300">Notes</label>
                <Textarea
                  value={newNote.notes}
                  onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                  placeholder="Enter your notes..."
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddNote} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isGeneratingAI}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isGeneratingAI ? "Saving..." : "Save Note"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingNote(false)}
                  className="text-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
            <CardContent className="p-8 text-center">
              <Edit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                No Notes Found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? "No notes match your search." : "Add your first trainer note to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardContent className="p-4">
                {editingNoteId === note.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                      <Input
                        type="date"
                        value={editingNote?.date || note.date}
                        onChange={(e) => setEditingNote(editingNote ? { ...editingNote, date: e.target.value } : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                      <Textarea
                        value={editingNote?.notes || note.notes}
                        onChange={(e) => setEditingNote(editingNote ? { ...editingNote, notes: e.target.value } : null)}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleUpdateNote} 
                        className="bg-blue-600 hover:bg-blue-700"
                        disabled={isGeneratingAI}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isGeneratingAI ? "Updating..." : "Update"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setEditingNoteId(null)
                          setEditingNote(null)
                        }}
                        className="text-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(note.date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingNoteId(note.id)
                            setEditingNote(note)
                          }}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {note.notes}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Error Display */}
      {notesError && (
        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              Error: {notesError}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 