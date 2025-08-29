import { supabase } from '@/lib/supabase';

export interface SnapshotData {
  momentum: 'Up' | 'Flat' | 'Down';
  adherence_pct: number | null;
  readiness: 'Low' | 'Medium' | 'High' | null;
}

async function getAdherence14d(clientId: number): Promise<number | null> {
  console.log('📊 Fetching adherence_14d for client:', clientId);
  const { data, error } = await supabase
    .from('adherence_14d')
    .select('adherence_pct')
    .eq('client_id', clientId)
    .maybeSingle();
  if (error) {
    console.error('❌ adherence_14d error:', error);
    return null;
  }
  console.log('✅ adherence_14d result:', data);
  return data?.adherence_pct ?? null;
}

async function getMomentum3w(clientId: number): Promise<'Up' | 'Flat' | 'Down'> {
  const { data, error } = await supabase
    .from('momentum_3w')
    .select('sessions_delta, volume_delta')
    .eq('client_id', clientId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error('momentum_3w error:', error);
    return 'Flat';
  }
  const s = Number(data.sessions_delta || 0);
  const v = Number(data.volume_delta || 0);
  if (s > 0 && v > 0) return 'Up';
  if (s < 0 && v < 0) return 'Down';
  return 'Flat';
}

async function getReadiness7d(clientId: number): Promise<'Low' | 'Medium' | 'High' | null> {
  const { data, error } = await supabase
    .from('readiness_7d')
    .select('sleep_quality_avg, sleep_duration_avg, energy_avg')
    .eq('client_id', clientId)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error('readiness_7d error:', error);
    return null;
  }
  // Simple weighted proxy
  const sq = Number(data.sleep_quality_avg ?? 0);
  const sd = Number(data.sleep_duration_avg ?? 0);
  const en = Number(data.energy_avg ?? 0);
  // Normalize roughly to 0-100 if coming as 1-10 or hours; keep it simple
  const norm = (val: number, max: number) => Math.max(0, Math.min(100, (val / max) * 100));
  const score = 0.4 * norm(sq, 10) + 0.3 * norm(sd, 8) + 0.3 * norm(en, 10);
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

export async function fetchSnapshot(clientId: number): Promise<SnapshotData> {
  const [adherence, momentum, readiness] = await Promise.all([
    getAdherence14d(clientId),
    getMomentum3w(clientId),
    getReadiness7d(clientId),
  ]);
  return {
    momentum,
    adherence_pct: adherence,
    readiness,
  };
}


