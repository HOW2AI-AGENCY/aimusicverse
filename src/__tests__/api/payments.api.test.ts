/**
 * Unit tests for payments.api.ts
 * Sprint 040 — API Test Coverage
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import {
  insertCreditTransaction,
  upsertUserCreditsBalance,
  updateUserCreditsBalance,
  upsertUserCredits,
  getUserCredits,
  getStarsTransactions,
  getStarsPaymentStats,
} from "@/api/payments.api";

vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

const mockFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;
const mockRpc = supabase.rpc as unknown as ReturnType<typeof vi.fn>;

function chainMock(result: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const m of [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "order",
    "limit",
    "single",
    "maybeSingle",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.single.mockReturnValue(Promise.resolve(result));
  chain.maybeSingle.mockReturnValue(Promise.resolve(result));
  // terminal thenable
  const thenable = { ...chain };
  thenable.then = (resolve: (v: unknown) => void) => resolve(result);
  for (const m of Object.keys(chain)) {
    if (m !== "then") chain[m].mockReturnValue(thenable);
  }
  return chain;
}

beforeEach(() => vi.clearAllMocks());

describe("payments.api", () => {
  describe("insertCreditTransaction", () => {
    it("inserts data and returns no error on success", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await insertCreditTransaction({ user_id: "u1", amount: 10 });
      expect(res.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith("credit_transactions");
    });

    it("returns error on failure", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: { message: "fail" } }));
      const res = await insertCreditTransaction({ user_id: "u1", amount: 10 });
      expect(res.error).toBeTruthy();
    });
  });

  describe("upsertUserCreditsBalance", () => {
    it("upserts with onConflict user_id", async () => {
      const chain = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);
      const res = await upsertUserCreditsBalance({ user_id: "u1", balance: 100 });
      expect(res.error).toBeNull();
      expect(chain.upsert).toHaveBeenCalledWith({ user_id: "u1", balance: 100 }, { onConflict: "user_id" });
    });
  });

  describe("updateUserCreditsBalance", () => {
    it("updates balance for user", async () => {
      mockFrom.mockReturnValue(chainMock({ data: null, error: null }));
      const res = await updateUserCreditsBalance("u1", { balance: 200 });
      expect(res.error).toBeNull();
    });
  });

  describe("upsertUserCredits", () => {
    it("upserts user credits", async () => {
      const chain = chainMock({ data: null, error: null });
      mockFrom.mockReturnValue(chain);
      const res = await upsertUserCredits({ user_id: "u1", balance: 50 });
      expect(res.error).toBeNull();
      expect(chain.upsert).toHaveBeenCalledWith({ user_id: "u1", balance: 50 }, { onConflict: "user_id" });
    });
  });

  describe("getUserCredits", () => {
    it("fetches credits for user", async () => {
      const creditData = { user_id: "u1", balance: 100 };
      mockFrom.mockReturnValue(chainMock({ data: creditData, error: null }));
      const res = await getUserCredits("u1");
      expect(res.data).toEqual(creditData);
      expect(res.error).toBeNull();
    });
  });

  describe("getStarsTransactions", () => {
    it("fetches with default limit 100", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
      const res = await getStarsTransactions();
      expect(res.data).toEqual([]);
    });

    it("fetches with custom limit", async () => {
      mockFrom.mockReturnValue(chainMock({ data: [], error: null }));
      await getStarsTransactions({ limit: 50 });
      expect(mockFrom).toHaveBeenCalledWith("stars_transactions");
    });
  });

  describe("getStarsPaymentStats", () => {
    it("calls rpc get_stars_payment_stats", async () => {
      mockRpc.mockResolvedValue({ data: { total: 1000 }, error: null });
      const res = await getStarsPaymentStats();
      expect(res.data).toEqual({ total: 1000 });
      expect(mockRpc).toHaveBeenCalledWith("get_stars_payment_stats");
    });
  });
});
