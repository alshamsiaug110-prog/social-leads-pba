import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { parseFacebookInboxZip } from "./social/inboxImport";
import { discoverMetaAccounts, metaReadinessWithStoredAccounts } from "./social/meta";
import { refreshSocialMetrics } from "./social/metrics";
import { seedInitialFaqs } from "./social/seed";
import { activateMetricsSchedule, getMetricsScheduleStatus } from "./social/schedule";
import { z } from "zod";

const faqInput = z.object({ slug: z.string().trim().min(3).max(160), status: z.enum(["draft", "approved", "archived"]), source: z.enum(["website", "psi", "inbox", "staff"]), questionEn: z.string().trim(), questionAr: z.string().trim(), answerEn: z.string().trim(), answerAr: z.string().trim(), keywordsEn: z.array(z.string().trim()).max(40), keywordsAr: z.array(z.string().trim()).max(40), intentAliases: z.array(z.string().trim()).max(40), sortOrder: z.number().int().min(0).max(9999) });

export const appRouter = router({
  system: systemRouter,
  auth: router({ me: publicProcedure.query(opts => opts.ctx.user), logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }) }),
  dashboard: router({ summary: adminProcedure.query(() => db.getDashboardStats()), conversations: adminProcedure.query(() => db.listConversations()), messages: adminProcedure.query(() => db.getRecentMessageEvents()), integrationReadiness: adminProcedure.query(() => metaReadinessWithStoredAccounts()), refreshMetrics: adminProcedure.mutation(() => refreshSocialMetrics()), markConversationResolved: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => db.markConversationResolved(input.id)) }),
  faqs: router({ list: adminProcedure.query(() => db.listFaqEntries()), create: adminProcedure.input(faqInput).mutation(({ input }) => db.createFaqEntry(input)), update: adminProcedure.input(z.object({ id: z.number().int().positive(), data: faqInput.partial() })).mutation(({ input }) => db.updateFaqEntry(input.id, input.data)), seedOfficial: adminProcedure.mutation(() => seedInitialFaqs()) }),
  imports: router({
    list: adminProcedure.query(() => db.listInboxImports()), candidates: adminProcedure.query(() => db.listFaqCandidates()),
    uploadFacebookInbox: adminProcedure.input(z.object({ fileName: z.string().max(255), base64: z.string().min(20).max(35_000_000) })).mutation(async ({ input }) => { const analysis = parseFacebookInboxZip(Buffer.from(input.base64, "base64")); const importId = await db.createInboxImport({ fileName: input.fileName, fileCount: analysis.fileCount, totalCustomerMessages: analysis.totalCustomerMessages, uniqueQuestionCount: analysis.uniqueQuestionCount, repeatedQuestionMessages: analysis.repeatedQuestionMessages, repeatedQuestionRate: analysis.repeatedQuestionRate }); await db.insertFaqCandidates(importId, analysis.candidates); return { importId, ...analysis, candidates: analysis.candidates.slice(0, 20) }; }),
    promoteCandidate: adminProcedure.input(z.object({ candidateId: z.number().int().positive() })).mutation(({ input }) => db.promoteCandidateToDraft(input.candidateId)),
  }),
  schedules: router({
    metricsStatus: adminProcedure.query(() => getMetricsScheduleStatus()),
    activateMetrics: adminProcedure.mutation(({ ctx }) => activateMetricsSchedule(ctx.req.headers.cookie)),
  }),
  integrations: router({ metadata: adminProcedure.query(() => db.getIntegrationMetadata()), saveMetadata: adminProcedure.input(z.object({ facebookPageUrl: z.string().url().optional(), instagramHandle: z.string().trim().max(100).optional(), verificationNote: z.string().trim().max(500).optional() })).mutation(({ input }) => db.upsertIntegrationMetadata(input)), discoverAccounts: adminProcedure.mutation(() => discoverMetaAccounts()) }),
  publisher: router({
    list: adminProcedure.query(() => db.listSocialPosts()),
    createDraft: adminProcedure.input(z.object({ platform: z.enum(["facebook", "instagram"]), caption: z.string().trim().min(1).max(2200), mediaUrl: z.string().url().optional() })).mutation(({ input }) => db.createSocialPost({ platform: input.platform, caption: input.caption, mediaUrl: input.mediaUrl ?? null })),
    approve: adminProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(({ input }) => db.approveSocialPost(input.postId)),
    publish: adminProcedure.input(z.object({ postId: z.number().int().positive() })).mutation(async ({ input }) => {
      const { publishSocialPost } = await import("./social/publisher");
      return publishSocialPost(input);
    }),
  }),
});
export type AppRouter = typeof appRouter;
