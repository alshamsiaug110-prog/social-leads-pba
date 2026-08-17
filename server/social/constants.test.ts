import { describe, expect, it } from "vitest";
import { BOT_COPY, escalationMessage, WHATSAPP } from "./constants";

describe("opening and escalation policies", () => {
  it("discloses the automated assistant before asking for a language choice", () => { const message = BOT_COPY.opening.en.toLowerCase(); expect(message).toContain("automated assistant"); expect(message.indexOf("automated assistant")).toBeLessThan(message.indexOf("choose your language")); });
  it("includes the exact branch link, 24-hour expectation, and Friday note on every fallback", () => { const message = escalationMessage("en", "Maadi fees"); expect(message).toContain(WHATSAPP.maadi.link); expect(message).toContain("within 24 hours"); expect(message).toContain("Friday is off"); });
});
