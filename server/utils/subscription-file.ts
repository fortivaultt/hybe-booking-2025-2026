import fs from "fs";
import path from "path";
import type { SubscriptionRecord } from "./sqlite-db";

export type FileSub = {
  subscription_id: string;
  user_name: string;
  subscription_type: SubscriptionRecord["subscription_type"];
  is_active: boolean;
  expires_at: string | null;
  usage_count: number;
};

let cache: Map<string, FileSub> | null = null;
let lastMtime = 0;

function resolveFile(): string {
  // Project root relative path
  return path.join(process.cwd(), "SUBSCRIPTION_IDS.md");
}

function parseFile(contents: string): Map<string, FileSub> {
  const map = new Map<string, FileSub>();
  // Track current section to assign subscription_type
  let currentType: SubscriptionRecord["subscription_type"] | null = null;

  const lines = contents.split(/\r?\n/);
  for (const line of lines) {
    const section = line.trim().toLowerCase();
    if (section.startsWith("## premium")) currentType = "premium";
    else if (section.startsWith("## elite")) currentType = "elite";
    else if (section.startsWith("## standard")) currentType = "standard";

    const m = line.match(/-\s*`([A-Za-z0-9]+)`\s*-\s*(.+)$/);
    if (m && currentType) {
      const id = m[1].toUpperCase();
      const name = m[2].trim();
      const expiresAt =
        currentType === "premium"
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : currentType === "elite"
            ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
            : null;
      map.set(id, {
        subscription_id: id,
        user_name: name,
        subscription_type: currentType,
        is_active: true,
        expires_at: expiresAt,
        usage_count: 0,
      });
    }
  }
  return map;
}

function load(): Map<string, FileSub> {
  try {
    const file = resolveFile();
    const stat = fs.statSync(file);
    if (!cache || stat.mtimeMs > lastMtime) {
      const contents = fs.readFileSync(file, "utf-8");
      cache = parseFile(contents);
      lastMtime = stat.mtimeMs;
    }
    return cache!;
  } catch {
    return cache || new Map();
  }
}

export async function validateSubscriptionFromFile(subscriptionId: string) {
  const id = subscriptionId.trim().toUpperCase();
  const map = load();
  const row = map.get(id);
  if (!row) {
    return {
      isValid: false,
      message:
        "Subscription ID not found, inactive, or expired. Please check your ID and try again.",
    };
  }
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return {
      isValid: false,
      message: "Subscription has expired. Please renew your membership.",
    };
  }
  // Update usage in memory
  row.usage_count += 1;
  return {
    isValid: true,
    subscriptionType: row.subscription_type,
    userName: row.user_name,
    message: `Valid ${row.subscription_type} subscription for ${row.user_name}`,
  };
}

export async function getSubscriptionTypesFromFile() {
  const map = load();
  const counts = new Map<string, number>();
  for (const row of map.values()) {
    if (!row.is_active) continue;
    counts.set(
      row.subscription_type,
      (counts.get(row.subscription_type) || 0) + 1,
    );
  }
  const subscriptionTypes = Array.from(counts.entries()).map(([k, v]) => ({
    subscription_type: k,
    count: String(v),
  }));
  const totalActive = Array.from(counts.values()).reduce((a, b) => a + b, 0);
  return { subscriptionTypes, totalActive };
}
