import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { trainerEmail } = await req.json()

    if (!trainerEmail) {
      return new Response(
        JSON.stringify({ error: 'trainerEmail is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 1: Get the Auth user ID from email
    const { data: authUser, error: authUserError } = await supabase.auth.admin.listUsers()
    
    if (authUserError) {
      console.error('Error listing users:', authUserError)
      return new Response(
        JSON.stringify({ error: 'Failed to list users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const user = authUser.users.find(u => u.email === trainerEmail)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Auth user not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 2: Delete trainer record from database
    const { error: trainerDeleteError } = await supabase
      .from('trainer')
      .delete()
      .eq('trainer_email', trainerEmail)

    if (trainerDeleteError) {
      console.error('Error deleting trainer record:', trainerDeleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete trainer record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Step 3: Delete Auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (authDeleteError) {
      console.error('Error deleting Auth user:', authDeleteError)
      // Log the orphaned Auth account for manual cleanup
      console.warn(`Trainer record deleted but Auth user remains: ${trainerEmail}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'Trainer record deleted but Auth user deletion failed' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Trainer and Auth user deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cascade delete function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 