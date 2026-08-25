import { describe, expect, it } from "vitest";
import { dealDeduplicationKey, formatDealAlert } from "./market-monitor-format";

const deal = {
  id: "observation-1", productId: "sv1-001", productName: "Charizard ex", imageUrl: null, productType: "CARD", localNumber: "001", source: "Mercado Livre", seller: "Loja TCG", sourceUrl: "https://example.test/listing", offerPrice: 120, referencePrice: 150, savings: 30, discountPercent: 20, dealScore: 82, confidence: "high" as const, observedAt: "2026-08-25T12:00:00.000Z", referenceObservedAt: "2026-08-25T12:00:00.000Z", referenceSources: ["Liga parceiro"], referenceListings: 4,
};

describe("market monitor", () => {
  it("deduplicates the same listing and effective offer price", () => {
    expect(dealDeduplicationKey(deal)).toBe("https://example.test/listing|120.00");
  });

  it("formats a transparent Telegram alert", () => {
    expect(formatDealAlert(deal)).toContain("20% abaixo da referência");
    expect(formatDealAlert(deal)).toContain("https://example.test/listing");
  });
});
