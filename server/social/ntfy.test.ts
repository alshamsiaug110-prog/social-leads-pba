import { afterEach, describe, expect, it, vi } from "vitest";
import { sendNtfy } from "./ntfy";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const escalation = {
  type: "escalation",
  severity: "warning" as const,
  title: "New WhatsApp escalation",
  detail: "An unanswered instagram dm question was handed off to the branch team.",
  href: "/conversations",
};

describe("ntfy staff push notifications", () => {
  it("does nothing when NTFY_URL is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NTFY_URL", "");
    await expect(sendNtfy(escalation)).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("publishes a prioritised notification with a click link and token", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NTFY_URL", "https://ntfy.example.org/pba-social-desk");
    vi.stubEnv("NTFY_TOKEN", "tk_secret");
    vi.stubEnv("NTFY_CLICK_BASE", "https://desk.example.org/");
    await expect(sendNtfy(escalation)).resolves.toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://ntfy.example.org/");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tk_secret");
    expect(JSON.parse(String(init.body))).toMatchObject({
      topic: "pba-social-desk",
      title: "New WhatsApp escalation",
      priority: 4,
      click: "https://desk.example.org/conversations",
    });
  });

  it("uses maximum priority for critical failures", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NTFY_URL", "https://ntfy.sh/pba-topic");
    await sendNtfy({ ...escalation, type: "reply_failure", severity: "critical" });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(JSON.parse(String(init.body)).priority).toBe(5);
  });

  it("respects NTFY_MIN_SEVERITY", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NTFY_URL", "https://ntfy.sh/pba-topic");
    vi.stubEnv("NTFY_MIN_SEVERITY", "warning");
    await expect(sendNtfy({ ...escalation, severity: "info" })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never throws when ntfy is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    vi.stubEnv("NTFY_URL", "https://ntfy.sh/pba-topic");
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sendNtfy(escalation)).resolves.toBe(false);
  });
});
