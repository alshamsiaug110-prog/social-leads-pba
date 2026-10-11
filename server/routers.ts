import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { parseFacebookInboxZip } from "./social/inboxImport";
import {
  activateFacebookPageWebhook,
  discoverMetaAccounts,
  metaReadinessWithStoredAccounts,
} from "./social/meta";
import { refreshSocialMetrics } from "./social/metrics";
import { seedInitialFaqs } from "./social/seed";
import {
  activateMetricsSchedule,
  getMetricsScheduleStatus,
} from "./social/schedule";
import {
  browserUseReadiness,
  cancelBrowserUseRun,
  createBrowserUseRun,
  getBrowserUseRun,
  getBrowserUseRunStatus,
  isBrowserUseTerminalStatus,
} from "./browserUse";
import { z } from "zod";

const faqInput = z.object({
  slug: z.string().trim().min(3).max(160),
  status: z.enum(["draft", "approved", "archived"]),
  source: z.enum(["website", "psi", "inbox", "staff"]),
  questionEn: z.string().trim(),
  questionAr: z.string().trim(),
  answerEn: z.string().trim(),
  answerAr: z.string().trim(),
  keywordsEn: z.array(z.string().trim()).max(40),
  keywordsAr: z.array(z.string().trim()).max(40),
  intentAliases: z.array(z.string().trim()).max(40),
  sortOrder: z.number().int().min(0).max(9999),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    summary: adminProcedure.query(() => db.getDashboardStats()),
    conversations: adminProcedure.query(() => db.listConversations()),
    messages: adminProcedure.query(() => db.getRecentMessageEvents()),
    integrationReadiness: adminProcedure.query(() =>
      metaReadinessWithStoredAccounts()
    ),
    refreshMetrics: adminProcedure.mutation(() => refreshSocialMetrics()),
    markConversationResolved: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => db.markConversationResolved(input.id)),
  }),
  faqs: router({
    list: adminProcedure.query(() => db.listFaqEntries()),
    create: adminProcedure
      .input(faqInput)
      .mutation(({ input }) => db.createFaqEntry(input)),
    update: adminProcedure
      .input(
        z.object({ id: z.number().int().positive(), data: faqInput.partial() })
      )
      .mutation(({ input }) => db.updateFaqEntry(input.id, input.data)),
    seedOfficial: adminProcedure.mutation(() => seedInitialFaqs()),
  }),
  imports: router({
    list: adminProcedure.query(() => db.listInboxImports()),
    candidates: adminProcedure.query(() => db.listFaqCandidates()),
    uploadFacebookInbox: adminProcedure
      .input(
        z.object({
          fileName: z.string().max(255),
          base64: z.string().min(20).max(35_000_000),
        })
      )
      .mutation(async ({ input }) => {
        const analysis = parseFacebookInboxZip(
          Buffer.from(input.base64, "base64")
        );
        const importId = await db.createInboxImport({
          fileName: input.fileName,
          fileCount: analysis.fileCount,
          totalCustomerMessages: analysis.totalCustomerMessages,
          uniqueQuestionCount: analysis.uniqueQuestionCount,
          repeatedQuestionMessages: analysis.repeatedQuestionMessages,
          repeatedQuestionRate: analysis.repeatedQuestionRate,
        });
        await db.insertFaqCandidates(importId, analysis.candidates);
        return {
          importId,
          ...analysis,
          candidates: analysis.candidates.slice(0, 20),
        };
      }),
    promoteCandidate: adminProcedure
      .input(z.object({ candidateId: z.number().int().positive() }))
      .mutation(({ input }) => db.promoteCandidateToDraft(input.candidateId)),
  }),
  schedules: router({
    metricsStatus: adminProcedure.query(() => getMetricsScheduleStatus()),
    activateMetrics: adminProcedure.mutation(({ ctx }) =>
      activateMetricsSchedule(ctx.req.headers.cookie)
    ),
  }),
  notifications: router({
    list: adminProcedure.query(() => db.listStaffNotifications()),
    markRead: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input }) => db.markStaffNotificationRead(input.id)),
    markAllRead: adminProcedure.mutation(() =>
      db.markAllStaffNotificationsRead()
    ),
  }),
  browserAutomation: router({
    readiness: adminProcedure.query(() => browserUseReadiness()),
    list: adminProcedure.query(() => db.listBrowserAutomationRuns()),
    create: adminProcedure
      .input(
        z.object({
          task: z.string().trim().min(5).max(4000),
          model: z
            .enum([
              "gpt-6-luna",
              "gpt-6-astra",
              "gpt-5.6",
              "claude-sonnet-5",
              "gemini-3.6-flash",
            ])
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const created = await createBrowserUseRun(input);
        const id = await db.createBrowserAutomationRun({
          externalRunId: created.id,
          task: input.task,
          status: created.status,
          model: created.model ?? input.model ?? null,
        });
        return db.getBrowserAutomationRun(id);
      }),
    refresh: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const run = await db.getBrowserAutomationRun(input.id);
        if (!run) throw new Error("Browser Use run not found.");
        const status = await getBrowserUseRunStatus(run.externalRunId);
        if (!isBrowserUseTerminalStatus(status.status))
          return db.updateBrowserAutomationRun(run.id, {
            status: status.status,
          });
        const summary = await getBrowserUseRun(run.externalRunId);
        const result =
          summary.result ??
          (summary.output === undefined || summary.output === null
            ? null
            : JSON.stringify(summary.output));
        return db.updateBrowserAutomationRun(run.id, {
          status: summary.status,
          result,
          error: summary.error ?? null,
          model: summary.model ?? run.model,
          totalCostUsd: summary.totalCostUsd ?? null,
        });
      }),
    cancel: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const run = await db.getBrowserAutomationRun(input.id);
        if (!run) throw new Error("Browser Use run not found.");
        if (isBrowserUseTerminalStatus(run.status)) return run;
        const cancelled = await cancelBrowserUseRun(run.externalRunId);
        return db.updateBrowserAutomationRun(run.id, {
          status: cancelled.status,
          result: cancelled.result ?? null,
          error: cancelled.error ?? null,
          model: cancelled.model ?? run.model,
          totalCostUsd: cancelled.totalCostUsd ?? null,
        });
      }),
  }),
  integrations: router({
    metadata: adminProcedure.query(() => db.getIntegrationMetadata()),
    saveMetadata: adminProcedure
      .input(
        z.object({
          facebookPageUrl: z.string().url().optional(),
          instagramHandle: z.string().trim().max(100).optional(),
          verificationNote: z.string().trim().max(500).optional(),
        })
      )
      .mutation(({ input }) => db.upsertIntegrationMetadata(input)),
    discoverAccounts: adminProcedure.mutation(() => discoverMetaAccounts()),
    activateFacebookWebhook: adminProcedure.mutation(() =>
      activateFacebookPageWebhook()
    ),
  }),
  publisher: router({
    list: adminProcedure.query(() => db.listSocialPosts()),
    createDraft: adminProcedure
      .input(
        z.object({
          platform: z.enum(["facebook", "instagram"]),
          caption: z.string().trim().min(1).max(2200),
          mediaUrl: z.string().url().optional(),
        })
      )
      .mutation(({ input }) =>
        db.createSocialPost({
          platform: input.platform,
          caption: input.caption,
          mediaUrl: input.mediaUrl ?? null,
        })
      ),
    approve: adminProcedure
      .input(z.object({ postId: z.number().int().positive() }))
      .mutation(({ input }) => db.approveSocialPost(input.postId)),
    publish: adminProcedure
      .input(z.object({ postId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const { publishSocialPost } = await import("./social/publisher");
        return publishSocialPost(input);
      }),
  }),
});
export type AppRouter = typeof appRouter;
