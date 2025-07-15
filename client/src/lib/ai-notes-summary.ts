// AI Notes Summary Generation with OpenRouter Integration
import { supabase } from './supabase'
import { askOpenRouter } from './open-router-service'

/**
 * Function to generate AI summary and action items using OpenRouter
 * @param trainerNotes - The content of trainer notes to summarize
 * @param clientInfo - Optional client information for context
 */
async function generateNotesSummary(trainerNotes: string, clientInfo?: any) {
  console.log('🔑 Checking for OpenRouter API key...');
  
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not found. Please add VITE_OPENROUTER_API_KEY to your .env file');
  }
  
  console.log('✅ OpenRouter API key found');
  console.log('📋 Preparing trainer notes summary prompt...');
  
  // Create context string if client info is available
  const clientContext = clientInfo ? `
Client Context:
- Name: ${clientInfo.name || clientInfo.preferredName || 'N/A'}
- Primary Goal: ${clientInfo.primaryGoal || 'N/A'}
- Training Experience: ${clientInfo.trainingExperience || 'N/A'}
- Limitations: ${clientInfo.injuriesLimitations || 'None'}
- Focus Areas: ${Array.isArray(clientInfo.focusAreas) ? clientInfo.focusAreas.join(', ') : clientInfo.focusAreas || 'None'}
` : '';

  // Use a comprehensive notes analysis prompt template
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
- Consider the client's goals and limitations in your analysis`;
  
  console.log('📝 Notes summary prompt prepared');
  
  console.log('🚀 Sending request to OpenRouter...');
  
  try {
    const aiResponse = await askOpenRouter(notesSummaryPrompt);
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
 * Function to summarize trainer notes and generate action items
 * @param trainerNotes - The trainer notes content to analyze
 * @param clientId - Optional client ID to fetch additional context
 */
export async function summarizeTrainerNotes(trainerNotes: string, clientId?: number) {
  console.log('📝 Starting trainer notes summary generation');
  console.log('📋 Notes length:', trainerNotes.length, 'characters');
  
  if (!trainerNotes || trainerNotes.trim().length === 0) {
    return {
      success: false,
      message: 'No trainer notes provided for analysis'
    };
  }

  if (trainerNotes.trim().length < 10) {
    return {
      success: false,
      message: 'Trainer notes too short for meaningful analysis (minimum 10 characters)'
    };
  }

  try {
    let clientInfo = null;

    // Optionally fetch client data for additional context
    if (clientId) {
      console.log('🔍 Fetching client context for better analysis...');
      const { data: clientData, error } = await supabase
        .from('client')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (!error && clientData) {
        clientInfo = {
          name: clientData.cl_name,
          preferredName: clientData.cl_prefer_name,
          primaryGoal: clientData.cl_primary_goal,
          trainingExperience: clientData.training_experience,
          injuriesLimitations: clientData.injuries_limitations,
          focusAreas: clientData.focus_areas
        };
        console.log('✅ Client context loaded');
      } else {
        console.log('⚠️ Could not load client context, proceeding without it');
      }
    }

    // Generate AI summary using the comprehensive notes analysis prompt
    console.log('🤖 Starting OpenRouter notes analysis...');
    
    try {
      const aiResponse = await generateNotesSummary(trainerNotes, clientInfo);
      console.log('✅ AI Summary generated successfully');
      console.log('🎯 AI Response:', aiResponse);
      
      return {
        success: true,
        message: `Successfully generated summary and action items for trainer notes`,
        originalNotes: trainerNotes,
        clientInfo: clientInfo,
        aiResponse: aiResponse
      };
    } catch (aiError) {
      console.error('❌ Error generating AI summary:', aiError);
      return {
        success: false,
        message: `Failed to generate AI summary: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`,
        originalNotes: trainerNotes,
        clientInfo: clientInfo
      };
    }

  } catch (error) {
    console.error('💥 Unexpected Error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
} 