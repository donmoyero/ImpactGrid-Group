const SUPABASE_URL = "https://zoenpjjhzdzcodoqsxap.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_DWdVt8DhlzgritPEsDCEow_N-Wy-V_I";

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
