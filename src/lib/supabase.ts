import { createClient, SupabaseClient } from "@supabase/supabase-js";

function getEnvOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません。.env.local を確認してください。`);
  }
  return value;
}

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvOrThrow("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    );
  }
  return _supabase;
}

let _adminClient: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      getEnvOrThrow("NEXT_PUBLIC_SUPABASE_URL"),
      getEnvOrThrow("SUPABASE_SERVICE_ROLE_KEY")
    );
  }
  return _adminClient;
}
