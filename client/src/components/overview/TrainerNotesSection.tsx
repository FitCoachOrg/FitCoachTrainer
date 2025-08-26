import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PanelSection } from "@/components/ui/PanelSection"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Plus, Save, Trash2, Search as SearchIcon, Brain, Mic, MicOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { performComprehensiveCoachAnalysis } from "@/lib/ai-comprehensive-coach-analysis"

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: SpeechRecognitionErrorEvent) => void
  onend: () => void
  start: () => void
  stop: () => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  length: number
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}

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
  const [isSavingNote, setIsSavingNote] = useState(false)
  
  // Voice-to-text functionality
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessingVoice, setIsProcessingVoice] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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
        setLastAIRecommendation(result.analysis)
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

  // Voice-to-text functions
  const startRecording = async () => {
    try {
      // Request high-quality audio for better speech recognition
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      })
      
      // Use WebM format with better audio quality, with fallback
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4'
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '' // Use default
          }
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        setIsProcessingVoice(true)
        try {
          // Use the same format as recorded for better compatibility
          const audioBlob = new Blob(audioChunksRef.current, { 
            type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
          })
          console.log('🎤 Audio recording completed, size:', audioBlob.size, 'bytes')
          
          const text = await convertSpeechToText(audioBlob)
          if (text && text.trim()) {
            setNewNote(prev => ({ 
              ...prev, 
              notes: prev.notes + (prev.notes ? '\n' : '') + text.trim() 
            }))
            toast({
              title: "Voice Note Added",
              description: `"${text.trim()}" has been added to your notes.`,
            })
          } else {
            toast({
              title: "No Speech Detected",
              description: "Please try speaking more clearly or for a longer duration.",
              variant: "destructive"
            })
          }
        } catch (error: any) {
          console.error('❌ Voice recognition error:', error)
          toast({
            title: "Voice Recognition Failed",
            description: error.message || "Failed to convert speech to text",
            variant: "destructive"
          })
        } finally {
          setIsProcessingVoice(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone. Click the microphone again to stop recording.",
      })
    } catch (error: any) {
      toast({
        title: "Recording Failed",
        description: "Please allow microphone access to use voice-to-text.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Check if recording is too short
      if (recordingTime < 1) {
        toast({
          title: "Recording Too Short",
          description: "Please record for at least 1 second for better recognition.",
          variant: "destructive"
        })
        // Stop recording but don't process
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        setIsRecording(false)
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
          recordingIntervalRef.current = null
        }
        return
      }
      
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }

  const convertSpeechToText = async (audioBlob: Blob): Promise<string> => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser')
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    return new Promise((resolve, reject) => {
      const recognition = new SpeechRecognition()
      
      // Configure recognition settings
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.maxAlternatives = 1

      let transcript = ''

      recognition.onresult = (event) => {
        if (event.results.length > 0) {
          transcript = event.results[0][0].transcript
          console.log('🎤 Speech recognition result:', transcript)
        }
      }

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error)
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      recognition.onend = () => {
        console.log('🔚 Speech recognition ended')
        if (transcript) {
          resolve(transcript)
        } else {
          reject(new Error('No speech detected'))
        }
      }

      // Convert audio blob to audio element and play it for recognition
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      audio.onloadedmetadata = () => {
        console.log('🎵 Audio loaded, starting recognition...')
        recognition.start()
        audio.play()
      }

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error)
        URL.revokeObjectURL(audioUrl)
        reject(new Error('Failed to play recorded audio'))
      }

      audio.onended = () => {
        console.log('🔚 Audio playback ended')
        URL.revokeObjectURL(audioUrl)
        // Recognition will continue for a short time after audio ends
        setTimeout(() => {
          if (recognition.state === 'recording') {
            recognition.stop()
          }
        }, 1000)
      }
    })
  }

  // Save notes to database and parent component
  const saveNotesToDatabase = async (notesToSave: TrainerNote[]) => {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timed out')), 30000); // 30 seconds
    });
    
    try {
      console.log('🔍 saveNotesToDatabase called with:', notesToSave)
      
      const { data: sessionData, error: sessionError } = await Promise.race([
        supabase.auth.getSession(),
        timeoutPromise
      ]);
      console.log('🔍 Session data:', sessionData)
      console.log('🔍 Session error:', sessionError)
      
      if (sessionError || !sessionData?.session?.user?.email) {
        throw new Error("Not logged in");
      }
      const trainerEmail = sessionData.session.user.email;
      console.log('🔍 Trainer email:', trainerEmail)
      
      // Get trainer ID
      const { data: trainerData, error: trainerError } = await Promise.race([
        supabase
          .from("trainer")
          .select("id")
          .eq("trainer_email", trainerEmail)
          .single(),
        timeoutPromise
      ]);
      
      console.log('🔍 Trainer data:', trainerData)
      console.log('🔍 Trainer error:', trainerError)
      console.log('🔍 Client ID:', client?.client_id)
      
      if (trainerError || !trainerData?.id || !client?.client_id) {
        throw new Error("Failed to get trainer or client information");
      }
      
      // Convert notes to JSON string
      const notesString = JSON.stringify(notesToSave)
      console.log('🔍 Notes string to save:', notesString)
      
      // Save to database
      console.log('🔍 Attempting database update...')
      console.log('🔍 trainer_id:', trainerData.id)
      console.log('🔍 client_id:', client.client_id)
      console.log('🔍 notesString length:', notesString.length)
      
      // First check if the record exists
      console.log('🔍 Checking if record exists...')
      const { data: existingRecord, error: checkError } = await Promise.race([
        supabase
          .from("trainer_client_web")
          .select("trainer_id, client_id")
          .eq("trainer_id", trainerData.id)
          .eq("client_id", client.client_id)
          .single(),
        timeoutPromise
      ]);
      
      console.log('🔍 Existing record check:', existingRecord)
      console.log('🔍 Check error:', checkError)
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('❌ Error checking existing record:', checkError)
        throw new Error(`Failed to check existing record: ${checkError.message}`);
      }
      
      if (!existingRecord) {
        console.log('🔍 Record does not exist, creating new record...')
        // Try to insert a new record
        const { data: insertData, error: insertError } = await Promise.race([
          supabase
            .from("trainer_client_web")
            .insert({ 
              trainer_id: trainerData.id, 
              client_id: client.client_id,
              trainer_notes: notesString 
            })
            .select(),
          timeoutPromise
        ]);
        
        console.log('🔍 Insert data:', insertData)
        console.log('🔍 Insert error:', insertError)
        
        if (insertError) {
          console.error('❌ Insert error:', insertError)
          throw new Error(`Failed to create record: ${insertError.message}`);
        }
        
        console.log('✅ New record created successfully')
      } else {
        console.log('🔍 Record exists, updating...')
        // Update existing record
        const { data: updateData, error: saveError } = await Promise.race([
          supabase
            .from("trainer_client_web")
            .update({ trainer_notes: notesString })
            .eq("trainer_id", trainerData.id)
            .eq("client_id", client.client_id)
            .select(),
          timeoutPromise
        ]);
        
        console.log('🔍 Update data:', updateData)
        console.log('🔍 Save error:', saveError)
        
        if (saveError) {
          console.error('❌ Database save error:', saveError)
          
          // Try to provide more specific error information
          if (saveError.code === '23505') {
            throw new Error('Duplicate entry - this note already exists');
          } else if (saveError.code === '23503') {
            throw new Error('Foreign key constraint failed - invalid trainer or client ID');
          } else if (saveError.code === '42501') {
            throw new Error('Permission denied - you do not have access to update this record');
          } else {
            throw new Error(`Database error: ${saveError.message}`);
          }
        }
        
        console.log('✅ Database update successful')
      }
      
      // Update parent component
      if (setTrainerNotes) {
        setTrainerNotes(notesString)
        console.log('✅ Parent component updated')
      } else {
        console.warn('⚠️ setTrainerNotes function not provided')
      }
      console.log('✅ Notes saved successfully')
      
      return true
    } catch (error: any) {
      console.error('❌ Error saving notes:', error)
      throw error
    }
  }

  // Add new note
  const handleAddNote = async () => {
    console.log('🔍 handleAddNote called')
    console.log('📝 newNote:', newNote)
    console.log('📝 newNote.notes:', newNote.notes)
    console.log('📝 newNote.notes.trim():', newNote.notes.trim())
    console.log('👤 client:', client)
    console.log('👤 client?.client_id:', client?.client_id)
    
    if (!client?.client_id) {
      console.log('❌ No client ID, returning early')
      toast({
        title: "Client Error",
        description: "Client information is missing. Please refresh the page.",
        variant: "destructive"
      })
      return
    }
    
    if (!newNote.notes.trim()) {
      console.log('❌ No notes content, returning early')
      toast({
        title: "No Content",
        description: "Please add some notes before saving.",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsSavingNote(true)
      console.log('✅ Creating new note...')
      const note: TrainerNote = {
        id: Date.now().toString(),
        date: newNote.date,
        notes: newNote.notes.trim(),
        createdAt: new Date().toISOString()
      }
      
      console.log('📋 Created note:', note)
      const updatedNotes = [note, ...notes]
      console.log('📋 Updated notes array:', updatedNotes)
      
      console.log('💾 Saving to database...')
      await saveNotesToDatabase(updatedNotes)
      console.log('✅ Database save successful')
      
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
        console.log('🤖 Triggering AI analysis...')
        await generateAIAnalysis(recentNotes)
      }
          } catch (error: any) {
        console.error('❌ Error in handleAddNote:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to add note",
          variant: "destructive"
        })
      } finally {
        setIsSavingNote(false)
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

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
                <div className="relative">
                  <Textarea
                    value={newNote.notes}
                    onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                    placeholder="Enter your notes or use voice-to-text..."
                    className="mt-1 min-h-[100px] pr-12"
                  />
                  {/* Voice-to-text button */}
                  <div className="absolute bottom-2 right-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={isRecording ? "destructive" : "outline"}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessingVoice}
                      className={`h-8 w-8 p-0 ${
                        isRecording 
                          ? 'bg-red-500 hover:bg-red-600 text-white' 
                          : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                      }`}
                    >
                      {isProcessingVoice ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isRecording ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {/* Recording indicator */}
                  {isRecording && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        {formatRecordingTime(recordingTime)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  onClick={() => {
                    console.log('🔘 Save Note button clicked!')
                    handleAddNote()
                  }} 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isGeneratingAI || isProcessingVoice || isSavingNote}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingNote ? "Saving..." : isGeneratingAI ? "Processing..." : isProcessingVoice ? "Processing..." : "Save Note"}
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