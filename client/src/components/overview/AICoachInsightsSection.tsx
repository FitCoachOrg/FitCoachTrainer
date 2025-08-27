import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Brain, Sparkles, Target, Calendar, TrendingUp, AlertTriangle, CheckCircle, Zap, Star, Clock, Users, BarChart3, Lightbulb, Activity, ArrowRight, MessageSquare, Settings, Dumbbell, Utensils, Heart, Timer, Award, ThumbsUp } from "lucide-react"
import { performComprehensiveCoachAnalysis } from "@/lib/ai-comprehensive-coach-analysis"
import { useToast } from "@/hooks/use-toast"
import { AICoachInsightsState } from "@/types/ai-coach-insights"
import { AddToTodoButton } from "@/components/ai-todo/AddToTodoButton"
import { supabase } from "@/lib/supabase"
import { fetchSnapshot } from "@/lib/ai-insights/insights-service"

interface AICoachInsightsSectionProps {
  lastAIRecommendation: any
  onViewFullAnalysis: () => void
  client?: any
  trainerNotes?: string
  setLastAIRecommendation?: (analysis: any) => void
  aiCoachInsights?: AICoachInsightsState
}

interface ActionItem {
  id: string
  text: string
  completed: boolean
  priority?: 'High' | 'Medium' | 'Low'
  category?: string
  timeframe?: string
}

export function AICoachInsightsSection({ 
  lastAIRecommendation, 
  onViewFullAnalysis, 
  client, 
  trainerNotes,
  setLastAIRecommendation,
  aiCoachInsights
}: AICoachInsightsSectionProps) {
  const { toast } = useToast()
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  
  // State to track completed actions
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set())
  
  // State to track actions added to todos
  const [addedToTodos, setAddedToTodos] = useState<Set<string>>(new Set())
  
  // State to toggle visibility of added items
  const [showAddedItems, setShowAddedItems] = useState(false)
  
  // Suggestions pop-up removed – consolidating into Immediate Actions
  const [snapshot, setSnapshot] = useState<{ momentum: 'Up' | 'Flat' | 'Down'; adherence_pct: number | null; readiness: 'Low' | 'Medium' | 'High' | null } | null>(null)

  useEffect(() => {
    const clientId = client?.client_id
    if (!clientId) return
    let cancelled = false
    ;(async () => {
      try {
        console.log('🔍 Fetching snapshot for client:', clientId)
        const s = await fetchSnapshot(clientId)
        console.log('📊 Snapshot fetched:', s)
        if (!cancelled) setSnapshot(s)
      } catch (e) {
        console.error('❌ Failed to fetch snapshot:', e)
        // Set a default snapshot for debugging
        if (!cancelled) {
          setSnapshot({ momentum: 'Flat', adherence_pct: null, readiness: null })
        }
      }
    })()
    return () => { cancelled = true }
  }, [client?.client_id])

  const handleActionToggle = (actionId: string) => {
    const newCompleted = new Set(completedActions)
    if (newCompleted.has(actionId)) {
      newCompleted.delete(actionId)
    } else {
      newCompleted.add(actionId)
    }
    setCompletedActions(newCompleted)
  }

  // Centralized todo management state
  const [processingTodos, setProcessingTodos] = useState<Set<string>>(new Set())

  // Robust function to check if action can be added to todo
  const canAddToTodo = (actionId: string): boolean => {
    // Check if already processing
    if (processingTodos.has(actionId)) {
      return false
    }

    // Check local addedToTodos state
    if (addedToTodos.has(actionId)) {
      return false
    }

    // Check JSON flag
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    if (currentRecommendation?.actions) {
      const actionIndex = parseInt(actionId.replace('action-', ''))
      const action = currentRecommendation.actions[actionIndex]
      if (action?.added_to_todo === true) {
        return false
      }
    }

    return true
  }

  // Robust function to mark action as added
  const markActionAsAdded = (actionId: string) => {
    console.log(`🔄 Starting to mark action ${actionId} as added`)

    // Update local state
    setAddedToTodos(prev => {
      const newSet = new Set([...prev, actionId])
      console.log(`✅ Updated addedToTodos:`, Array.from(newSet))
      return newSet
    })

    // Update the JSON data to mark item as added
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    if (currentRecommendation?.actions) {
      const updatedRecommendation = {
        ...currentRecommendation,
        actions: currentRecommendation.actions.map((action: any, index: number) => {
          const itemId = `action-${index}`;
          if (itemId === actionId) {
            console.log(`🔄 Marking action ${itemId} as added_to_todo: true`)
            return { ...action, added_to_todo: true };
          }
          return action;
        })
      };

      // Update the state with the modified recommendation
      if (aiCoachInsights?.setLastAIRecommendation) {
        console.log(`🔄 Updating aiCoachInsights state`)
        aiCoachInsights.setLastAIRecommendation(updatedRecommendation);
      } else if (setLastAIRecommendation) {
        console.log(`🔄 Updating local lastAIRecommendation state`)
        setLastAIRecommendation(updatedRecommendation);
      }

      console.log(`✅ Action item ${actionId} marked as added to todo list and JSON updated`)
    }

    // Remove from processing set
    setProcessingTodos(prev => {
      const newSet = new Set(prev)
      newSet.delete(actionId)
      return newSet
    })
  }

  // Handle action added to todos with robust error handling
  const handleActionAdded = (actionId: string) => {
    console.log(`🎯 handleActionAdded called for ${actionId}`)

    // Add to processing set to prevent multiple clicks
    setProcessingTodos(prev => new Set([...prev, actionId]))

    try {
      markActionAsAdded(actionId)

      toast({
        title: "Action Added to Todo",
        description: "Successfully added to your todo list.",
      })
    } catch (error) {
      console.error(`❌ Error adding action ${actionId} to todo:`, error)

      // Remove from processing set on error
      setProcessingTodos(prev => {
        const newSet = new Set(prev)
        newSet.delete(actionId)
        return newSet
      })

      toast({
        title: "Failed to Add Todo",
        description: "There was an error adding the item to your todo list.",
        variant: "destructive"
      })
    }
  }

  // Helper function to convert trainer notes to proper format for AI analysis
  const convertTrainerNotesToText = (notes: string): string => {
    if (!notes || typeof notes !== 'string') {
      return ''
    }
    
    try {
      // Try to parse as JSON (structured notes format)
      const parsedNotes = JSON.parse(notes)
      if (Array.isArray(parsedNotes)) {
        // Convert array of note objects to text
        return parsedNotes.map(note => 
          `Date: ${note.date}\nNotes: ${note.notes}`
        ).join('\n\n')
      }
    } catch (error) {
      // If not JSON, treat as plain text
      console.log('📝 Notes are not JSON, treating as plain text')
    }
    
    // Return as-is if it's already plain text
    return notes
  }

  // Create a reusable function to update AI recommendations
  const updateAIRecommendation = (analysis: any) => {
    const currentSetLastAIRecommendation = aiCoachInsights?.setLastAIRecommendation || setLastAIRecommendation;

    if (currentSetLastAIRecommendation) {
      currentSetLastAIRecommendation(analysis);
    } else {
      toast({
        title: "AI Analysis Complete",
        description: "Analysis generated successfully, but cannot be saved to parent component.",
      });
    }
  };

  // Temporary test function to bypass AI and test UI
  const handleTestUIWithMockData = () => {
    console.log('🧪 Test UI button clicked! - Look for a BRIGHT RED card below!');

    const mockAnalysis = {
      snapshot: {
        momentum: 'Up',
        adherence_pct: 85,
        readiness: 'Medium',
        one_liner: 'Client showing good progress with consistent attendance'
      },
      actions: [
        {
          text: 'Monitor shoulder discomfort during overhead presses',
          reason_tag: 'recovery',
          impact: 'Prevent injury progression',
          add_to_todo_hint: true,
          added_to_todo: true
        },
        {
          text: 'Focus on consistent meal timing',
          reason_tag: 'nutrition',
          impact: 'Improve energy levels',
          add_to_todo_hint: true,
          added_to_todo: false
        }
      ],
      risks: [
        {
          text: 'Shoulder discomfort with overhead work',
          mitigation: 'Reduce volume and ensure proper warm-up'
        }
      ],
      next_session: [
        { text: 'Light shoulder mobility warm-up' },
        { text: 'Modified overhead press with lighter weight' }
      ],
      weekly_focus: [
        { text: 'Recovery focus this week', metric: 'shoulder discomfort', target: 'reduced to minimal' }
      ],
      positives: [
        { text: 'Consistent 3x/week attendance maintained' }
      ],
      metadata: {
        version: 'test-v1',
        generated_at: new Date().toISOString(),
        data_sources: ['mock_data']
      }
    };

    updateAIRecommendation(mockAnalysis);

    toast({
      title: "Mock Analysis Complete",
      description: "Testing UI display with sample data",
    });
  };

  // Function to generate AI analysis from trainer notes
  const handleGenerateAIAnalysis = async () => {
    // Use unified AI Coach Insights if available, otherwise fall back to individual props
    const currentClient = client || aiCoachInsights?.client;
    const currentTrainerNotes = aiCoachInsights?.trainerNotes || trainerNotes;
    const currentSetLastAIRecommendation = aiCoachInsights?.setLastAIRecommendation || setLastAIRecommendation;
    const currentIsGeneratingAnalysis = aiCoachInsights?.isGeneratingAnalysis;
    const currentSetIsGeneratingAnalysis = aiCoachInsights?.setIsGeneratingAnalysis;

    console.log('🚀 Starting AI Analysis Generation')
    console.log('🔍 AI Analysis Debug Info:')
    console.log('👤 client:', currentClient)
    console.log('👤 client?.client_id:', currentClient?.client_id)
    console.log('📝 trainerNotes:', currentTrainerNotes)
    console.log('📝 trainerNotes type:', typeof currentTrainerNotes)
    console.log('📝 trainerNotes length:', currentTrainerNotes?.length)
    console.log('🔧 setLastAIRecommendation:', currentSetLastAIRecommendation)
    console.log('🔧 aiCoachInsights available:', !!aiCoachInsights)

    if (!currentClient?.client_id || !currentTrainerNotes) {
      console.log('❌ Validation failed:')
      console.log('  - client?.client_id:', !!currentClient?.client_id)
      console.log('  - trainerNotes:', !!currentTrainerNotes)

      toast({
        title: "Cannot Generate Analysis",
        description: "Please ensure trainer notes are available and client information is loaded.",
        variant: "destructive"
      })
      return
    }

    // Check if trainer notes have sufficient content
    if (currentTrainerNotes.trim().length < 20) {
      console.log('❌ Trainer notes too short:', currentTrainerNotes.trim().length, 'characters')
      toast({
        title: "Insufficient Notes",
        description: "Please add more trainer notes (minimum 20 characters) before generating AI analysis.",
        variant: "destructive"
      })
      return
    }

    // Use unified state management if available
    if (currentSetIsGeneratingAnalysis) {
      currentSetIsGeneratingAnalysis(true);
    } else {
      setIsGeneratingAnalysis(true);
    }

    try {
      console.log('🤖 Generating AI analysis from trainer notes...')

      // Convert trainer notes to proper format
      const notesText = convertTrainerNotesToText(currentTrainerNotes)
      console.log('📝 Converted notes text:', notesText)
      console.log('📝 Converted notes length:', notesText.length)

      const result = await performComprehensiveCoachAnalysis(
        currentClient.client_id,
        notesText,
        '' // No todo items for now
      )

      console.log('📊 AI Analysis Result:', result)

      if (result.success && result.analysis) {
        console.log('✅ Analysis successful, actions count:', result.analysis.actions?.length || 0)
        updateAIRecommendation(result.analysis)
        toast({
          title: "AI Analysis Complete",
          description: `Analysis generated with ${result.analysis.actions?.length || 0} actions.`,
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
      // Use unified state management if available
      if (currentSetIsGeneratingAnalysis) {
        currentSetIsGeneratingAnalysis(false);
      } else {
        setIsGeneratingAnalysis(false);
      }
    }
  }

  // Helper function to extract action items (filtered to show only unadded items by default)
  const getActionItems = (): ActionItem[] => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;

    const actions = currentRecommendation?.action_plan?.immediate_actions ||
                  currentRecommendation?.immediate_actions ||
                  currentRecommendation?.action_items?.immediate_actions ||
                  currentRecommendation?.recommendations?.immediate_actions ||
                  currentRecommendation?.actions ||
                  [];

    return actions
      .map((action: any, index: number) => ({
        id: `action-${index}`,
        text: typeof action === 'string' ? action :
              typeof action === 'object' && action.text ? action.text :
              typeof action === 'object' && action.action ? action.action :
              String(action),
        completed: completedActions.has(`action-${index}`),
        priority: action.priority || action.reason_tag || 'Medium',
        category: action.category || 'General',
        timeframe: action.timeframe || 'This week',
        added_to_todo: action.added_to_todo || false
      }))
      .filter(item => {
        // Filter out items that have been added to todos (unless showAddedItems is true)
        const isAddedToTodo = addedToTodos.has(item.id) || item.added_to_todo
        return showAddedItems || !isAddedToTodo
      })
  }

  // Helper function to get all action items (including added ones) for counting
  const getAllActionItems = (): ActionItem[] => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;

    const actions = currentRecommendation?.action_plan?.immediate_actions ||
                  currentRecommendation?.immediate_actions ||
                  currentRecommendation?.action_items?.immediate_actions ||
                  currentRecommendation?.recommendations?.immediate_actions ||
                  currentRecommendation?.actions ||
                  [];

    return actions
      .map((action: any, index: number) => ({
        id: `action-${index}`,
        text: typeof action === 'string' ? action :
              typeof action === 'object' && action.text ? action.text :
              typeof action === 'object' && action.action ? action.action :
              String(action),
        completed: completedActions.has(`action-${index}`),
        priority: action.priority || action.reason_tag || 'Medium',
        category: action.category || 'General',
        timeframe: action.timeframe || 'This week',
        added_to_todo: action.added_to_todo || false
      }))
  }

  // Helper function to get progress assessment
  const getProgressAssessment = () => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    return currentRecommendation?.summary?.progress_assessment || 
           currentRecommendation?.progress_assessment ||
           currentRecommendation?.assessment?.progress;
  }

  // Helper function to get positive developments
  const getPositiveDevelopments = () => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    return currentRecommendation?.summary?.positive_developments || 
           currentRecommendation?.positive_developments ||
           currentRecommendation?.assessment?.positive_developments ||
           [];
  }

  // Helper function to get immediate concerns
  const getImmediateConcerns = () => {
    const currentRecommendation = aiCoachInsights?.lastAIRecommendation || lastAIRecommendation;
    return currentRecommendation?.summary?.immediate_concerns || 
           currentRecommendation?.immediate_concerns ||
           [];
  }

  // Helper function to get weekly focus areas
  const getWeeklyFocusAreas = () => {
    return lastAIRecommendation?.action_plan?.weekly_focus || 
           lastAIRecommendation?.weekly_focus ||
           [];
  }

  // Helper function to get recommendations
  const getRecommendations = () => {
    return lastAIRecommendation?.recommendations || 
           lastAIRecommendation?.coaching_recommendations ||
           {};
  }

  // Helper function to get insights
  const getInsights = () => {
    return lastAIRecommendation?.insights || 
           lastAIRecommendation?.client_insights ||
           {};
  }

  // Helper function to get next session focus
  const getNextSessionFocus = () => {
    return lastAIRecommendation?.next_session_focus || 
           lastAIRecommendation?.next_session_plan ||
           {};
  }

  // Helper function to get coaching recommendations
  const getCoachingRecommendations = () => {
    return lastAIRecommendation?.coaching_recommendations || 
           lastAIRecommendation?.recommendations?.coaching ||
           {};
  }

  // Helper function to get workout plan changes
  const getWorkoutPlanChanges = () => {
    return lastAIRecommendation?.workout_plan_changes || {};
  }

  // Helper function to get nutritional plan changes
  const getNutritionalPlanChanges = () => {
    return lastAIRecommendation?.nutritional_plan_changes || {};
  }

  const actionItems = getActionItems()
  const progressAssessment = getProgressAssessment()
  const positiveDevelopments = getPositiveDevelopments()
  const immediateConcerns = getImmediateConcerns()
  const weeklyFocusAreas = getWeeklyFocusAreas()
  const recommendations = getRecommendations()
  const insights = getInsights()
  const nextSessionFocus = getNextSessionFocus()
  const coachingRecommendations = getCoachingRecommendations()
  const workoutPlanChanges = getWorkoutPlanChanges()
  const nutritionalPlanChanges = getNutritionalPlanChanges()

  // Calculate action items status
  const allActionItems = getAllActionItems()
  const totalActions = allActionItems.length
  const addedActions = allActionItems.filter(item => 
    addedToTodos.has(item.id) || item.added_to_todo
  ).length
  const remainingActions = actionItems.length // This is now the filtered count
  const allActionsAdded = totalActions > 0 && remainingActions === 0

  const renderMomentumChip = () => {
    if (!snapshot) return null
    const color = snapshot.momentum === 'Up' ? 'text-emerald-600' : snapshot.momentum === 'Down' ? 'text-rose-600' : 'text-gray-600'
    return (
      <div className={`flex items-center gap-1.5 text-xs ${color} whitespace-nowrap`}>
        <TrendingUp className="h-4 w-4" />
        <span>Momentum: {snapshot.momentum}</span>
      </div>
    )
  }

  const renderAdherenceChip = () => {
    if (!snapshot) return null
    const pct = snapshot.adherence_pct
    const color = pct == null ? 'text-gray-600' : pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-600' : 'text-rose-600'
    return (
      <div className={`flex items-center gap-1.5 text-xs ${color} whitespace-nowrap`}>
        <CheckCircle className="h-4 w-4" />
        <span>Adherence: {pct == null ? '—' : `${pct}%`}</span>
      </div>
    )
  }

  const renderReadinessChip = () => {
    if (!snapshot) return null
    const level = snapshot.readiness
    const color = level === 'High' ? 'text-emerald-600' : level === 'Medium' ? 'text-amber-600' : level === 'Low' ? 'text-rose-600' : 'text-gray-600'
    return (
      <div className={`flex items-center gap-1.5 text-xs ${color} whitespace-nowrap`}>
        <Activity className="h-4 w-4" />
        <span>Readiness: {level ?? '—'}</span>
      </div>
    )
  }

  const truncate = (text: string, max: number) => {
    if (!text) return text
    return text.length > max ? text.slice(0, max).trim() : text
  }

  // Enhanced duplicate checking function for bulk operations
  const checkExistingTodosForBulk = async (items: ActionItem[], clientId: number, trainerId: string): Promise<{
    existingTodos: any[],
    duplicateItems: ActionItem[],
    newItems: ActionItem[]
  }> => {
    try {
      console.log('🔍 Checking for existing todos for bulk operation...')
      
      // Get all existing todos for this client
      const { data: existingTodos, error } = await supabase
        .from('todos')
        .select('*')
        .eq('trainer_id', trainerId)
        .eq('client_id', clientId)
        .eq('source', 'ai_recommendation')

      if (error) {
        console.error('Error checking existing todos:', error)
        return { existingTodos: [], duplicateItems: [], newItems: items }
      }

      const existingTitles = new Set(existingTodos?.map(todo => todo.title.toLowerCase().trim()) || [])
      const duplicateItems: ActionItem[] = []
      const newItems: ActionItem[] = []

      // Check each item for duplicates
      for (const item of items) {
        const normalizedTitle = truncate(item.text, 80).toLowerCase().trim()
        
                 // Check for exact matches and similar matches (fuzzy matching)
         const isDuplicate = Array.from(existingTitles).some(existingTitle => {
           // Exact match
           if (existingTitle === normalizedTitle) return true
           
           // Similar match (70% similarity threshold for better detection)
           const similarity = calculateSimilarity(existingTitle, normalizedTitle)
           return similarity > 0.7
         })

        if (isDuplicate) {
          duplicateItems.push(item)
        } else {
          newItems.push(item)
        }
      }

      console.log(`📊 Duplicate check results: ${newItems.length} new, ${duplicateItems.length} duplicates`)
      return { existingTodos: existingTodos || [], duplicateItems, newItems }
    } catch (error) {
      console.error('Error in bulk duplicate check:', error)
      return { existingTodos: [], duplicateItems: [], newItems: items }
    }
  }

  // Simple similarity calculation function
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  // Levenshtein distance calculation for similarity
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  // Enhanced handleAddAllToTodos with robust duplicate prevention
  const handleAddAllToTodos = async () => {
    try {
      console.log('🚀 Starting enhanced bulk todo creation...')
      
      // Authentication check
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData?.session?.user?.id) {
        toast({ title: "Not signed in", description: "Please log in to add todos.", variant: "destructive" })
        return
      }
      
      const trainerId = sessionData.session.user.id
      const clientId = client?.client_id
      if (!clientId) {
        toast({ title: "No client selected", description: "Open a client to add todos.", variant: "destructive" })
        return
      }

      // Get action items and limit to 3
      const allItems = getActionItems()
      const items = allItems.slice(0, 3)
      
      if (items.length === 0) {
        toast({ title: "No actions", description: "Nothing to add right now." })
        return
      }

      // Check for duplicates
      const { duplicateItems, newItems } = await checkExistingTodosForBulk(items, clientId, trainerId)
      
      // If all items are duplicates, show warning and return
      if (newItems.length === 0 && duplicateItems.length > 0) {
        toast({ 
          title: "All items already exist", 
          description: `${duplicateItems.length} item(s) are already in your todo list.`, 
          variant: "destructive" 
        })
        return
      }

      // If some items are duplicates, show mixed result
      if (duplicateItems.length > 0) {
        toast({ 
          title: "Some items already exist", 
          description: `${duplicateItems.length} item(s) skipped (already exist), ${newItems.length} new item(s) will be added.`, 
          variant: "default" 
        })
      }

      // Calculate priority based on client metrics
      const priority = (() => {
        const pct = snapshot?.adherence_pct ?? null
        const readiness = snapshot?.readiness ?? null
        const hasConcerns = (getImmediateConcerns() || []).length > 0
        if ((pct !== null && pct < 60) || readiness === 'Low' || hasConcerns) return 'high'
        return 'medium'
      })()

      // Prepare new todos for insertion
      const rows = newItems.map((item) => ({
        trainer_id: trainerId,
        client_id: clientId,
        title: truncate(item.text, 80),
        priority,
        category: item.category || 'consistency',
        source: 'ai_recommendation',
        ai_context: JSON.stringify({ 
          from: 'immediate_actions', 
          snapshot,
          original_action_id: item.id,
          added_at: new Date().toISOString()
        })
      }))

      // Insert new todos
      if (rows.length > 0) {
        const { error } = await supabase.from('todos').insert(rows)
        if (error) throw error

        // Update local state to mark items as added
        newItems.forEach(item => {
          markActionAsAdded(item.id)
        })

        // Show success message with detailed breakdown
        const successMessage = duplicateItems.length > 0 
          ? `${newItems.length} new item(s) added, ${duplicateItems.length} skipped (already exist)`
          : `${newItems.length} item(s) added successfully`
        
        toast({ 
          title: "Todos created", 
          description: successMessage,
          variant: "default"
        })

        console.log(`✅ Bulk todo creation completed: ${newItems.length} added, ${duplicateItems.length} duplicates`)
      }

    } catch (e: any) {
      console.error('❌ Enhanced bulk todo creation failed:', e)
      toast({ 
        title: "Failed to add todos", 
        description: e?.message || "Please try again", 
        variant: "destructive" 
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800 shadow-xl">
        <CardHeader className="pb-4 space-y-3">
          {/* Row 1: Title (single line) */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">AI Coach Insights</CardTitle>
          </div>

          {/* Row 2: Metrics chips (icons) */}
          <div className="flex items-center gap-4 flex-wrap">
            {renderMomentumChip()}
            {renderAdherenceChip()}
            {renderReadinessChip()}
          </div>

          {/* Row 3: Action buttons */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestUIWithMockData}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              Test UI
            </Button>

            <Button
              variant="default"
              size="default"
              onClick={handleGenerateAIAnalysis}
              disabled={!client?.client_id || !trainerNotes || isGeneratingAnalysis || aiCoachInsights?.isGeneratingAnalysis}
              className="bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
            >
              {(isGeneratingAnalysis || aiCoachInsights?.isGeneratingAnalysis) ? (
                <>
                  <Brain className="h-4 w-4 mr-2 animate-pulse" />
                  Run Analysis
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run AI Analysis
                </>
              )}
            </Button>

            {/* Suggestions button removed - consolidated into Immediate Actions */}
          </div>
        </CardHeader>
      </Card>

      {/* Suggestions pop-up removed – consolidated into Immediate Actions */}

      {/* Action Plan Card - Moved to top */}
      {actionItems.length > 0 ? (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="pb-4">
              <div className="space-y-3">
                {/* Title Row - Icon and Title Only */}
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex-shrink-0">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                    Immediate Actions
                  </h3>
                </div>

                {/* Status Row - Comprehensive Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={allActionsAdded ? "default" : "outline"}
                      className={`text-xs font-medium ${
                        allActionsAdded
                          ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400"
                          : "text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700"
                      }`}
                    >
                      {allActionsAdded ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1.5" />
                          All Added
                        </>
                      ) : (
                        <>
                          <Target className="h-3 w-3 mr-1.5" />
                          {addedActions}/{totalActions} Added
                        </>
                      )}
                    </Badge>

                    {remainingActions > 0 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {remainingActions} remaining
                      </span>
                    )}

                    {allActionsAdded && (
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Complete
                      </span>
                    )}
                  </div>

                  {processingTodos.size > 0 && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                      ⏳ Adding...
                    </span>
                  )}
                </div>

                {/* Description Row - Full Width */}
                <div className="w-full">
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    AI-powered recommendations to optimize your client's progress and accelerate results
                  </p>
                </div>

                {/* Action Button Row */}
                <div className="flex justify-between items-center pt-3 border-t border-blue-200/50 dark:border-blue-800/50">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Click individual items to add them to your todo list
                    </div>
                    
                    {/* Toggle to show/hide added items */}
                    {totalActions > 0 && addedActions > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddedItems(!showAddedItems)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {showAddedItems ? 'Hide Added' : `Show Added (${addedActions})`}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddAllToTodos}
                    disabled={allActionsAdded || remainingActions === 0}
                    className={`transition-all duration-200 ${
                      allActionsAdded || remainingActions === 0
                        ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 cursor-not-allowed"
                        : "text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/30"
                    }`}
                  >
                    {allActionsAdded || remainingActions === 0 ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        All Items Added
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Add All Remaining ({remainingActions})
                      </>
                    )}
                  </Button>
                  
                  {/* Show summary of added items */}
                  {totalActions > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {addedActions} of {totalActions} added
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionItems.map((item) => {
                // Get appropriate icons based on priority and category
                const getPriorityIcon = (priority: string) => {
                  switch (priority?.toLowerCase()) {
                    case 'high': return <AlertTriangle className="h-3 w-3" />;
                    case 'medium': return <Zap className="h-3 w-3" />;
                    case 'recovery': return <Heart className="h-3 w-3" />;
                    case 'nutrition': return <Utensils className="h-3 w-3" />;
                    case 'consistency': return <Target className="h-3 w-3" />;
                    case 'technique': return <Dumbbell className="h-3 w-3" />;
                    default: return <CheckCircle className="h-3 w-3" />;
                  }
                };

                const getCategoryIcon = (category: string) => {
                  switch (category?.toLowerCase()) {
                    case 'recovery': return <Heart className="h-3 w-3" />;
                    case 'nutrition': return <Utensils className="h-3 w-3" />;
                    case 'consistency': return <Target className="h-3 w-3" />;
                    case 'technique': return <Dumbbell className="h-3 w-3" />;
                    case 'adherence': return <CheckCircle className="h-3 w-3" />;
                    default: return <Activity className="h-3 w-3" />;
                  }
                };

                // Check if this item has been added to todos
                const isAddedToTodo = addedToTodos.has(item.id) || item.added_to_todo
                
                return (
                  <div key={item.id} className={`group relative rounded-xl border p-4 hover:shadow-md transition-all duration-200 ${
                    isAddedToTodo 
                      ? "bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/60 dark:border-green-800/60 opacity-75"
                      : "bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/60 dark:border-blue-800/60"
                  }`}>
                    {/* Action Content - Full Width */}
                    <div className="space-y-3">
                      {/* Checkbox and Action Text Row */}
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => handleActionToggle(item.id)}
                          className="mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-base leading-relaxed ${item.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                            {item.text}
                          </p>
                        </div>
                      </div>

                      {/* Metadata Row */}
                      <div className="flex items-center gap-4 text-sm ml-7">
                        {/* Priority */}
                        {item.priority && (
                          <div className="flex items-center gap-1.5">
                            {getPriorityIcon(item.priority)}
                            <Badge
                              variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'default' : 'secondary'}
                              className="text-xs font-medium"
                            >
                              {item.priority}
                            </Badge>
                          </div>
                        )}

                        {/* Category */}
                        {item.category && (
                          <div className="flex items-center gap-1.5">
                            {getCategoryIcon(item.category)}
                            <Badge variant="outline" className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {item.category}
                            </Badge>
                          </div>
                        )}

                        {/* Timeframe */}
                        {item.timeframe && (
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs">{item.timeframe}</span>
                          </div>
                        )}
                      </div>

                      {/* Add to Todo Button - Bottom Right */}
                      <div className="flex justify-end pt-2">
                        {!canAddToTodo(item.id) ? (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700 rounded-md text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Added to Todo
                          </div>
                        ) : (
                          <AddToTodoButton
                            recommendation={item}
                            clientId={client?.client_id}
                            variant={
                              processingTodos.has(item.id)
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={`transition-all duration-200 ${
                              processingTodos.has(item.id)
                                ? "bg-blue-500 text-white animate-pulse"
                                : "opacity-70 group-hover:opacity-100 text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/30"
                            }`}
                            onAddSuccess={() => handleActionAdded(item.id)}
                            disabled={processingTodos.has(item.id)}
                          >
                            {processingTodos.has(item.id) ? "⏳ Adding..." : "Add to Todo"}
                          </AddToTodoButton>
                        )}
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 bg-gradient-to-r from-blue-500 to-indigo-500 transition-opacity duration-200 pointer-events-none" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : totalActions > 0 && allActionsAdded ? (
        // Show completion message when all action items have been added
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">
                  All Action Items Added!
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">
                  All {totalActions} AI recommendations have been successfully added to your todo list.
                </p>
                <p className="text-xs text-green-500 dark:text-green-500">
                  You can view and manage them in the Todo section.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Progress Assessment Card */}
      {lastAIRecommendation?.summary?.progress_assessment && (
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <TrendingUp className="h-5 w-5" />
              Progress Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              {lastAIRecommendation.summary.progress_assessment}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Card */}
      {lastAIRecommendation?.summary?.key_insights && lastAIRecommendation.summary.key_insights.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-300">
              <Lightbulb className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastAIRecommendation.summary.key_insights.map((insight: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Status Card */}
      {lastAIRecommendation?.summary?.client_status && (
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border-cyan-200 dark:border-cyan-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
              <Users className="h-5 w-5" />
              Client Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-cyan-700 dark:text-cyan-300">
              {lastAIRecommendation.summary.client_status}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Workout Plan Changes Card */}
      {Object.keys(workoutPlanChanges).length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Dumbbell className="h-5 w-5" />
              Workout Plan Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workoutPlanChanges.exercise_modifications && workoutPlanChanges.exercise_modifications.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Exercise Modifications</h4>
                  {workoutPlanChanges.exercise_modifications.map((mod: any, index: number) => (
                    <div key={index} className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2 mb-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{mod.exercise}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{mod.change}</p>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        <p><strong>Timeline:</strong> {mod.timeline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {workoutPlanChanges.intensity_adjustments && workoutPlanChanges.intensity_adjustments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Intensity Adjustments</h4>
                  {workoutPlanChanges.intensity_adjustments.map((adj: any, index: number) => (
                    <div key={index} className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{adj.area}</span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{adj.adjustment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nutritional Plan Changes Card */}
      {Object.keys(nutritionalPlanChanges).length > 0 && (
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
              <Utensils className="h-5 w-5" />
              Nutritional Plan Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {nutritionalPlanChanges.dietary_adjustments && nutritionalPlanChanges.dietary_adjustments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Dietary Adjustments</h4>
                  {nutritionalPlanChanges.dietary_adjustments.map((adj: any, index: number) => (
                    <div key={index} className="p-3 bg-orange-100/50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">{adj.nutrient}</span>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">{adj.adjustment}</p>
                      {adj.food_sources && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          <strong>Food Sources:</strong> {adj.food_sources}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {nutritionalPlanChanges.meal_timing_changes && nutritionalPlanChanges.meal_timing_changes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400">Meal Timing Changes</h4>
                  {nutritionalPlanChanges.meal_timing_changes.map((timing: any, index: number) => (
                    <div key={index} className="p-3 bg-orange-100/50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-300">{timing.meal}</span>
                      </div>
                      <p className="text-xs text-orange-600 dark:text-orange-400">{timing.change}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Recommendations Card */}
      {Object.keys(recommendations).length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <Award className="h-5 w-5" />
              Enhanced Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.training_recommendations && recommendations.training_recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Training Recommendations
                  </h4>
                  {recommendations.training_recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{rec.category}</span>
                        <Badge 
                          variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {recommendations.nutrition_recommendations && recommendations.nutrition_recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <Utensils className="h-4 w-4" />
                    Nutrition Recommendations
                  </h4>
                  {recommendations.nutrition_recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{rec.category}</span>
                        <Badge 
                          variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {recommendations.lifestyle_recommendations && recommendations.lifestyle_recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Lifestyle Recommendations
                  </h4>
                  {recommendations.lifestyle_recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{rec.category}</span>
                        <Badge 
                          variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {rec.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-2">{rec.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Immediate Concerns Card */}
      {lastAIRecommendation?.summary?.immediate_concerns && lastAIRecommendation.summary.immediate_concerns.length > 0 && (
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-300">
              <AlertTriangle className="h-5 w-5" />
              Immediate Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastAIRecommendation.summary.immediate_concerns.map((concern: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-red-700 dark:text-red-300">{concern}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positive Developments Card */}
      {lastAIRecommendation?.summary?.positive_developments && lastAIRecommendation.summary.positive_developments.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <ThumbsUp className="h-5 w-5" />
              Positive Developments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lastAIRecommendation.summary.positive_developments.map((development: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <p className="text-sm text-green-700 dark:text-green-300">{development}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Session Plan Card */}
      {lastAIRecommendation?.next_session_plan && (
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-200 dark:border-teal-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-teal-800 dark:text-teal-300">
              <Calendar className="h-5 w-5" />
              Next Session Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastAIRecommendation.next_session_plan.primary_objectives && lastAIRecommendation.next_session_plan.primary_objectives.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-400">Primary Objectives</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.next_session_plan.primary_objectives.map((objective: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-teal-700 dark:text-teal-300">{objective}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.next_session_plan.specific_exercises && lastAIRecommendation.next_session_plan.specific_exercises.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-400">Specific Exercises</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.next_session_plan.specific_exercises.map((exercise: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-teal-700 dark:text-teal-300">{exercise}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.next_session_plan.discussion_topics && lastAIRecommendation.next_session_plan.discussion_topics.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-teal-700 dark:text-teal-400">Discussion Topics</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.next_session_plan.discussion_topics.map((topic: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-teal-700 dark:text-teal-300">{topic}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Insights Card */}
      {lastAIRecommendation?.client_insights && (
        <Card className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-300">
              <Brain className="h-5 w-5" />
              Client Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastAIRecommendation.client_insights.behavioral_patterns && lastAIRecommendation.client_insights.behavioral_patterns.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Behavioral Patterns</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.client_insights.behavioral_patterns.map((pattern: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{pattern}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.client_insights.engagement_level && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Engagement Level</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{lastAIRecommendation.client_insights.engagement_level}</p>
                </div>
              )}

              {lastAIRecommendation.client_insights.potential_barriers && lastAIRecommendation.client_insights.potential_barriers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Potential Barriers</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.client_insights.potential_barriers.map((barrier: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{barrier}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.client_insights.success_factors && lastAIRecommendation.client_insights.success_factors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-400">Success Factors</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.client_insights.success_factors.map((factor: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{factor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coaching Recommendations Card */}
      {lastAIRecommendation?.coaching_recommendations && (
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-violet-800 dark:text-violet-300">
              <MessageSquare className="h-5 w-5" />
              Coaching Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lastAIRecommendation.coaching_recommendations.training_modifications && lastAIRecommendation.coaching_recommendations.training_modifications.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-400">Training Modifications</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.coaching_recommendations.training_modifications.map((mod: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-violet-700 dark:text-violet-300">{mod}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.coaching_recommendations.communication_strategy && lastAIRecommendation.coaching_recommendations.communication_strategy.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-400">Communication Strategy</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.coaching_recommendations.communication_strategy.map((strategy: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-violet-700 dark:text-violet-300">{strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAIRecommendation.coaching_recommendations.motivation_techniques && lastAIRecommendation.coaching_recommendations.motivation_techniques.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-violet-700 dark:text-violet-400">Motivation Techniques</h4>
                  <div className="space-y-2">
                    {lastAIRecommendation.coaching_recommendations.motivation_techniques.map((technique: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0"></div>
                        <p className="text-sm text-violet-700 dark:text-violet-300">{technique}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Focus Areas Card */}
      {weeklyFocusAreas.length > 0 && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300">
              <Calendar className="h-5 w-5" />
              Weekly Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyFocusAreas.map((focus: any, index: number) => (
                <div key={index} className="p-4 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <h5 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {focus.focus_area || `Focus Area ${index + 1}`}
                  </h5>
                  {focus.specific_actions && Array.isArray(focus.specific_actions) && (
                    <div className="space-y-2">
                      <h6 className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Specific Actions:</h6>
                      <div className="space-y-1">
                        {focus.specific_actions.map((action: string, actionIndex: number) => (
                          <div key={actionIndex} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <span className="text-sm text-indigo-700 dark:text-indigo-300">
                              {action}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {focus.success_metrics && Array.isArray(focus.success_metrics) && (
                    <div className="space-y-2 mt-3">
                      <h6 className="text-sm font-medium text-indigo-700 dark:text-indigo-400">Success Metrics:</h6>
                      <div className="space-y-1">
                        {focus.success_metrics.map((metric: string, metricIndex: number) => (
                          <div key={metricIndex} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0"></div>
                            <span className="text-sm text-indigo-700 dark:text-indigo-300">
                              {metric}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!lastAIRecommendation && (
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-800 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
                <Brain className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  No AI Analysis Available
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click the AI Analysis button above to generate a comprehensive AI summary from your trainer notes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 