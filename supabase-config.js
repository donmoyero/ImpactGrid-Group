// ================================================================
//  ImpactGrid — Supabase Clients
//  config/supabase-client.js
//
//  Two projects:
//    supabase      — Creator Intelligence (trends, videos, ingestion)
//    groupSupabase — ImpactGrid Group (analytics, financial)
// ================================================================

import { createClient } from "@supabase/supabase-js";

// ── Creator Intelligence — used by ingestion.js ──
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// ── ImpactGrid Group — used by analytics/financial routes ──
export const groupSupabase = createClient(
  process.env.GROUP_SUPABASE_URL,
  process.env.GROUP_SUPABASE_SERVICE_KEY || process.env.GROUP_SUPABASE_KEY
);
