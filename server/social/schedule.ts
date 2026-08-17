import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "../../shared/const";
import { createHeartbeatJob, updateHeartbeatJob } from "../_core/heartbeat";
import * as db from "../db";

export const SOCIAL_METRICS_JOB_KEY = "social-metrics-refresh";
export const SOCIAL_METRICS_CRON = "0 0 7,13,19 * * *";
export const SOCIAL_METRICS_PATH = "/api/scheduled/refresh-social-metrics";

export async function getMetricsScheduleStatus() {
  const job = await db.getSystemJob(SOCIAL_METRICS_JOB_KEY);
  return { job: job ?? null, canActivate: process.env.NODE_ENV === "production", cairoSchedule: "10:00, 16:00, 22:00 (Africa/Cairo)" };
}

export async function activateMetricsSchedule(cookieHeader: string | undefined) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Metrics scheduling is available only after the site is published.");
  }
  const sessionToken = parseCookie(cookieHeader ?? "")[COOKIE_NAME] ?? "";
  if (!sessionToken) throw new Error("A signed-in staff session is required to activate the schedule.");
  const existing = await db.getSystemJob(SOCIAL_METRICS_JOB_KEY);
  if (existing?.taskUid) {
    const updated = await updateHeartbeatJob(existing.taskUid, { cron: SOCIAL_METRICS_CRON, path: SOCIAL_METRICS_PATH, description: "PBA Facebook and Instagram metrics refresh at 10:00, 16:00 and 22:00 Cairo time.", enable: true }, sessionToken);
    await db.upsertSystemJob({ jobKey: SOCIAL_METRICS_JOB_KEY, taskUid: existing.taskUid, cronExpression: SOCIAL_METRICS_CRON, callbackPath: SOCIAL_METRICS_PATH, isEnabled: true });
    return { taskUid: existing.taskUid, nextExecutionAt: updated.nextExecutionAt ?? null };
  }
  const created = await createHeartbeatJob({ name: "pba-social-metrics-refresh", cron: SOCIAL_METRICS_CRON, path: SOCIAL_METRICS_PATH, description: "PBA Facebook and Instagram metrics refresh at 10:00, 16:00 and 22:00 Cairo time." }, sessionToken);
  await db.upsertSystemJob({ jobKey: SOCIAL_METRICS_JOB_KEY, taskUid: created.taskUid, cronExpression: SOCIAL_METRICS_CRON, callbackPath: SOCIAL_METRICS_PATH, isEnabled: true });
  return created;
}
