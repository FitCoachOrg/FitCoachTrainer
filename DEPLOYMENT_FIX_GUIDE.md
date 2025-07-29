# Production Deployment Fix Guide - Client Invitation System

## 🚨 **Current Issues**
1. **500 Error**: Supabase Edge Function failing
2. **400 Error**: Bad request payload
3. **404 Error**: Function not found
4. **Missing Environment Variables**: Mailgun configuration

---

## 🔧 **Step-by-Step Fix**

### **Step 1: Deploy Supabase Edge Function**

#### **1.1 Install Supabase CLI (if not installed)**
```bash
npm install -g supabase
```

#### **1.2 Login to Supabase**
```bash
supabase login
```

#### **1.3 Link to your project**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

#### **1.4 Deploy the function**
```bash
supabase functions deploy send_client_invitation
```

### **Step 2: Set Environment Variables**

#### **2.1 Set Mailgun Environment Variables**
```bash
# Set Mailgun API Key
supabase secrets set MAILGUN_API_KEY=your_mailgun_api_key_here

# Set Mailgun Domain
supabase secrets set MAILGUN_DOMAIN=your_mailgun_domain_here

# Set From Email
supabase secrets set MAILGUN_FROM_EMAIL=noreply@yourdomain.com

# Set Frontend URL
supabase secrets set FRONTEND_URL=https://yourdomain.com
```

#### **2.2 Verify Environment Variables**
```bash
supabase secrets list
```

### **Step 3: Test the Function**

#### **3.1 Test Locally First**
```bash
# Start local development
supabase start

# Test the function locally
curl -X POST http://localhost:54321/functions/v1/send_client_invitation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "Test Client",
    "trainerName": "Test Trainer",
    "trainerId": "test-uuid"
  }'
```

#### **3.2 Test in Production**
```bash
# Test production function
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send_client_invitation \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "Test Client",
    "trainerName": "Test Trainer",
    "trainerId": "test-uuid"
  }'
```

---

## 🔍 **Debugging Steps**

### **Step 1: Check Function Deployment**
```bash
# List deployed functions
supabase functions list

# Check function logs
supabase functions logs send_client_invitation
```

### **Step 2: Verify Environment Variables**
```bash
# Check if environment variables are set
supabase secrets list

# Expected output:
# MAILGUN_API_KEY: [HIDDEN]
# MAILGUN_DOMAIN: your-domain.com
# MAILGUN_FROM_EMAIL: noreply@yourdomain.com
# FRONTEND_URL: https://yourdomain.com
```

### **Step 3: Check Mailgun Configuration**

#### **3.1 Verify Mailgun Domain**
- Go to Mailgun Dashboard
- Check if your domain is verified
- Ensure domain is active and not suspended

#### **3.2 Test Mailgun API**
```bash
# Test Mailgun API directly
curl -s --user "api:YOUR_MAILGUN_API_KEY" \
  https://api.mailgun.net/v3/YOUR_DOMAIN/messages \
  -F from="FitCoachTrainer <noreply@yourdomain.com>" \
  -F to="test@example.com" \
  -F subject="Test Email" \
  -F text="This is a test email"
```

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Function Not Found (404)**
**Solution**: Deploy the function
```bash
supabase functions deploy send_client_invitation
```

### **Issue 2: Environment Variables Missing (500)**
**Solution**: Set all required environment variables
```bash
supabase secrets set MAILGUN_API_KEY=your_key
supabase secrets set MAILGUN_DOMAIN=your_domain
supabase secrets set MAILGUN_FROM_EMAIL=noreply@yourdomain.com
supabase secrets set FRONTEND_URL=https://yourdomain.com
```

### **Issue 3: CORS Issues**
**Solution**: Check CORS headers in function
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
```

### **Issue 4: Authentication Issues**
**Solution**: Verify JWT token is valid
```typescript
// In your frontend code
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

if (!token) {
  throw new Error("Authentication token not available");
}
```

---

## 🔧 **Updated Function Code (if needed)**

If you need to update the function, here's the corrected version:

```typescript
// supabase/functions/send_client_invitation/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Get environment variables with better error handling
const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY")
const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN")
const MAILGUN_FROM_EMAIL = Deno.env.get("MAILGUN_FROM_EMAIL") || "noreply@fitcoachtrainer.com"
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://fitcoachtrainer.com"

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify environment variables
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN) {
      console.error("Missing Mailgun configuration:", {
        apiKey: !!MAILGUN_API_KEY,
        domain: !!MAILGUN_DOMAIN
      })
      return new Response(
        JSON.stringify({ 
          error: "Mailgun configuration is missing",
          debug: {
            apiKeyPresent: !!MAILGUN_API_KEY,
            domainPresent: !!MAILGUN_DOMAIN
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

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    })

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Authentication error:", userError)
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

    // Find trainer by email
    const { data: trainerData, error: trainerError } = await supabase
      .from("trainer")
      .select("id, trainer_name, trainer_email")
      .eq("trainer_email", user.email)
      .maybeSingle()

    if (trainerError || !trainerData) {
      console.error("Trainer lookup error:", trainerError)
      return new Response(
        JSON.stringify({ 
          error: "Trainer not found for email",
          email: user.email,
          lookup_error: trainerError?.message
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

    // Create or update trainer-client relationship
    const { error: relationshipError } = await supabase
      .from("trainer_client_web")
      .upsert({
        trainer_id: trainerData.id,
        cl_email: clientEmail,
        status: "pending",
        trainer_name: trainerData.trainer_name
      }, {
        onConflict: 'trainer_id,cl_email'
      })

    if (relationshipError) {
      console.error("Relationship error:", relationshipError)
      return new Response(
        JSON.stringify({ error: "Failed to create relationship" }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      )
    }

    // Generate signup URL
    const signupUrl = `${FRONTEND_URL}/signup?trainer=${trainerData.id}&email=${encodeURIComponent(clientEmail)}`

    // Prepare email content
    const clientNameDisplay = clientName || "Client"
    const trainerNameDisplay = trainerData.trainer_name || "Your trainer"
    
    const emailSubject = `${trainerNameDisplay} has invited you to FitCoachTrainer`
    
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

    // Send email via Mailgun
    const formData = new FormData()
    formData.append("from", `FitCoachTrainer <${MAILGUN_FROM_EMAIL}>`)
    formData.append("to", clientEmail)
    formData.append("subject", emailSubject)
    formData.append("text", textContent)
    formData.append("html", htmlContent)

    console.log("Sending email:", {
      to: clientEmail,
      subject: emailSubject,
      domain: MAILGUN_DOMAIN,
      fromEmail: MAILGUN_FROM_EMAIL
    })
    
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

    if (!mailgunResponse.ok) {
      const mailgunError = await mailgunResponse.text()
      console.error("Mailgun error:", {
        status: mailgunResponse.status,
        error: mailgunError
      })
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to send invitation email",
          mailgun_status: mailgunResponse.status,
          mailgun_error: mailgunError
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
      JSON.stringify({ 
        error: "An unexpected error occurred", 
        details: error.message 
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
})
```

---

## ✅ **Verification Checklist**

- [ ] Supabase function deployed
- [ ] Environment variables set
- [ ] Mailgun domain verified
- [ ] Mailgun API key valid
- [ ] Frontend URL correct
- [ ] Function logs show no errors
- [ ] Test email sent successfully

---

## 🚀 **Quick Fix Commands**

```bash
# 1. Deploy function
supabase functions deploy send_client_invitation

# 2. Set environment variables
supabase secrets set MAILGUN_API_KEY=your_key
supabase secrets set MAILGUN_DOMAIN=your_domain
supabase secrets set MAILGUN_FROM_EMAIL=noreply@yourdomain.com
supabase secrets set FRONTEND_URL=https://yourdomain.com

# 3. Check deployment
supabase functions list

# 4. Check logs
supabase functions logs send_client_invitation
```

This should resolve all the production issues you're experiencing with the client invitation system. 