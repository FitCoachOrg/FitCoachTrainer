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
    snapshot: {
      momentum: 'Up' | 'Flat' | 'Down'
      adherence_pct: number | null
      readiness: 'Low' | 'Medium' | 'High' | null
      one_liner: string
    }
    actions: Array<{
      text: string
      reason_tag: 'consistency' | 'recovery' | 'technique' | 'nutrition' | 'adherence'
      impact?: string
      add_to_todo_hint?: boolean
    }>
    risks: Array<{
      text: string
      mitigation: string
    }>
    next_session: Array<{
      text: string
    }>
    weekly_focus: Array<{
      text: string
      metric?: string
      target?: string
    }>
    positives: Array<{
      text: string
    }>
    metadata: {
      version: string
      generated_at: string
      data_sources: string[]
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
  console.log('📋 Preparing concise coach analysis prompt...');

  // Filter trainer notes to last 2 weeks only
  const recentNotes = filterRecentNotes(trainerNotes);

  // Create concise client context
  const clientContext = `
CLIENT: ${clientInfo.cl_name || 'Client'}
GOAL: ${clientInfo.cl_primary_goal || 'General fitness'}
EXPERIENCE: ${clientInfo.training_experience || 'Beginner'}
SESSIONS: ${clientInfo.training_days_per_week || '3'}x/week
GOAL TIMELINE: ${clientInfo.goal_timeline || '3 months'}`;

  const concisePrompt = `You are an elite fitness coach providing a concise, actionable analysis.

CLIENT CONTEXT:
${clientContext}

TRAINER NOTES (Last 2 weeks only):
${recentNotes}

TASK: Provide concise analysis in this exact JSON format:

{
  "snapshot": {
    "momentum": "Up|Flat|Down",
    "adherence_pct": number or null,
    "readiness": "Low|Medium|High|null",
    "one_liner": "≤120 char summary"
  },
  "actions": [
    {
      "text": "≤120 char action",
      "reason_tag": "consistency|recovery|technique|nutrition|adherence",
      "impact": "optional brief impact",
      "add_to_todo_hint": true|false
    }
  ],
  "risks": [
    {
      "text": "≤120 char risk",
      "mitigation": "≤100 char mitigation"
    }
  ],
  "next_session": [
    {
      "text": "≤100 char focus"
    }
  ],
  "weekly_focus": [
    {
      "text": "≤100 char focus",
      "metric": "optional metric",
      "target": "optional target"
    }
  ],
  "positives": [
    {
      "text": "≤80 char positive"
    }
  ],
  "metadata": {
    "version": "v1",
    "generated_at": "ISO timestamp",
    "data_sources": ["trainer_notes", "client_profile"]
  }
}

GUIDELINES:
- Max 3 actions, 2 risks, 3 next_session, 2 weekly_focus, 2 positives
- Use reason tags: consistency, recovery, technique, nutrition, adherence
- Focus on last 2 weeks only
- Keep all text short and actionable
- Be specific about what trainer should do next`;

  console.log('📝 Concise analysis prompt prepared');

  try {
    const response = await askCerebras(concisePrompt);
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
 * Filter trainer notes to only include entries from the last 2 weeks
 * @param notesString - Raw trainer notes (JSON string or plain text)
 * @returns Filtered notes from last 2 weeks only
 */
function filterRecentNotes(notesString: string): string {
  if (!notesString || notesString.trim().length === 0) {
    return "No trainer notes available.";
  }

  try {
    // Try to parse as JSON first (structured notes format)
    const parsedNotes = JSON.parse(notesString);
    if (Array.isArray(parsedNotes)) {
      // Filter to last 2 weeks
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const recentNotes = parsedNotes.filter((note: any) => {
        if (note.date) {
          const noteDate = new Date(note.date);
          return noteDate >= twoWeeksAgo;
        }
        return false; // Skip notes without dates
      });

      if (recentNotes.length === 0) {
        return "No trainer notes from the last 2 weeks.";
      }

      // Convert back to readable format
      return recentNotes.map((note: any) =>
        `Date: ${note.date}\nNotes: ${note.notes}`
      ).join('\n\n');
    }
  } catch (error) {
    // If not JSON, treat as plain text
    console.log('📝 Notes are plain text, returning as-is (LLM will focus on recent context)');
  }

  // For plain text, return as-is but add instruction for LLM
  return notesString;
}

/**
 * Post-process LLM analysis to enforce concise schema and caps
 * @param analysis - Raw LLM analysis output
 * @returns Processed analysis matching our schema
 */
function postProcessAnalysis(analysis: any): any {
  if (!analysis || typeof analysis !== 'object') {
    // Return minimal valid structure if LLM gave us garbage
    return {
      snapshot: { momentum: 'Flat', adherence_pct: null, readiness: null, one_liner: 'Analysis unavailable' },
      actions: [],
      risks: [],
      next_session: [],
      weekly_focus: [],
      positives: [],
      metadata: { version: 'v1', generated_at: new Date().toISOString(), data_sources: ['error_fallback'] }
    };
  }

  // Truncate function
  const truncate = (text: string, max: number) => text && text.length > max ? text.slice(0, max).trim() : text;

  // Process snapshot
  const snapshot = analysis.snapshot || {};
  const processedSnapshot = {
    momentum: ['Up', 'Flat', 'Down'].includes(snapshot.momentum) ? snapshot.momentum : 'Flat',
    adherence_pct: (typeof snapshot.adherence_pct === 'number' && snapshot.adherence_pct >= 0 && snapshot.adherence_pct <= 100)
      ? snapshot.adherence_pct : null,
    readiness: ['Low', 'Medium', 'High', null].includes(snapshot.readiness) ? snapshot.readiness : null,
    one_liner: truncate(snapshot.one_liner || 'Analysis generated', 120)
  };

  // Process actions (max 3)
  const actions = (Array.isArray(analysis.actions) ? analysis.actions : []).slice(0, 3)
    .filter((a: any) => a && a.text)
    .map((a: any) => ({
      text: truncate(a.text, 120),
      reason_tag: ['consistency', 'recovery', 'technique', 'nutrition', 'adherence'].includes(a.reason_tag)
        ? a.reason_tag : 'consistency',
      impact: a.impact ? truncate(a.impact, 60) : undefined,
      add_to_todo_hint: Boolean(a.add_to_todo_hint)
    }));

  // Process risks (max 2)
  const risks = (Array.isArray(analysis.risks) ? analysis.risks : []).slice(0, 2)
    .filter((r: any) => r && r.text && r.mitigation)
    .map((r: any) => ({
      text: truncate(r.text, 120),
      mitigation: truncate(r.mitigation, 100)
    }));

  // Process next_session (max 3)
  const next_session = (Array.isArray(analysis.next_session) ? analysis.next_session : []).slice(0, 3)
    .filter((n: any) => n && n.text)
    .map((n: any) => ({ text: truncate(n.text, 100) }));

  // Process weekly_focus (max 2)
  const weekly_focus = (Array.isArray(analysis.weekly_focus) ? analysis.weekly_focus : []).slice(0, 2)
    .filter((w: any) => w && w.text)
    .map((w: any) => ({
      text: truncate(w.text, 100),
      metric: w.metric ? truncate(w.metric, 50) : undefined,
      target: w.target ? truncate(w.target, 50) : undefined
    }));

  // Process positives (max 2)
  const positives = (Array.isArray(analysis.positives) ? analysis.positives : []).slice(0, 2)
    .filter((p: any) => p && p.text)
    .map((p: any) => ({ text: truncate(p.text, 80) }));

  // Add metadata
  const metadata = {
    version: analysis.metadata?.version || 'v1',
    generated_at: analysis.metadata?.generated_at || new Date().toISOString(),
    data_sources: Array.isArray(analysis.metadata?.data_sources)
      ? analysis.metadata.data_sources
      : ['trainer_notes', 'client_profile']
  };

  return {
    snapshot: processedSnapshot,
    actions,
    risks,
    next_session,
    weekly_focus,
    positives,
    metadata
  };
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

      // Post-process to enforce concise schema and caps
      analysisData = postProcessAnalysis(analysisData);

      console.log('✅ Parsed and post-processed analysis data:', analysisData);
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