import { sqliteDb } from "./sqlite-db";
import { supabaseDb } from "./supabase-db";
import { validateSubscriptionFromFile, getSubscriptionTypesFromFile } from "./subscription-file";

export type DatabaseType = "supabase" | "sqlite";

function detectDbType(): DatabaseType {
  const preferSupabase = String(process.env.DB_PROVIDER || "").toLowerCase() === "supabase";
  const hasSupabaseCreds = !!process.env.SUPABASE_DATABASE_URL && !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
  if (preferSupabase || hasSupabaseCreds) return "supabase";
  return "sqlite";
}

export const dbType: DatabaseType = detectDbType();
const currentDb = dbType === "supabase" ? supabaseDb : sqliteDb;

export const db = {
  async initialize() {
    return currentDb.initialize();
  },
  async validateSubscription(subscriptionId: string) {
    try {
      const result = await currentDb.validateSubscription(subscriptionId);
      if (result.isValid) return result;
      return await validateSubscriptionFromFile(subscriptionId);
    } catch {
      return await validateSubscriptionFromFile(subscriptionId);
    }
  },
  async getSubscriptionTypes() {
    try {
      const res = await currentDb.getSubscriptionTypes();
      if (!res.subscriptionTypes?.length) {
        return await getSubscriptionTypesFromFile();
      }
      return res;
    } catch {
      return await getSubscriptionTypesFromFile();
    }
  },
  async saveBooking(booking: any) {
    return currentDb.saveBooking(booking);
  },
  async getBookings(limit = 50) {
    return currentDb.getBookings(limit);
  },
  async healthCheck() {
    try {
      return await currentDb.healthCheck();
    } catch (e) {
      return { connected: false, totalSubscriptions: 0, totalBookings: 0, error: (e as Error).message };
    }
  },
};
