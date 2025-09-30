import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Analytics } from "./logger";
import type { BookingRecord, SubscriptionRecord } from "./sqlite-db";

export type DbHealth = {
  connected: boolean;
  totalSubscriptions: number;
  totalBookings: number;
  error?: string;
};

class SupabaseManager {
  private static instance: SupabaseManager;
  private client: SupabaseClient | null = null;
  private initialized = false;

  static getInstance(): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager();
    }
    return SupabaseManager.instance;
  }

  private getClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const url = process.env.SUPABASE_DATABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" },
    });
    return this.client;
  }

  async initialize(): Promise<boolean> {
    try {
      const client = this.getClient();
      if (!client) {
        this.initialized = false;
        return false;
      }

      // Ping tables to ensure they exist. If they don't, we report not initialized.
      const [
        { count: subCount, error: subErr },
        { count: bookCount, error: bookErr },
      ] = await Promise.all([
        client
          .from("subscription_ids")
          .select("*", { count: "exact", head: true }),
        client
          .from("booking_requests")
          .select("*", { count: "exact", head: true }),
      ]);

      if (
        subErr?.message?.includes("relation") ||
        bookErr?.message?.includes("relation")
      ) {
        // Tables likely don't exist yet
        this.initialized = false;
        return false;
      }

      // Optionally seed if empty (idempotent)
      if ((subCount ?? 0) === 0) {
        await this.seedSampleSubscriptions();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      Analytics.trackError(error as Error, "supabase_initialize", {});
      this.initialized = false;
      return false;
    }
  }

  private async seedSampleSubscriptions() {
    const client = this.getClient();
    if (!client) return;

    const subscriptions: Array<{
      id: string;
      name: string;
      type: SubscriptionRecord["subscription_type"];
    }> = [
      { id: "HYBABC1234567", name: "Kim Taehyung", type: "premium" },
      { id: "HYBGHI5555555", name: "Jeon Jungkook", type: "premium" },
      { id: "HYBPQR8888888", name: "Jung Hoseok", type: "premium" },
      { id: "HYBAAA6666666", name: "Park Chaeyoung", type: "premium" },
      { id: "HYBDDD1234321", name: "Hanni Pham", type: "premium" },
      { id: "HYBDEF9876543", name: "Park Jimin", type: "elite" },
      { id: "HYBJKL7777777", name: "Kim Namjoon", type: "elite" },
      { id: "HYBSTU1111111", name: "Kim Seokjin", type: "elite" },
      { id: "HYBYZZ4444444", name: "Kim Jennie", type: "elite" },
      { id: "HYBCCC0000000", name: "Minji Kim", type: "elite" },
      { id: "HYBFFF9012345", name: "Haerin Kang", type: "elite" },
      { id: "B07200EF6667", name: "Radhika Verma", type: "standard" },
      { id: "HYB10250GB0680", name: "Elisabete Magalhaes", type: "standard" },
      { id: "HYB59371A4C9F2", name: "MEGHANA VAISHNAVI", type: "standard" },
    ];

    const rows = subscriptions.map((s) => ({
      subscription_id: s.id,
      user_name: s.name,
      subscription_type: s.type,
      is_active: true,
      expires_at:
        s.type === "premium"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : s.type === "elite"
            ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
            : null,
      usage_count: 0,
    }));

    const { error } = await client
      .from("subscription_ids")
      .upsert(rows, { onConflict: "subscription_id" });

    if (error) {
      Analytics.trackError(
        error as unknown as Error,
        "supabase_seed_subscriptions",
        { message: error.message },
      );
    }
  }

  async validateSubscription(subscriptionId: string): Promise<{
    isValid: boolean;
    subscriptionType?: string;
    userName?: string;
    message: string;
  }> {
    const client = this.getClient();
    if (!client) return { isValid: false, message: "Supabase not configured" };

    try {
      const normalizedId = subscriptionId.trim().toUpperCase();
      const { data, error } = await client
        .from("subscription_ids")
        .select(
          "subscription_id, user_name, subscription_type, is_active, expires_at, usage_count",
        )
        .eq("subscription_id", normalizedId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return {
          isValid: false,
          message:
            "Subscription ID not found, inactive, or expired. Please check your ID and try again.",
        };
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return {
          isValid: false,
          message: "Subscription has expired. Please renew your membership.",
        };
      }

      // Update usage count and last used timestamp (best effort)
      const { error: upErr } = await client
        .from("subscription_ids")
        .update({
          usage_count: (data.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("subscription_id", normalizedId);
      if (upErr)
        Analytics.trackError(
          upErr as unknown as Error,
          "supabase_usage_update",
          { id: normalizedId },
        );

      return {
        isValid: true,
        subscriptionType: data.subscription_type,
        userName: data.user_name,
        message: `Valid ${data.subscription_type} subscription for ${data.user_name}`,
      };
    } catch (error) {
      Analytics.trackError(error as Error, "supabase_subscription_validation", {
        subscriptionId,
      });
      return {
        isValid: false,
        message: "Service temporarily unavailable. Please try again later.",
      };
    }
  }

  async getSubscriptionTypes(): Promise<{
    subscriptionTypes: Array<{ subscription_type: string; count: string }>;
    totalActive: number;
  }> {
    const client = this.getClient();
    if (!client) return { subscriptionTypes: [], totalActive: 0 };
    try {
      const { data, error } = await client
        .from("subscription_ids")
        .select("subscription_type")
        .eq("is_active", true);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data) {
        const t = row.subscription_type as string;
        counts.set(t, (counts.get(t) || 0) + 1);
      }
      const subscriptionTypes = Array.from(counts.entries()).map(([k, v]) => ({
        subscription_type: k,
        count: String(v),
      }));
      const totalActive = Array.from(counts.values()).reduce(
        (a, b) => a + b,
        0,
      );
      return { subscriptionTypes, totalActive };
    } catch (error) {
      Analytics.trackError(
        error as Error,
        "supabase_get_subscription_types",
        {},
      );
      return { subscriptionTypes: [], totalActive: 0 };
    }
  }

  async saveBooking(
    booking: Omit<BookingRecord, "id" | "created_at">,
  ): Promise<string> {
    const client = this.getClient();
    if (!client) throw new Error("Supabase not configured");
    try {
      const row = {
        booking_id: booking.booking_id,
        celebrity: booking.celebrity,
        full_name: booking.full_name,
        email: booking.email,
        phone: booking.phone,
        organization: booking.organization ?? null,
        event_type: booking.event_type,
        event_date: booking.event_date ?? null,
        location: booking.location,
        budget_range: booking.budget_range,
        custom_amount: booking.custom_amount ?? null,
        attendees: booking.attendees,
        special_requests: booking.special_requests,
        subscription_id: booking.subscription_id ?? null,
        privacy_consent: booking.privacy_consent,
        status: booking.status,
      };
      const { error } = await client.from("booking_requests").insert(row);
      if (error) throw error;
      return booking.booking_id;
    } catch (error) {
      Analytics.trackError(error as Error, "supabase_save_booking", {
        bookingId: booking.booking_id,
      });
      throw error;
    }
  }

  async getBookings(limit = 50): Promise<BookingRecord[]> {
    const client = this.getClient();
    if (!client) return [];
    try {
      const { data, error } = await client
        .from("booking_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data as BookingRecord[]) || [];
    } catch (error) {
      Analytics.trackError(error as Error, "supabase_get_bookings", {});
      return [];
    }
  }

  async healthCheck(): Promise<DbHealth> {
    const client = this.getClient();
    if (!client) {
      return {
        connected: false,
        totalSubscriptions: 0,
        totalBookings: 0,
        error: "Supabase not configured",
      };
    }
    try {
      const [subs, books] = await Promise.all([
        client
          .from("subscription_ids")
          .select("*", { count: "exact", head: true }),
        client
          .from("booking_requests")
          .select("*", { count: "exact", head: true }),
      ]);
      const subCount = subs.count ?? 0;
      const bookCount = books.count ?? 0;
      return {
        connected: true,
        totalSubscriptions: subCount,
        totalBookings: bookCount,
      };
    } catch (error) {
      return {
        connected: false,
        totalSubscriptions: 0,
        totalBookings: 0,
        error: (error as Error).message,
      };
    }
  }
}

export const supabaseDb = SupabaseManager.getInstance();
