import { sqliteDb } from "./sqlite-db";
import { supabaseDb } from "./supabase-db";

export type DatabaseType = "supabase" | "sqlite";

function detectDbType(): DatabaseType {
  const preferSupabase = String(process.env.DB_PROVIDER || "").toLowerCase() === "supabase";
  const hasSupabaseCreds = !!process.env.SUPABASE_DATABASE_URL && !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
  if (preferSupabase || hasSupabaseCreds) return "supabase";
  return "sqlite";
}

export const dbType: DatabaseType = detectDbType();

export const db = dbType === "supabase" ? supabaseDb : sqliteDb;
