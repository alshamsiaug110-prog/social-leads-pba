/**
 * Push delivery of staff notifications through ntfy (https://ntfy.sh or a
 * self-hosted server). Entirely optional: when NTFY_URL is not set nothing is
 * sent. Delivery is best-effort and must never break webhook handling.
 *
 * Environment:
 *   NTFY_URL           Full topic URL, e.g. https://ntfy.sh/pba-social-desk-x7k2
 *   NTFY_TOKEN         Optional access token (Bearer) for protected topics
 *   NTFY_CLICK_BASE    Optional dashboard base URL so a tap opens the right page
 *   NTFY_MIN_SEVERITY  Optional: info (default) | warning | critical
 */
export type NtfyNotification = {
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail?: string | null;
  href?: string | null;
};

const SEVERITY_RANK = { info: 0, warning: 1, critical: 2 } as const;
const PRIORITY = { info: 3, warning: 4, critical: 5 } as const;
const TAGS = {
  info: ["information_source"],
  warning: ["warning"],
  critical: ["rotating_light"],
} as const;

function minSeverity(): keyof typeof SEVERITY_RANK {
  const value = process.env.NTFY_MIN_SEVERITY?.trim().toLowerCase();
  return value === "warning" || value === "critical" ? value : "info";
}

export function ntfyConfigured() {
  return Boolean(process.env.NTFY_URL?.trim());
}

export async function sendNtfy(input: NtfyNotification): Promise<boolean> {
  try {
    const raw = process.env.NTFY_URL?.trim();
    if (!raw) return false;
    if (SEVERITY_RANK[input.severity] < SEVERITY_RANK[minSeverity()])
      return false;
    const url = new URL(raw);
    const topic = url.pathname.replace(/^\/+|\/+$/g, "");
    if (!topic) {
      console.error("[ntfy] NTFY_URL must include a topic path.");
      return false;
    }
    const clickBase = process.env.NTFY_CLICK_BASE?.trim();
    const body: Record<string, unknown> = {
      topic,
      title: input.title,
      message: input.detail?.trim() || input.title,
      priority: PRIORITY[input.severity],
      tags: [...TAGS[input.severity], input.type],
    };
    if (clickBase && input.href)
      body.click = `${clickBase.replace(/\/+$/, "")}${input.href}`;
    const token = process.env.NTFY_TOKEN?.trim();
    const response = await fetch(`${url.origin}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error(`[ntfy] delivery rejected with HTTP ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("[ntfy] delivery failed", error);
    return false;
  }
}
