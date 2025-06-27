// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Client Invitation Edge Function
 * 
 * This function sends an email invitation to a client using Mailgun API.
 * It also creates a relationship between the trainer and client in the trainer_client_web table.
 * 
 * Request body should contain:
 * - clientEmail: Email address of the client to invite
 * - clientName: Name of the client (optional)
 * - trainerName: Name of the trainer sending the invitation
 * - trainerId: UUID of the trainer in the system
 * - customMessage: Optional custom message to include in the invitation email
 * 
 * Environment variables required:
 * - MAILGUN_API_KEY: API key for Mailgun
 * - MAILGUN_DOMAIN: Domain configured in Mailgun
 * - MAILGUN_FROM_EMAIL: Email address to send from (e.g., "noreply@yourapp.com")
 * - FRONTEND_URL: URL of the frontend application for signup link
 */

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Get environment variables
const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY")
const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN")
const MAILGUN_FROM_EMAIL = Deno.env.get("MAILGUN_FROM_EMAIL") || "noreply@fitcoachtrainer.com"
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://fitcoachtrainer.com"

// Create Supabase client
const createSupabaseClient = (authToken: string) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authToken}` } },
    auth: { persistSession: false }
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify Mailgun API key is configured
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      return new Response(
        JSON.stringify({ error: "Mailgun configuration is missing" }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    // Extract JWT token
    const token = authHeader.replace("Bearer ", "")
    
    // Parse request body
    const { clientEmail, clientName, trainerName, trainerId, customMessage } = await req.json()
    
    // Validate required fields
    if (!clientEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required field: clientEmail is required" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    // Create Supabase client with the user's JWT
    const supabase = createSupabaseClient(token)

    // Get the authenticated user's data to extract trainer_id
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Error getting user data:", userError)
      return new Response(
        JSON.stringify({ error: "Authentication failed" }),
        { 
          status: 401, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    // Look up trainer by email address instead of using JWT metadata
    // since the JWT metadata may contain outdated trainer_id
    const userEmail = user.email
    
    if (!userEmail) {
      console.error("No email found in user data:", user)
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    console.log("Looking up trainer by email:", userEmail)

    // Find trainer by email
    const { data: trainerData, error: trainerLookupError } = await supabase
      .from("trainer")
      .select("id, trainer_name, trainer_email")
      .eq("trainer_email", userEmail)
      .maybeSingle()
    
    console.log("Trainer lookup result:", trainerData)
    console.log("Trainer lookup error:", trainerLookupError)

    if (trainerLookupError || !trainerData) {
      // Debug: List all trainers to help with troubleshooting
      const { data: allTrainers } = await supabase
        .from("trainer")
        .select("id, trainer_name, trainer_email")
        .limit(10)
      
      console.log("All trainers in database:", allTrainers)
      
      return new Response(
        JSON.stringify({ 
          error: "Trainer not found for email", 
          email: userEmail,
          available_trainers: allTrainers?.map(t => ({ id: t.id, name: t.trainer_name, email: t.trainer_email })),
          lookup_error: trainerLookupError?.message
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    const actualTrainerId = trainerData.id
    const actualTrainerName = trainerData.trainer_name
    
    console.log("Using trainer from database lookup:", { id: actualTrainerId, name: actualTrainerName })

    // Check if client email already exists in trainer_client_web table for this trainer
    const { data: existingRelationship, error: checkError } = await supabase
      .from("trainer_client_web")
      .select("id")
      .eq("trainer_id", actualTrainerId)
      .eq("cl_email", clientEmail)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing relationship:", checkError)
      return new Response(
        JSON.stringify({ error: "Failed to check existing relationship" }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    // If relationship already exists, return error or update status
    if (existingRelationship) {
      // Update the existing relationship to resend the invitation
      const { error: updateError } = await supabase
        .from("trainer_client_web")
        .update({ status: "pending", trainer_name: actualTrainerName })
        .eq("id", existingRelationship.id)

      if (updateError) {
        console.error("Error updating relationship:", updateError)
        return new Response(
          JSON.stringify({ error: "Failed to update relationship" }),
          { 
            status: 500, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        )
      }
    } else {
      // Create new relationship in trainer_client_web table
              console.log("About to insert relationship with data:", {
          trainer_id: actualTrainerId,
          cl_email: clientEmail,
          status: "pending",
          trainer_name: actualTrainerName
        });

        const { error: insertError } = await supabase
          .from("trainer_client_web")
          .insert([
            {
              trainer_id: actualTrainerId,
              cl_email: clientEmail,
              status: "pending",
              trainer_name: actualTrainerName
            }
          ])

      if (insertError) {
        console.error("Error inserting relationship:", insertError);
        console.error("Insert error details:", JSON.stringify(insertError, null, 2));
        return new Response(
          JSON.stringify({ 
            error: "Failed to create relationship", 
            details: insertError.message,
            code: insertError.code,
            hint: insertError.hint
          }),
          { 
            status: 500, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        )
      }
    }

    // Generate signup link with trainer ID as parameter
    const signupUrl = `${FRONTEND_URL}/signup?trainer=${actualTrainerId}&email=${encodeURIComponent(clientEmail)}`

    // Prepare email content
    const clientNameDisplay = clientName || "Client"
    const trainerNameDisplay = actualTrainerName || "Your trainer"
    
    const emailSubject = `${trainerNameDisplay} has invited you to FitCoachTrainer`
    
    // HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a6cf7;">You've been invited to FitCoachTrainer!</h2>
        <p>Hello ${clientNameDisplay},</p>
        <p>${trainerNameDisplay} has invited you to join FitCoachTrainer, a platform for fitness coaching and tracking your progress.</p>
        ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}
        <p>To get started:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signupUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Create Your Account</a>
        </div>
        <p>This link will connect you directly with your trainer and set up your personalized fitness dashboard.</p>
        <p>If you have any questions, you can reply directly to this email.</p>
        <p>Looking forward to helping you achieve your fitness goals!</p>
        <p>The FitCoachTrainer Team</p>
      </div>
    `
    
    // Plain text version
    const textContent = `
      You've been invited to FitCoachTrainer!
      
      Hello ${clientNameDisplay},
      
      ${trainerNameDisplay} has invited you to join FitCoachTrainer, a platform for fitness coaching and tracking your progress.
      ${customMessage ? `\n"${customMessage}"\n` : ''}
      
      To get started, create your account by visiting:
      ${signupUrl}
      
      This link will connect you directly with your trainer and set up your personalized fitness dashboard.
      
      If you have any questions, you can reply directly to this email.
      
      Looking forward to helping you achieve your fitness goals!
      
      The FitCoachTrainer Team
    `

    // Send email via Mailgun API
    const formData = new FormData()
    formData.append("from", `FitCoachTrainer <${MAILGUN_FROM_EMAIL}>`)
    formData.append("to", clientEmail)
    formData.append("subject", emailSubject)
    formData.append("text", textContent)
    formData.append("html", htmlContent)

    // Send email via Mailgun API
    console.log("Sending email with the following details:")
    console.log("To:", clientEmail)
    console.log("Subject:", emailSubject)
    console.log("Signup URL:", signupUrl)
    console.log("Mailgun domain configured:", MAILGUN_DOMAIN)
    
    const mailgunResponse = await fetch(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      }
    )

    // Check if email was sent successfully
    if (!mailgunResponse.ok) {
      const mailgunError = await mailgunResponse.text()
      console.error("Mailgun API error:", mailgunError)
      console.error("Mailgun response status:", mailgunResponse.status)
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to send invitation email",
          mailgun_status: mailgunResponse.status,
          mailgun_error: mailgunError,
          debug_info: {
            domain: MAILGUN_DOMAIN,
            from_email: MAILGUN_FROM_EMAIL,
            api_key_present: !!MAILGUN_API_KEY
          }
        }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    const mailgunResult = await mailgunResponse.json()
    console.log("Mailgun success:", mailgunResult)

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        email: clientEmail
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    )
    
  } catch (error) {
    console.error("Unexpected error:", error)
    
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send_client_invitation' \
    --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{
      "clientEmail": "client@example.com",
      "clientName": "John Doe",
      "trainerName": "Jane Smith",
      "trainerId": "uuid-of-trainer",
      "customMessage": "I think you would benefit from our program!"
    }'

*/
