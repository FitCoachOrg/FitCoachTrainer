import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Service-role client for privileged deletes
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Also read the caller's auth user (for audit/authorization)
    const authHeader = req.headers.get("Authorization") ?? undefined;
    const authed = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    const body = await req.json().catch(() => ({}));
    const clientId: number | undefined = body.clientId;
    const clientEmail: string | undefined = body.clientEmail;
    const trainerIdInput: number | undefined = body.trainerId;

    if (!clientId && !clientEmail) {
      return new Response(JSON.stringify({ error: "clientId or clientEmail is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate caller and resolve trainer_id
    const { data: userData, error: userErr } = await authed.auth.getUser();
    if (userErr || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerEmail = userData.user.email!;

    const { data: trainerRows, error: trainerErr } = await admin
      .from("trainer")
      .select("id")
      .eq("trainer_email", callerEmail)
      .limit(1);
    if (trainerErr || !trainerRows || trainerRows.length === 0) {
      return new Response(JSON.stringify({ error: "Trainer not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const trainerId = trainerRows[0].id as number;
    if (trainerIdInput && trainerIdInput !== trainerId) {
      return new Response(JSON.stringify({ error: "Trainer mismatch" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If clientId provided, ensure this trainer has relationship to this client before deletion
    if (clientId && clientId > 0) {
      const { data: rel, error: relErr } = await admin
        .from("trainer_client_web")
        .select("client_id")
        .match({ trainer_id: trainerId, client_id: clientId })
        .limit(1);
      if (relErr || !rel || rel.length === 0) {
        return new Response(JSON.stringify({ error: "No access to this client" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Deletion order: child tables first, then relationship, then client
    const deletes: Array<Promise<any>> = [];

    // Helper: build filters
    const byClientId = (table: string) => admin.from(table).delete().eq("client_id", clientId as number);
    const byClientEmailRel = () =>
      admin.from("trainer_client_web").delete().match({ trainer_id: trainerId, cl_email: clientEmail as string });

    if (clientId && clientId > 0) {
      // 1: workout_info
      deletes.push(byClientId("workout_info"));
      // 2: meal_info
      deletes.push(byClientId("meal_info"));
      // 3: client_engagement_score
      deletes.push(byClientId("client_engagement_score"));
      // 4: client_target
      deletes.push(byClientId("client_target"));
      // 5: grocery_list
      deletes.push(byClientId("grocery_list"));
      // 6: login_history
      deletes.push(byClientId("login_history"));
      // 7: schedule
      deletes.push(byClientId("schedule"));
      // 8: schedule_preview
      deletes.push(byClientId("schedule_preview"));
      // 9: relationship
      deletes.push(admin.from("trainer_client_web").delete().match({ trainer_id: trainerId, client_id: clientId }));
      // 10: client
      deletes.push(admin.from("client").delete().eq("client_id", clientId));
    } else if (clientEmail) {
      // Pending invite: no client row. Only remove relationship by email
      deletes.push(byClientEmailRel());
    }

    // Execute sequentially to avoid FK constraint hiccups
    for (const op of deletes) {
      const { error } = await op;
      if (error) {
        return new Response(JSON.stringify({ error: error.message || "Delete failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


