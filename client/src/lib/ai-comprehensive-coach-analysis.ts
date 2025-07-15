// AI Comprehensive Coach Analysis - Automatic Analysis When Trainer Notes Are Saved
import { supabase } from './supabase'
import { askOpenRouter } from './open-router-service'

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
        rationale: string
      }>
      weekly_focus: Array<{
        focus_area: string
        specific_actions: string[]
        success_metrics: string[]
      }>
      long_term_adjustments: Array<{
        adjustment: string
        timeline: string
        expected_outcome: string
      }>
    }
    coaching_recommendations: {
      training_modifications: string[]
      communication_strategy: string[]
      motivation_techniques: string[]
      goal_adjustments: string[]
    }
    next_session_plan: {
      primary_objectives: string[]
      specific_exercises: string[]
      discussion_topics: string[]
      assessments_needed: string[]
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

  const comprehensivePrompt = `You are an elite fitness coach with 20+ years of experience in personal training, sports psychology, and behavior change. You have just received updated trainer notes about a client, and you need to provide a comprehensive analysis with actionable insights and next steps.

${clientContext}

CURRENT TRAINER NOTES:
${trainerNotes}

CURRENT TO-DO ITEMS:
${todoItems}

${previousAnalysisContext}

TASK: Provide a comprehensive coaching analysis that includes:
1. Deep insights into the client's current state and progress
2. Immediate and long-term action plans
3. Specific coaching recommendations
4. Next session planning
5. Behavioral and psychological insights

Please provide your analysis in the following JSON format:

{
  "summary": {
    "key_insights": ["Insight 1", "Insight 2", "..."],
    "client_status": "Overall assessment of where the client stands",
    "progress_assessment": "Detailed progress evaluation",
    "immediate_concerns": ["Concern 1", "Concern 2", "..."],
    "positive_developments": ["Development 1", "Development 2", "..."]
  },
  "action_plan": {
    "immediate_actions": [
      {
        "action": "Specific action to take immediately",
        "priority": "High|Medium|Low",
        "timeframe": "This week|Next session|Within 2 weeks",
        "category": "Training|Nutrition|Motivation|Communication|Assessment|Other",
        "rationale": "Why this action is needed"
      }
    ],
    "weekly_focus": [
      {
        "focus_area": "Primary area of focus",
        "specific_actions": ["Action 1", "Action 2", "..."],
        "success_metrics": ["Metric 1", "Metric 2", "..."]
      }
    ],
    "long_term_adjustments": [
      {
        "adjustment": "Program or approach adjustment",
        "timeline": "When to implement",
        "expected_outcome": "What to expect"
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

GUIDELINES:
- Be specific and actionable in all recommendations
- Consider both physical and psychological aspects
- Prioritize actions based on impact and urgency
- Include evidence-based coaching strategies
- Address any red flags or concerns immediately
- Build on positive developments and successes
- Consider the client's individual circumstances and limitations
- Provide practical, implementable suggestions
- Focus on sustainable long-term progress
- Include motivational and engagement strategies
- Consider the client's goal timeline and current progress toward goals`;

  console.log('📝 Comprehensive analysis prompt prepared');
  console.log('🚀 Sending request to OpenRouter...');
  
  try {
    const aiResponse = await askOpenRouter(comprehensivePrompt);
    console.log('📊 OpenRouter Response received');
    console.log('✅ AI Response extracted');
    
    return {
      response: aiResponse,
      model: 'qwen/qwen3-8b:free',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ OpenRouter API Error:', error);
    throw new Error(`OpenRouter API Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const { data, error } = await supabase
      .from('coach_analysis')
      .insert({
        client_id: clientId,
        analysis_data: analysisData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database save error:', error);
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        console.log('📋 Creating coach_analysis table...');
        // Note: In a real app, you'd run this migration properly
        console.log('ℹ️ Table creation should be done via database migration');
      }
      throw error;
    }

    console.log('✅ Analysis saved to database');
    return data;
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
    const { data: previousAnalysis } = await supabase
      .from('coach_analysis')
      .select('analysis_data')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('📊 Previous analysis:', previousAnalysis ? 'Found' : 'Not found');

    // Generate comprehensive analysis
    console.log('🤖 Generating AI analysis...');
    const aiResponse = await generateComprehensiveAnalysis(
      trainerNotes,
      clientData,
      todoItems,
      previousAnalysis?.analysis_data
    );

    console.log('✅ AI analysis generated');

    // Parse the AI response
    let analysisData;
    try {
      const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        analysisData = JSON.parse(aiResponse.response);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      return {
        success: false,
        message: 'Failed to parse AI analysis response'
      };
    }

    // Save analysis to database
    await saveAnalysisToDatabase(clientId, analysisData);

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
    const { data, error } = await supabase
      .from('coach_analysis')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Failed to fetch analysis:', error);
      return {
        success: false,
        message: `Failed to fetch analysis: ${error.message}`
      };
    }

    if (!data) {
      return {
        success: false,
        message: 'No previous analysis found for this client'
      };
    }

    return {
      success: true,
      analysis: data,
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
  console.log('📚 Fetching coach analysis history for client:', clientId);
  
  try {
    const { data, error } = await supabase
      .from('coach_analysis')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch analysis history:', error);
      return {
        success: false,
        message: `Failed to fetch analysis history: ${error.message}`
      };
    }

    return {
      success: true,
      analyses: data || [],
      message: `Retrieved ${data?.length || 0} analyses`
    };

  } catch (error) {
    console.error('❌ Error fetching analysis history:', error);
    return {
      success: false,
      message: `Error fetching analysis history: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 