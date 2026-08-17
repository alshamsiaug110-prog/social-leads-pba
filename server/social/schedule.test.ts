import { describe, expect, it } from "vitest";
import { SOCIAL_METRICS_CRON, SOCIAL_METRICS_PATH } from "./schedule";

describe("social metrics schedule contract", () => {
  it("uses the platform-managed UTC schedule for 10:00, 16:00 and 22:00 Cairo time", () => {
    expect(SOCIAL_METRICS_CRON).toBe("0 0 7,13,19 * * *");
    expect(SOCIAL_METRICS_PATH).toBe("/api/scheduled/refresh-social-metrics");
  });
});
