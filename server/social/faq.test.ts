import { describe, expect, it } from "vitest";
import { detectLanguageChoice, matchApprovedFaq } from "./faq";

const approvedEntry = {
  id: 1, slug: "fees", status: "approved", source: "website", questionEn: "What are the class fees?", questionAr: "ما هي رسوم الحصص؟", answerEn: "Fees vary by level.", answerAr: "تختلف الرسوم حسب المستوى.", keywordsEn: ["fees", "price"], keywordsAr: ["الرسوم", "السعر"], intentAliases: ["tuition"], sortOrder: 1, createdAt: new Date(), updatedAt: new Date(),
};

describe("controlled FAQ matching", () => {
  it("recognizes explicit English and Arabic language choices", () => { expect(detectLanguageChoice("English")).toBe("en"); expect(detectLanguageChoice("العربية")).toBe("ar"); });
  it("matches approved keywords and does not invent an answer for unrelated queries", () => { expect(matchApprovedFaq("What is the price?", [approvedEntry])?.entry.slug).toBe("fees"); expect(matchApprovedFaq("Can you diagnose my injury?", [approvedEntry])).toBeNull(); });
});

describe("whole-word keyword matching", () => {
  it("does not fire an English keyword inside a longer word", () => {
    expect(matchApprovedFaq("I have some feedback about the pricey shoes", [approvedEntry])).toBeNull();
    expect(matchApprovedFaq("How much are the fees", [approvedEntry])?.entry.slug).toBe("fees");
  });
  it("still matches Arabic keywords that carry a prefix", () => {
    expect(matchApprovedFaq("كم بالرسوم", [approvedEntry])?.entry.slug).toBe("fees");
  });
});
