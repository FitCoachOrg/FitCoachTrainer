/**
 * Common Local LLM Service
 * Provides a unified interface for using local LLM models (Ollama) across the application
 */

export interface LocalLLMRequest {
  model: string
  prompt: string
  stream?: boolean
  format?: string
}

export interface LocalLLMResponse {
  response: string
  model: string
  timestamp: string
  generationTime?: number
}

/**
 * Generate response using local LLM (Ollama)
 * @param request - The request object containing model, prompt, and options
 * @returns Promise with the LLM response
 */
export async function generateLocalLLMResponse(request: LocalLLMRequest): Promise<LocalLLMResponse> {
  const startTime = Date.now()
  
  console.log(`🤖 (Local LLM) Generating response using model: ${request.model}`)
  console.log(`📝 (Local LLM) Prompt length: ${request.prompt.length} characters`)
  
  try {
    const requestBody = JSON.stringify({
      model: request.model,
      prompt: request.prompt,
      stream: request.stream || false,
      format: request.format || "json"
    })
    
    console.log(`📡 (Local LLM) Sending request to /ollama/api/generate via proxy...`)
    
    const response = await fetch("/ollama/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody
    })

    if (!response.ok) {
      throw new Error(`Local LLM request failed: ${response.status} ${response.statusText}`)
    }

    console.log(`✅ (Local LLM) Response received from server. Status: ${response.status}`)

    const aiText = await response.text()
    console.log(`📥 (Local LLM) Raw AI response content:`, aiText)

    // Parse the response
    let innerJSONText = aiText
    try {
      const outer = JSON.parse(aiText)
      if (outer && typeof outer === 'object' && outer.response) {
        innerJSONText = typeof outer.response === 'string' ? outer.response : JSON.stringify(outer.response)
      }
    } catch (e) {
      console.warn('Could not parse outer wrapper, assuming raw JSON is direct')
    }

    const endTime = Date.now()
    const generationTime = (endTime - startTime) / 1000

    console.log(`✅ (Local LLM) Successfully generated response in ${generationTime.toFixed(1)}s`)

    return {
      response: innerJSONText,
      model: request.model,
      timestamp: new Date().toISOString(),
      generationTime
    }
    
  } catch (error) {
    console.error(`❌ (Local LLM) Error generating response:`, error)
    throw new Error(`Local LLM Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate AI summary for trainer notes using local LLM
 * @param trainerNotes - The trainer notes content to analyze
 * @param clientInfo - Optional client information for context
 * @param model - The local LLM model to use (default: qwen2.5:latest)
 * @returns Promise with the AI summary response
 */
export async function generateLocalLLMNotesSummary(
  trainerNotes: string, 
  clientInfo?: any, 
  model: string = "qwen2.5:latest"
): Promise<LocalLLMResponse> {
  console.log(`📝 (Local LLM) Starting trainer notes summary generation using ${model}`)
  
  if (!trainerNotes || trainerNotes.trim().length === 0) {
    throw new Error('No trainer notes provided for analysis')
  }

  if (trainerNotes.trim().length < 10) {
    throw new Error('Trainer notes too short for meaningful analysis (minimum 10 characters)')
  }

  // Create context string if client info is available
  const clientContext = clientInfo ? `
Client Context:
- Name: ${clientInfo.name || clientInfo.preferredName || 'N/A'}
- Primary Goal: ${clientInfo.primaryGoal || 'N/A'}
- Training Experience: ${clientInfo.trainingExperience || 'N/A'}
- Limitations: ${clientInfo.injuriesLimitations || 'None'}
- Focus Areas: ${Array.isArray(clientInfo.focusAreas) ? clientInfo.focusAreas.join(', ') : clientInfo.focusAreas || 'None'}
` : '';

  // Use the same comprehensive notes analysis prompt as the OpenAI version
  const notesSummaryPrompt = `You are an expert fitness coach and notes analyst. Analyze the following trainer notes and provide a comprehensive summary with actionable insights.

${clientContext}

Trainer Notes to Analyze:
${trainerNotes}

Please provide a structured analysis in the following JSON format:

{
  "summary": {
    "key_points": ["Bullet point 1", "Bullet point 2", "..."],
    "client_progress": "Overall assessment of client progress",
    "challenges_identified": ["Challenge 1", "Challenge 2", "..."],
    "successes_highlighted": ["Success 1", "Success 2", "..."]
  },
  "action_items": {
    "immediate_actions": [
      {
        "action": "Specific action to take",
        "priority": "High|Medium|Low",
        "timeframe": "This week|Next session|Within 2 weeks|etc",
        "category": "Training|Nutrition|Motivation|Communication|Other"
      }
    ],
    "follow_up_items": [
      {
        "action": "Follow-up action",
        "priority": "High|Medium|Low",
        "timeframe": "Timeline for follow-up",
        "category": "Category"
      }
    ]
  },
  "recommendations": {
    "training_adjustments": ["Recommendation 1", "Recommendation 2", "..."],
    "communication_improvements": ["Improvement 1", "Improvement 2", "..."],
    "client_engagement": ["Engagement strategy 1", "Engagement strategy 2", "..."]
  },
  "insights": {
    "patterns_observed": ["Pattern 1", "Pattern 2", "..."],
    "areas_for_improvement": ["Area 1", "Area 2", "..."],
    "positive_trends": ["Trend 1", "Trend 2", "..."]
  },
  "next_session_focus": {
    "primary_objectives": ["Objective 1", "Objective 2", "..."],
    "specific_exercises_to_try": ["Exercise 1", "Exercise 2", "..."],
    "topics_to_discuss": ["Topic 1", "Topic 2", "..."]
  }
}

Guidelines:
- Be specific and actionable in your recommendations
- Prioritize actions based on impact and urgency
- Consider both short-term and long-term client development
- Include motivational and psychological aspects
- Focus on practical, implementable suggestions
- Identify both positive progress and areas needing attention
- Consider the client's goals and limitations in your analysis

Return ONLY the JSON object described above — no markdown, no explanations.`;

  console.log(`📝 (Local LLM) Notes summary prompt prepared`)
  
  return await generateLocalLLMResponse({
    model,
    prompt: notesSummaryPrompt,
    stream: false,
    format: "json"
  })
}

/**
 * Generate comprehensive coach analysis using local LLM
 * @param trainerNotes - The trainer notes content to analyze
 * @param clientInfo - Client information for context
 * @param todoItems - Current to-do items (optional)
 * @param model - The local LLM model to use (default: qwen2.5:latest)
 * @returns Promise with the comprehensive analysis response
 */
export async function generateLocalLLMComprehensiveAnalysis(
  trainerNotes: string,
  clientInfo: any,
  todoItems: string = '',
  model: string = "qwen2.5:latest"
): Promise<LocalLLMResponse> {
  console.log(`🏃‍♂️ (Local LLM) Starting comprehensive coach analysis using ${model}`)
  
  if (!trainerNotes || trainerNotes.trim().length === 0) {
    throw new Error('No trainer notes provided for analysis')
  }

  if (trainerNotes.trim().length < 20) {
    throw new Error('Trainer notes too short for meaningful analysis (minimum 20 characters)')
  }

  // Create comprehensive analysis prompt
  const comprehensiveAnalysisPrompt = `You are an expert fitness coach and behavioral analyst. Analyze the following trainer notes and client information to provide a comprehensive coaching analysis.

Client Information:
- Name: ${clientInfo.cl_name || clientInfo.cl_prefer_name || 'N/A'}
- Age: ${clientInfo.cl_age || 'N/A'}
- Primary Goal: ${clientInfo.cl_primary_goal || 'N/A'}
- Training Experience: ${clientInfo.training_experience || 'N/A'}
- Activity Level: ${clientInfo.cl_activity_level || 'N/A'}
- Specific Outcome: ${clientInfo.specific_outcome || 'N/A'}
- Goal Timeline: ${clientInfo.goal_timeline || 'N/A'}
- Confidence Level: ${clientInfo.confidence_level || 'N/A'}
- Obstacles: ${clientInfo.obstacles || 'None'}
- Training Days Per Week: ${clientInfo.training_days_per_week || 'N/A'}
- Training Time Per Session: ${clientInfo.training_time_per_session || 'N/A'}
- Available Equipment: ${Array.isArray(clientInfo.available_equipment) ? clientInfo.available_equipment.join(', ') : clientInfo.available_equipment || 'Bodyweight only'}
- Injuries/Limitations: ${clientInfo.injuries_limitations || 'None'}
- Focus Areas: ${Array.isArray(clientInfo.focus_areas) ? clientInfo.focus_areas.join(', ') : clientInfo.focus_areas || 'None'}
- Motivation Style: ${clientInfo.motivation_style || 'N/A'}
- Sleep Hours: ${clientInfo.sleep_hours || 'N/A'}
- Stress Level: ${clientInfo.cl_stress || 'N/A'}

Trainer Notes to Analyze:
${trainerNotes}

${todoItems ? `Current To-Do Items:\n${todoItems}\n` : ''}

Please provide a comprehensive analysis in the following JSON format:

{
  "summary": {
    "key_insights": ["Insight 1", "Insight 2", "..."],
    "client_status": "Overall assessment of client's current status",
    "progress_assessment": "Detailed evaluation of client's progress",
    "immediate_concerns": ["Concern 1", "Concern 2", "..."],
    "positive_developments": ["Development 1", "Development 2", "..."]
  },
  "action_plan": {
    "immediate_actions": [
      {
        "action": "Specific action to take",
        "priority": "High|Medium|Low",
        "timeframe": "This week|Next session|Within 2 weeks|etc",
        "category": "Training|Nutrition|Motivation|Communication|Assessment|Other",
        "rationale": "Why this action is important"
      }
    ],
    "weekly_focus": [
      {
        "focus_area": "Area to focus on",
        "specific_actions": ["Action 1", "Action 2", "..."],
        "success_metrics": ["Metric 1", "Metric 2", "..."]
      }
    ],
    "long_term_adjustments": [
      {
        "adjustment": "Long-term adjustment needed",
        "timeline": "When to implement",
        "expected_outcome": "Expected result"
      }
    ]
  },
  "coaching_recommendations": {
    "training_modifications": ["Modification 1", "Modification 2", "..."],
    "communication_strategy": ["Strategy 1", "Strategy 2", "..."],
    "motivation_techniques": ["Technique 1", "Technique 2", "..."],
    "goal_adjustments": ["Adjustment 1", "Adjustment 2", "..."]
  },
  "next_session_plan": {
    "primary_objectives": ["Objective 1", "Objective 2", "..."],
    "specific_exercises": ["Exercise 1", "Exercise 2", "..."],
    "discussion_topics": ["Topic 1", "Topic 2", "..."],
    "assessments_needed": ["Assessment 1", "Assessment 2", "..."]
  },
  "client_insights": {
    "behavioral_patterns": ["Pattern 1", "Pattern 2", "..."],
    "engagement_level": "High|Medium|Low with explanation",
    "potential_barriers": ["Barrier 1", "Barrier 2", "..."],
    "success_factors": ["Factor 1", "Factor 2", "..."]
  }
}

Guidelines:
- Be specific and actionable in your recommendations
- Prioritize actions based on impact and urgency
- Consider both short-term and long-term client development
- Include motivational and psychological aspects
- Focus on practical, implementable suggestions
- Identify both positive progress and areas needing attention
- Consider the client's goals, limitations, and personal circumstances
- Provide evidence-based recommendations
- Consider the client's motivation style and engagement patterns

Return ONLY the JSON object described above — no markdown, no explanations.`;

  console.log(`📝 (Local LLM) Comprehensive analysis prompt prepared`)
  
  return await generateLocalLLMResponse({
    model,
    prompt: comprehensiveAnalysisPrompt,
    stream: false,
    format: "json"
  })
} 