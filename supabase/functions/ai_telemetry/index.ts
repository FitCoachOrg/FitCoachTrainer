// Supabase Edge Function: ai_telemetry
// Receives small JSON payloads and (optionally) writes to a table with additional sampling.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  // Apply server-side sampling again (10%) for non-errors
  const event = String(body?.event || '')
  const isError = event === 'ai_summary_error'
  const serverSampleRate = isError ? 1 : 0.1
  if (Math.random() > serverSampleRate) {
    return new Response('ok', { status: 200 })
  }

  // Optionally, forward to a database via service role (omitted here for minimal setup)
  // You can enable DB writes later to `ai_insights_telemetry` if needed.

  return new Response('ok', { status: 200 })
})


