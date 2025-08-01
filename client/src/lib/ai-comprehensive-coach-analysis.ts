// AI Comprehensive Coach Analysis - Automatic Analysis When Trainer Notes Are Saved
import { supabase } from './supabase'
// import { askOpenRouter } from './open-router-service'
import { askCerebras } from './cerebras-service'

/**
 * Interface for the comprehensive analysis response
 */
interface CoachAnalysisResponse {
  success: boolean
  message: string
  analysis?: {
    summary: {
      key_insights: string[]
      client_status: string
      progress_assessment: string
      immediate_concerns: string[]
      positive_developments: string[]
    }
    action_plan: {
      immediate_actions: Array<{
        action: string
        priority: 'High' | 'Medium' | 'Low'
        timeframe: string
        category: 'Training' | 'Nutrition' | 'Motivation' | 'Communication' | 'Assessment' | 'Other'
      }>
      weekly_focus: Array<{
        focus_area: string
        specific_actions: string[]
        success_metrics: string[]
      }>
    }
    workout_plan_changes: {
      exercise_modifications: Array<{
        exercise: string
        change: string
        timeline: string
      }>
      intensity_adjustments: Array<{
        area: string
        adjustment: string
      }>
    }
    nutritional_plan_changes: {
      dietary_adjustments: Array<{
        nutrient: string
        adjustment: string
        food_sources: string
      }>
      meal_timing_changes: Array<{
        meal: string
        change: string
      }>
    }
    recommendations: {
      training_recommendations: Array<{
        category: string
        recommendation: string
        priority: 'High' | 'Medium' | 'Low'
      }>
      nutrition_recommendations: Array<{
        category: string
        recommendation: string
        priority: 'High' | 'Medium' | 'Low'
      }>
      lifestyle_recommendations: Array<{
        category: string
        recommendation: string
        priority: 'High' | 'Medium' | 'Low'
      }>
    }
    coaching_recommendations: {
      training_modifications: string[]
      communication_strategy: string[]
      motivation_techniques: string[]
    }
    next_session_plan: {
      primary_objectives: string[]
      specific_exercises: string[]
      discussion_topics: string[]
    }
    client_insights: {
      behavioral_patterns: string[]
      engagement_level: string
      potential_barriers: string[]
      success_factors: string[]
    }
  }
  usage?: any
  model?: string
  timestamp?: string
}

/**
 * Function to generate comprehensive coach analysis using OpenRouter
 * @param trainerNotes - Current trainer notes
 * @param clientInfo - Client information and goals
 * @param todoItems - Current to-do items
 * @param previousAnalysis - Previous analysis for comparison (optional)
 */
async function generateComprehensiveAnalysis(
  trainerNotes: string,
  clientInfo: any,
  todoItems: string,
  previousAnalysis?: any
): Promise<any> {
  console.log('🔑 Checking for OpenRouter API key...');
  
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not found. Please add VITE_OPENROUTER_API_KEY to your .env file');
  }
  
  console.log('✅ OpenRouter API key found');
  console.log('📋 Preparing comprehensive coach analysis prompt...');
  
  // Create detailed client context
  const clientContext = `
CLIENT PROFILE:
- Name: ${clientInfo.cl_name || 'N/A'}
- Age: ${clientInfo.cl_age || 'N/A'}
- Sex: ${clientInfo.cl_sex || 'N/A'}
- Height: ${clientInfo.cl_height || 'N/A'} cm
- Current Weight: ${clientInfo.cl_weight || 'N/A'} kg
- Target Weight: ${clientInfo.cl_target_weight || 'N/A'} kg
- Primary Goal: ${clientInfo.cl_primary_goal || 'N/A'}
- Activity Level: ${clientInfo.cl_activity_level || 'N/A'}
- Training Experience: ${clientInfo.training_experience || 'N/A'}
- Injuries/Limitations: ${clientInfo.injuries_limitations || 'None'}
- Equipment Available: ${clientInfo.available_equipment || 'N/A'}
- Training Location: ${clientInfo.training_location || 'N/A'}
- Session Frequency: ${clientInfo.training_days_per_week || 'N/A'} days/week
- Session Duration: ${clientInfo.training_time_per_session || 'N/A'}
- Confidence Level: ${clientInfo.confidence_level || 'N/A'}/10
- Specific Outcome Desired: ${clientInfo.specific_outcome || 'N/A'}
- Goal Timeline: ${clientInfo.goal_timeline || 'N/A'}
- Sleep Hours: ${clientInfo.sleep_hours || 'N/A'}
- Stress Level: ${clientInfo.stress_level || 'N/A'}
- Member Since: ${clientInfo.created_at ? new Date(clientInfo.created_at).toLocaleDateString() : 'N/A'}
- Last Active: ${clientInfo.last_active ? new Date(clientInfo.last_active).toLocaleDateString() : 'N/A'}`;

  const previousAnalysisContext = previousAnalysis ? `
PREVIOUS ANALYSIS SUMMARY:
${JSON.stringify(previousAnalysis, null, 2)}
` : '';

  const comprehensivePrompt = `You are an elite fitness coach with 20+ years of experience in personal training, sports psychology, and behavior change. You have just received updated trainer notes about a client, and you need to provide a concise, actionable analysis with bullet-point insights.

IMPORTANT: Focus your analysis on the most recent 2 weeks of trainer notes data. If the notes span more than 2 weeks, only analyze the last 2 weeks of entries.

${clientContext}

CURRENT TRAINER NOTES (Last 2 weeks):
${trainerNotes}

CURRENT TO-DO ITEMS:
${todoItems}

${previousAnalysisContext}

TASK: Provide a concise coaching analysis with bullet-point insights that are easy for trainers to digest quickly. Focus on actionable items and key insights.

Please provide your analysis in the following JSON format:

{
  "summary": {
    "key_insights": [
      "• Brief insight point 1",
      "• Brief insight point 2",
      "• Brief insight point 3"
    ],
    "client_status": "Brief one-sentence status assessment",
    "progress_assessment": "Brief one-sentence progress summary",
    "immediate_concerns": [
      "• Concern 1",
      "• Concern 2"
    ],
    "positive_developments": [
      "• Development 1",
      "• Development 2"
    ]
  },
  "action_plan": {
    "immediate_actions": [
      {
        "action": "• Specific action item",
        "priority": "High|Medium|Low",
        "timeframe": "This week|Next session|Within 2 weeks",
        "category": "Training|Nutrition|Motivation|Communication|Assessment|Other"
      }
    ],
    "weekly_focus": [
      {
        "focus_area": "Primary focus area",
        "specific_actions": [
          "• Action 1",
          "• Action 2"
        ],
        "success_metrics": [
          "• Metric 1",
          "• Metric 2"
        ]
      }
    ]
  },
  "workout_plan_changes": {
    "exercise_modifications": [
      {
        "exercise": "Exercise name",
        "change": "• Brief change description",
        "timeline": "When to implement"
      }
    ],
    "intensity_adjustments": [
      {
        "area": "Cardio|Strength|Flexibility|Recovery",
        "adjustment": "• Brief adjustment description"
      }
    ]
  },
  "nutritional_plan_changes": {
    "dietary_adjustments": [
      {
        "nutrient": "Protein|Carbs|Fats|Vitamins|Minerals",
        "adjustment": "• Brief adjustment description",
        "food_sources": "• Food 1, Food 2"
      }
    ],
    "meal_timing_changes": [
      {
        "meal": "Breakfast|Lunch|Dinner|Snacks|Pre-workout|Post-workout",
        "change": "• Brief timing change"
      }
    ]
  },
  "recommendations": {
    "training_recommendations": [
      {
        "category": "Exercise|Progression|Recovery|Technique",
        "recommendation": "• Brief recommendation",
        "priority": "High|Medium|Low"
      }
    ],
    "nutrition_recommendations": [
      {
        "category": "Macros|Meal timing|Hydration|Supplements",
        "recommendation": "• Brief recommendation",
        "priority": "High|Medium|Low"
      }
    ],
    "lifestyle_recommendations": [
      {
        "category": "Sleep|Stress|Recovery|Habits",
        "recommendation": "• Brief recommendation",
        "priority": "High|Medium|Low"
      }
    ]
  },
  "coaching_recommendations": {
    "training_modifications": [
      "• Modification 1",
      "• Modification 2"
    ],
    "communication_strategy": [
      "• Strategy 1",
      "• Strategy 2"
    ],
    "motivation_techniques": [
      "• Technique 1",
      "• Technique 2"
    ]
  },
  "next_session_plan": {
    "primary_objectives": [
      "• Objective 1",
      "• Objective 2"
    ],
    "specific_exercises": [
      "• Exercise 1",
      "• Exercise 2"
    ],
    "discussion_topics": [
      "• Topic 1",
      "• Topic 2"
    ]
  },
  "client_insights": {
    "behavioral_patterns": [
      "• Pattern 1",
      "• Pattern 2"
    ],
    "engagement_level": "High|Medium|Low with brief explanation",
    "potential_barriers": [
      "• Barrier 1",
      "• Barrier 2"
    ],
    "success_factors": [
      "• Factor 1",
      "• Factor 2"
    ]
  }
}

GUIDELINES:
- Keep all insights concise and bullet-pointed
- Use bullet points (•) for easy scanning
- Focus on actionable items
- Limit each section to 2-4 key points
- Use brief, clear language
- Focus analysis on the most recent 2 weeks of trainer notes
- Prioritize high-impact recommendations
- Make insights immediately actionable for trainers
- Avoid lengthy explanations - prefer bullet points
- Consider the client's individual circumstances and limitations
- Focus on sustainable long-term progress
- Include motivational and engagement strategies
- Consider the client's goal timeline and current progress toward goals
- For workout plan changes, consider current fitness level, goals, and any limitations
- For nutritional changes, consider current eating habits, preferences, and goals
- Ensure all recommendations are realistic and achievable for the client`;

  console.log('📝 Comprehensive analysis prompt prepared');
  
  try {
    const response = await askCerebras(comprehensivePrompt);
    console.log('✅ AI response received');
    return response;
  } catch (error) {
    console.error('❌ Error in AI analysis:', error);
    throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Function to save analysis results to database
 * @param clientId - Client ID
 * @param analysisData - Analysis results
 */
async function saveAnalysisToDatabase(clientId: number, analysisData: any) {
  console.log('💾 Saving analysis to database...');
  
  try {
    // Get current session to get trainer ID
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
    
    if (trainerError || !trainerData?.id) {
      throw new Error("Failed to get trainer information");
    }

    console.log('🔍 Trainer ID:', trainerData.id, 'Client ID:', clientId);

    // First, check if a record exists
    const { data: existingRecord, error: checkError } = await supabase
      .from('trainer_client_web')
      .select('id')
      .eq('trainer_id', trainerData.id)
      .eq('client_id', clientId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('❌ Error checking existing record:', checkError);
      throw checkError;
    }

    let result;
    if (existingRecord) {
      // Record exists, update it
      console.log('📝 Updating existing record...');
      const { data, error } = await supabase
        .from('trainer_client_web')
        .update({ 
          ai_summary: analysisData
          // Note: updated_at column doesn't exist, using created_at for timestamp
        })
        .eq('trainer_id', trainerData.id)
        .eq('client_id', clientId)
        .select()
        .single();

      if (error) {
        console.error('❌ Database update error:', error);
        throw error;
      }
      result = data;
    } else {
      // Record doesn't exist, insert it
      console.log('📝 Creating new record...');
      const { data, error } = await supabase
        .from('trainer_client_web')
        .insert({ 
          trainer_id: trainerData.id,
          client_id: clientId,
          ai_summary: analysisData
          // Note: created_at will be automatically set by Supabase
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Database insert error:', error);
        throw error;
      }
      result = data;
    }

    console.log('✅ Analysis saved to trainer_client_web.ai_summary');
    return result;
  } catch (error) {
    console.error('❌ Failed to save analysis:', error);
    // Don't throw here - analysis can still be returned even if save fails
    return null;
  }
}

/**
 * Main function to perform comprehensive coach analysis
 * This should be called automatically when trainer notes are saved
 * @param clientId - Client ID
 * @param trainerNotes - Updated trainer notes
 * @param todoItems - Current to-do items (optional)
 */
export async function performComprehensiveCoachAnalysis(
  clientId: number,
  trainerNotes: string,
  todoItems: string = ''
): Promise<CoachAnalysisResponse> {
  console.log('🏃‍♂️ Starting comprehensive coach analysis...');
  console.log('👤 Client ID:', clientId);
  console.log('📝 Notes length:', trainerNotes.length, 'characters');
  console.log('📋 Todo items length:', todoItems.length, 'characters');
  
  // Validate input
  if (!trainerNotes || trainerNotes.trim().length === 0) {
    return {
      success: false,
      message: 'No trainer notes provided for analysis'
    };
  }

  if (trainerNotes.trim().length < 20) {
    return {
      success: false,
      message: 'Trainer notes too short for meaningful analysis (minimum 20 characters)'
    };
  }

  try {
    // Fetch client data
    console.log('🔍 Fetching client data...');
    const { data: clientData, error: clientError } = await supabase
      .from('client')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (clientError) {
      console.error('❌ Failed to fetch client data:', clientError);
      return {
        success: false,
        message: `Failed to fetch client data: ${clientError.message}`
      };
    }

    if (!clientData) {
      return {
        success: false,
        message: `No client found with ID: ${clientId}`
      };
    }

    console.log('✅ Client data loaded');

    // Fetch previous analysis for comparison (optional)
    console.log('🔍 Fetching previous analysis...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let previousAnalysis = null;
    
    if (!sessionError && sessionData?.session?.user?.email) {
      const trainerEmail = sessionData.session.user.email;
      
      // Get trainer ID
      const { data: trainerData, error: trainerError } = await supabase
        .from("trainer")
        .select("id")
        .eq("trainer_email", trainerEmail)
        .single();
      
      if (!trainerError && trainerData?.id) {
        // Fetch previous analysis from trainer_client_web table
        const { data: previousAnalysisData, error: previousAnalysisError } = await supabase
          .from('trainer_client_web')
          .select('ai_summary')
          .eq('trainer_id', trainerData.id)
          .eq('client_id', clientId)
          .single();
          
        if (!previousAnalysisError && previousAnalysisData?.ai_summary) {
          previousAnalysis = previousAnalysisData.ai_summary;
        }
      }
    }

    console.log('📊 Previous analysis:', previousAnalysis ? 'Found' : 'Not found');

    // Generate comprehensive analysis
    console.log('🤖 Generating AI analysis...');
    const aiResponse = await generateComprehensiveAnalysis(
      trainerNotes,
      clientData,
      todoItems,
      previousAnalysis
    );

    console.log('✅ AI analysis generated');

    // Parse the AI response
    let analysisData;
    try {
      console.log('🔍 Raw AI response:', aiResponse.response);
      console.log('🔍 Response type:', typeof aiResponse.response);
      
      const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('🔍 Found JSON match, parsing...');
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        console.log('🔍 No JSON match found, trying to parse entire response...');
        analysisData = JSON.parse(aiResponse.response);
      }
      
      console.log('✅ Parsed analysis data:', analysisData);
      console.log('✅ Analysis data type:', typeof analysisData);
      console.log('✅ Analysis data keys:', Object.keys(analysisData || {}));
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('❌ Raw response that failed to parse:', aiResponse.response);
      return {
        success: false,
        message: 'Failed to parse AI analysis response'
      };
    }

    // Save analysis to database
    console.log('💾 Attempting to save analysis to database...');
    const saveResult = await saveAnalysisToDatabase(clientId, analysisData);
    
    if (saveResult) {
      console.log('✅ Analysis successfully saved to database');
    } else {
      console.warn('⚠️ Analysis was generated but failed to save to database');
    }

    console.log('🎉 Comprehensive analysis completed successfully');

    return {
      success: true,
      message: 'Comprehensive coach analysis completed successfully',
      analysis: analysisData,
      usage: aiResponse.usage,
      model: aiResponse.model,
      timestamp: aiResponse.timestamp
    };

  } catch (error) {
    console.error('❌ Comprehensive analysis failed:', error);
    return {
      success: false,
      message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Function to retrieve latest analysis for a client
 * @param clientId - Client ID
 */
export async function getLatestCoachAnalysis(clientId: number) {
  console.log('🔍 Fetching latest coach analysis for client:', clientId);
  
  try {
    // Get current session to get trainer ID
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.user?.email) {
      return {
        success: false,
        message: "Not logged in"
      };
    }
    const trainerEmail = sessionData.session.user.email;
    
    // Get trainer ID
    const { data: trainerData, error: trainerError } = await supabase
      .from("trainer")
      .select("id")
      .eq("trainer_email", trainerEmail)
      .single();
    
    if (trainerError || !trainerData?.id) {
      return {
        success: false,
        message: "Failed to get trainer information"
      };
    }

    // Fetch latest analysis from trainer_client_web table
    const { data, error } = await supabase
      .from('trainer_client_web')
      .select('ai_summary, created_at')
      .eq('trainer_id', trainerData.id)
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch analysis:', error);
      return {
        success: false,
        message: `Failed to fetch analysis: ${error.message}`
      };
    }

    if (!data || !data.ai_summary) {
      return {
        success: false,
        message: 'No previous analysis found for this client'
      };
    }

    return {
      success: true,
      analysis: {
        analysis_data: data.ai_summary,
        created_at: data.created_at
      },
      message: 'Latest analysis retrieved successfully'
    };

  } catch (error) {
    console.error('❌ Error fetching analysis:', error);
    return {
      success: false,
      message: `Error fetching analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Function to get analysis history for a client
 * @param clientId - Client ID
 * @param limit - Number of analyses to retrieve (default: 10)
 */
export async function getCoachAnalysisHistory(clientId: number, limit: number = 10) {
  console.log('🔍 Fetching coach analysis history for client:', clientId);
  
  try {
    // Get current session to get trainer ID
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData?.session?.user?.email) {
      return {
        success: false,
        message: "Not logged in"
      };
    }
    const trainerEmail = sessionData.session.user.email;
    
    // Get trainer ID
    const { data: trainerData, error: trainerError } = await supabase
      .from("trainer")
      .select("id")
      .eq("trainer_email", trainerEmail)
      .single();
    
    if (trainerError || !trainerData?.id) {
      return {
        success: false,
        message: "Failed to get trainer information"
      };
    }

    // Since trainer_client_web table doesn't store multiple analyses per client,
    // we'll return the single analysis as a history entry
    const { data, error } = await supabase
      .from('trainer_client_web')
      .select('ai_summary, created_at')
      .eq('trainer_id', trainerData.id)
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error('❌ Failed to fetch analysis history:', error);
      return {
        success: false,
        message: `Failed to fetch analysis history: ${error.message}`
      };
    }

    if (!data || !data.ai_summary) {
      return {
        success: true,
        history: [],
        message: 'No analysis history found for this client'
      };
    }

    return {
      success: true,
      history: [{
        id: 'latest',
        analysis_data: data.ai_summary,
        created_at: data.created_at
      }],
      message: 'Analysis history retrieved successfully'
    };

  } catch (error) {
    console.error('❌ Error fetching analysis history:', error);
    return {
      success: false,
      message: `Error fetching analysis history: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 