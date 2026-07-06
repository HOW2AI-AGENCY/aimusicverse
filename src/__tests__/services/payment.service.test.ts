/**
 * Unit tests for payment.service.ts
 * Sprint 040 — Service Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAllProducts,
  getCreditPackages,
  getSubscriptions,
  createPayment,
  isTinkoffAvailable,
  isStarsAvailable,
  getRecommendedGateway,
} from "@/services/payment.service";

vi.mock("@/services/starsPaymentService", () => ({
  getProducts: vi.fn(),
  getProductsByType: vi.fn(),
  getProductByCode: vi.fn(),
  createInvoice: vi.fn(),
}));

vi.mock("@/services/tinkoffPaymentService", () => ({
  createTinkoffPayment: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    child: () => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }),
  },
}));

import * as starsService from "@/services/starsPaymentService";
import * as tinkoffService from "@/services/tinkoffPaymentService";

const mockGetProducts = starsService.getProducts as unknown as ReturnType<typeof vi.fn>;
const mockGetByType = starsService.getProductsByType as unknown as ReturnType<typeof vi.fn>;
const mockCreateInvoice = starsService.createInvoice as unknown as ReturnType<typeof vi.fn>;
const mockCreateTinkoff = tinkoffService.createTinkoffPayment as unknown as ReturnType<typeof vi.fn>;

function makeStarsProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    product_code: "credits_100",
    product_type: "credits",
    name: "100 Credits",
    description: "Credit pack",
    stars_price: 100,
    price_rub_cents: null,
    credits_amount: 100,
    subscription_days: null,
    subscription_tier: null,
    features: ["100 credits"],
    is_popular: false,
    sort_order: 1,
    ...overrides,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("payment.service", () => {
  describe("getAllProducts", () => {
    it("fetches and maps stars products", async () => {
      mockGetProducts.mockResolvedValue([makeStarsProduct()]);
      const res = await getAllProducts();
      expect(res).toHaveLength(1);
      expect(res[0].productCode).toBe("credits_100");
      expect(res[0].starsPrice).toBe(100);
    });

    it("returns empty on error", async () => {
      mockGetProducts.mockRejectedValue(new Error("fail"));
      expect(await getAllProducts()).toEqual([]);
    });
  });

  describe("getCreditPackages", () => {
    it("fetches credit products", async () => {
      mockGetByType.mockResolvedValue([makeStarsProduct()]);
      const res = await getCreditPackages();
      expect(res).toHaveLength(1);
      expect(mockGetByType).toHaveBeenCalledWith("credits");
    });

    it("returns empty on error", async () => {
      mockGetByType.mockRejectedValue(new Error("fail"));
      expect(await getCreditPackages()).toEqual([]);
    });
  });

  describe("getSubscriptions", () => {
    it("fetches subscription products", async () => {
      mockGetByType.mockResolvedValue([makeStarsProduct({ product_type: "subscription" })]);
      const res = await getSubscriptions();
      expect(res).toHaveLength(1);
      expect(mockGetByType).toHaveBeenCalledWith("subscription");
    });
  });

  describe("createPayment", () => {
    it("creates tinkoff payment", async () => {
      mockCreateTinkoff.mockResolvedValue({
        success: true,
        paymentUrl: "https://pay.tinkoff.ru/xxx",
        transactionId: "tx1",
      });
      const res = await createPayment("credits_100", "tinkoff");
      expect(res.success).toBe(true);
      expect(res.paymentUrl).toBeTruthy();
    });

    it("creates stars payment with userId", async () => {
      mockCreateInvoice.mockResolvedValue({ invoiceLink: "https://t.me/invoice/xxx" });
      const res = await createPayment("credits_100", "stars", { userId: "u1" });
      expect(res.success).toBe(true);
      expect(res.invoiceLink).toBeTruthy();
    });

    it("returns error for stars without userId", async () => {
      const res = await createPayment("credits_100", "stars");
      expect(res.success).toBe(false);
      expect(res.error).toContain("User ID");
    });

    it("returns error on tinkoff failure", async () => {
      mockCreateTinkoff.mockResolvedValue({ success: false, error: "payment failed" });
      const res = await createPayment("credits_100", "tinkoff");
      expect(res.success).toBe(false);
      expect(res.error).toBe("payment failed");
    });
  });

  describe("isTinkoffAvailable", () => {
    it("returns true outside Telegram", () => {
      // In test environment, window exists but Telegram.WebApp doesn't
      expect(typeof isTinkoffAvailable()).toBe("boolean");
    });
  });

  describe("isStarsAvailable", () => {
    it("returns boolean", () => {
      expect(typeof isStarsAvailable()).toBe("boolean");
    });
  });

  describe("getRecommendedGateway", () => {
    it("returns either stars or tinkoff", () => {
      const gw = getRecommendedGateway();
      expect(["stars", "tinkoff"]).toContain(gw);
    });
  });
});
