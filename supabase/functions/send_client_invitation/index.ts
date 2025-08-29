// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Client Invitation Edge Function
 * 
 * This function sends an email invitation to a client using Mailgun API.
 * It instructs clients to download BestFitApp from app stores and register with their email.
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
 * - MAILGUN_DOMAIN: Domain configured in Mailgun (e.g., "mg.repute.cloud")
 * - MAILGUN_FROM_EMAIL: Email address to send from (e.g., "postmaster@mg.repute.cloud")
 * - FRONTEND_URL: URL of the frontend application for signup link
 */

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Get environment variables
const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY");
const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN") || "mg.repute.cloud";
const MAILGUN_FROM_EMAIL = Deno.env.get("MAILGUN_FROM_EMAIL") || "postmaster@mg.repute.cloud";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://repute.cloud";

// Create Supabase client
const createSupabaseClient = (authToken) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    },
    auth: {
      persistSession: false
    }
  });
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    // Verify Mailgun API key is configured
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      return new Response(JSON.stringify({
        error: "Mailgun configuration is missing"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: "Missing authorization header"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // Extract JWT token
    const token = authHeader.replace("Bearer ", "");

    // Parse request body
    const { clientEmail, clientName, trainerName, trainerId, customMessage } = await req.json();

    // Validate required fields
    if (!clientEmail) {
      return new Response(JSON.stringify({
        error: "Missing required field: clientEmail is required"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // Create Supabase client with the user's JWT
    const supabase = createSupabaseClient(token);

    // Get the authenticated user's data
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Error getting user data:", userError);
      return new Response(JSON.stringify({
        error: "Authentication failed"
      }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // Look up trainer by email address
    const userEmail = user.email;
    if (!userEmail) {
      console.error("No email found in user data:", user);
      return new Response(JSON.stringify({
        error: "User email not found"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    console.log("Looking up trainer by email:", userEmail);

    // Find trainer by email
    const { data: trainerData, error: trainerLookupError } = await supabase
      .from("trainer")
      .select("id, trainer_name, trainer_email")
      .eq("trainer_email", userEmail)
      .maybeSingle();

    console.log("Trainer lookup result:", trainerData);
    console.log("Trainer lookup error:", trainerLookupError);

    if (trainerLookupError || !trainerData) {
      return new Response(JSON.stringify({
        error: "Trainer not found for email",
        email: userEmail,
        lookup_error: trainerLookupError?.message
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    const actualTrainerId = trainerData.id;
    const actualTrainerName = trainerData.trainer_name;

    console.log("Using trainer from database lookup:", {
      id: actualTrainerId,
      name: actualTrainerName
    });

    // Check if client email already exists in trainer_client_web table for this trainer
    const { data: existingRelationship, error: checkError } = await supabase
      .from("trainer_client_web")
      .select("id")
      .eq("trainer_id", actualTrainerId)
      .eq("cl_email", clientEmail)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing relationship:", checkError);
      return new Response(JSON.stringify({
        error: "Failed to check existing relationship"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    // If relationship already exists, update status
    if (existingRelationship) {
      const { error: updateError } = await supabase
        .from("trainer_client_web")
        .update({
          status: "pending",
          trainer_name: actualTrainerName
        })
        .eq("id", existingRelationship.id);

      if (updateError) {
        console.error("Error updating relationship:", updateError);
        return new Response(JSON.stringify({
          error: "Failed to update relationship"
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    } else {
      // Create new relationship in trainer_client_web table
      const { error: insertError } = await supabase
        .from("trainer_client_web")
        .insert([
          {
            trainer_id: actualTrainerId,
            cl_email: clientEmail,
            status: "pending",
            trainer_name: actualTrainerName
          }
        ]);

      if (insertError) {
        console.error("Error inserting relationship:", insertError);
        return new Response(JSON.stringify({
          error: "Failed to create relationship",
          details: insertError.message
        }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
    }

    // Prepare email content for BestFitApp download
    const clientNameDisplay = clientName || "Client";
    const trainerNameDisplay = actualTrainerName || "Your trainer";
    const emailSubject = `${trainerNameDisplay} has invited you to download BestFitApp`;

    // HTML email content with app store links
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #4a6cf7;">You've been invited to BestFitApp!</h2>
        <p>Hello ${clientNameDisplay},</p>
        <p>${trainerNameDisplay} has invited you to join BestFitApp, a comprehensive fitness coaching platform.</p>
        ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}
        
        <h3 style="color: #333; margin-top: 30px;">📱 Download BestFitApp</h3>
        <p>To get started with your personalized fitness journey:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="margin-bottom: 20px;">
            <a href="https://apps.apple.com/app/bestfitapp" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 0 10px;">
              📱 Download for iOS
            </a>
          </div>
          <div>
            <a href="https://play.google.com/store/apps/details?id=com.bestfitapp" style="background-color: #01875f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 0 10px;">
              🤖 Download for Android
            </a>
          </div>
        </div>
        
        <h3 style="color: #333; margin-top: 30px;">🚀 Getting Started</h3>
        <ol style="color: #555; line-height: 1.6;">
          <li><strong>Download the app</strong> from the App Store or Google Play Store</li>
          <li><strong>Open BestFitApp</strong> and tap "Sign Up"</li>
          <li><strong>Use your email</strong>: ${clientEmail}</li>
          <li><strong>Complete onboarding</strong> by answering the fitness questions</li>
          <li><strong>Connect with your trainer</strong> and start your fitness journey!</li>
        </ol>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 30px 0;">
          <h4 style="color: #333; margin-top: 0;">💡 Pro Tips</h4>
          <ul style="color: #555; margin: 0; padding-left: 20px;">
            <li>Make sure to use the same email address: <strong>${clientEmail}</strong></li>
            <li>Take your time with the onboarding questions - they help personalize your experience</li>
            <li>Your trainer will be notified once you complete the setup</li>
          </ul>
        </div>
        
        <p>If you have any questions or need help, you can reply directly to this email or contact your trainer.</p>
        <p>Looking forward to helping you achieve your fitness goals!</p>
        <p>Best regards,<br>The BestFitApp Team</p>
      </div>
    `;

    // Plain text version
    const textContent = `
      You've been invited to BestFitApp!
      
      Hello ${clientNameDisplay},
      
      ${trainerNameDisplay} has invited you to join BestFitApp, a comprehensive fitness coaching platform.
      ${customMessage ? `\n"${customMessage}"\n` : ''}
      
      📱 DOWNLOAD BESTFITAPP
      
      iOS: https://apps.apple.com/app/bestfitapp
      Android: https://play.google.com/store/apps/details?id=com.bestfitapp
      
      🚀 GETTING STARTED
      
      1. Download the app from the App Store or Google Play Store
      2. Open BestFitApp and tap "Sign Up"
      3. Use your email: ${clientEmail}
      4. Complete onboarding by answering the fitness questions
      5. Connect with your trainer and start your fitness journey!
      
      💡 PRO TIPS
      - Make sure to use the same email address: ${clientEmail}
      - Take your time with the onboarding questions - they help personalize your experience
      - Your trainer will be notified once you complete the setup
      
      If you have any questions or need help, you can reply directly to this email or contact your trainer.
      
      Looking forward to helping you achieve your fitness goals!
      
      Best regards,
      The BestFitApp Team
    `;

    // Send email via Mailgun API
    const formData = new FormData();
    formData.append("from", `Mailgun Sandbox <${MAILGUN_FROM_EMAIL}>`);
    formData.append("to", clientEmail);
    formData.append("subject", emailSubject);
    formData.append("text", textContent);
    formData.append("html", htmlContent);

    console.log("Sending email with Mailgun:", {
      to: clientEmail,
      subject: emailSubject,
      domain: MAILGUN_DOMAIN,
      fromEmail: MAILGUN_FROM_EMAIL
    });

    const mailgunResponse = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`
      },
      body: formData
    });

    // Check if email was sent successfully
    if (!mailgunResponse.ok) {
      const mailgunError = await mailgunResponse.text();
      console.error("Mailgun API error:", mailgunError);
      console.error("Mailgun response status:", mailgunResponse.status);
      return new Response(JSON.stringify({
        error: "Failed to send invitation email",
        mailgun_status: mailgunResponse.status,
        mailgun_error: mailgunError,
        debug_info: {
          domain: MAILGUN_DOMAIN,
          from_email: MAILGUN_FROM_EMAIL,
          api_key_present: !!MAILGUN_API_KEY
        }
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }

    const mailgunResult = await mailgunResponse.json();
    console.log("Mailgun success:", mailgunResult);

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      message: "Invitation sent successfully",
      email: clientEmail
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({
      error: "An unexpected error occurred",
      details: error.message
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});

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
