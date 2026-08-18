import type { Express, Request, Response } from "express";
import { handleInboundEvent } from "./engine";
import { refreshSocialMetrics } from "./metrics";
import { metaReadiness, normalizeMetaPayload, verifyMetaSignature } from "./meta";
import { sdk } from "../_core/sdk";
import * as db from "../db";
type RawRequest = Request & { rawBody?: Buffer };

export function registerSocialRoutes(app: Express) {
  app.get("/api/meta/webhook", (req, res) => {
    const mode = req.query["hub.mode"]; const token = req.query["hub.verify_token"]; const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN && typeof challenge === "string") return res.status(200).send(challenge);
    return res.status(403).json({ error: "Webhook verification failed" });
  });
  app.post("/api/meta/webhook", async (req: RawRequest, res: Response) => {
    const readiness = metaReadiness();
    if (!readiness.hasAppSecret) return res.status(503).json({ error: "Webhook signature secret is not configured" });
    if (readiness.hasAppSecret && !verifyMetaSignature(req.rawBody, req.header("x-hub-signature-256") ?? undefined)) return res.status(403).json({ error: "Invalid webhook signature" });
    try { for (const event of normalizeMetaPayload(req.body)) await handleInboundEvent(event); return res.status(200).send("EVENT_RECEIVED"); }
    catch (error) { console.error("[Meta webhook] event processing failed", error); await db.createStaffNotification({ type: "integration_failure", severity: "critical", title: "Meta webhook processing failed", detail: "An incoming social event could not be processed. Review the integration and conversation log.", href: "/integrations" }); return res.status(500).json({ error: "Webhook processing failed" }); }
  });
  app.post("/api/scheduled/refresh-social-metrics", async (req: Request, res: Response) => {
    try { const user = await sdk.authenticateRequest(req); if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" }); const job = await db.getSystemJobByTaskUid(user.taskUid); if (!job || !job.isEnabled) return res.json({ ok: true, skipped: "orphan-or-disabled" }); return res.json({ ok: true, result: await refreshSocialMetrics(), taskUid: user.taskUid }); }
    catch (error) { await db.createStaffNotification({ type: "integration_failure", severity: "critical", title: "Scheduled metrics refresh failed", detail: "The scheduled social metrics refresh needs staff attention.", href: "/integrations" }); return res.status(500).json({ error: error instanceof Error ? error.message : "Scheduled refresh failed", timestamp: new Date().toISOString() }); }
  });
}
