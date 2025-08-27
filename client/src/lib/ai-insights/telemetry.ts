// Minimal, low-load telemetry emitter with sampling and sendBeacon fallback

type TelemetryEvent =
  | 'ai_snapshot_fetched'
  | 'ai_summary_generated'
  | 'ai_summary_error'
  | 'ai_todos_created';

interface EmitOptions {
  event: TelemetryEvent;
  payload: Record<string, unknown>;
  clientId?: number;
  trainerId?: string;
}

const TELEMETRY_ENABLED = true; // feature flag if needed
const SAMPLE_RATE = 0.2; // 20% sampling for non-error events

function shouldSample(event: TelemetryEvent): boolean {
  if (event === 'ai_summary_error') return true; // always log errors
  return Math.random() < SAMPLE_RATE;
}

export function emitTelemetry({ event, payload, clientId, trainerId }: EmitOptions) {
  if (!TELEMETRY_ENABLED) return;
  if (!shouldSample(event)) return;

  try {
    const body = JSON.stringify({
      event,
      client_id: clientId ?? null,
      trainer_id: trainerId ?? null,
      created_at: new Date().toISOString(),
      payload,
      version: 'v1'
    });

    // Prefer sendBeacon to avoid blocking UI
    const url = '/functions/v1/ai_telemetry'; // Supabase Edge Function route (configure server-side)
    if (navigator && 'sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }

    // Fallback non-blocking fetch
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => void 0);
  } catch {
    // swallow; telemetry should never throw
  }
}


