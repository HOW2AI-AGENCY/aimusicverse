/**
 * Unit tests for profile/profile-setup.service.ts
 * Sprint 059-B — API/Service unit tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "@/integrations/supabase/client";
import { updateUserProfile } from "@/api/profiles.api";

vi.mock("@/api/profiles.api", () => ({
  updateUserProfile: vi.fn(),
}));

import { invokeGenerateProfileImage, completeProfileSetup } from "@/services/profile/profile-setup.service";

describe("profile-setup.service", () => {
  const functionsInvoke = supabase.functions.invoke as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("invokeGenerateProfileImage", () => {
    it("invokes edge function with correct params", async () => {
      functionsInvoke.mockResolvedValue({ data: { imageUrl: "https://cdn.example.com/avatar.png" }, error: null });

      const result = await invokeGenerateProfileImage({
        type: "avatar",
        prompt: "cool music avatar",
        displayName: "Test User",
      });

      expect(functionsInvoke).toHaveBeenCalledWith("generate-profile-image", {
        body: {
          type: "avatar",
          prompt: "cool music avatar",
          displayName: "Test User",
          bio: undefined,
          genres: undefined,
        },
      });
      expect(result.data?.imageUrl).toBe("https://cdn.example.com/avatar.png");
    });

    it("returns error from edge function", async () => {
      functionsInvoke.mockResolvedValue({ data: null, error: { message: "edge function failed" } });

      const result = await invokeGenerateProfileImage({ type: "banner", prompt: "test" });

      expect(result.error?.message).toBe("edge function failed");
    });
  });

  describe("completeProfileSetup", () => {
    it("splits display name and filters empty social links", async () => {
      vi.mocked(updateUserProfile).mockResolvedValue({
        id: "uid",
        first_name: "John",
        last_name: "Doe",
        display_name: "John Doe",
        username: "johndoe",
      } as never);

      const result = await completeProfileSetup({
        userId: "uid",
        displayName: "John Doe",
        username: "johndoe",
        bio: "Music lover",
        avatarUrl: "https://example.com/avatar.png",
        bannerUrl: null,
        socialLinks: { twitter: "@johndoe", website: "" },
      });

      expect(updateUserProfile).toHaveBeenCalledWith(
        "uid",
        expect.objectContaining({
          first_name: "John",
          last_name: "Doe",
          username: "johndoe",
          social_links: { twitter: "@johndoe" },
        }),
      );
    });

    it("handles single-word display name", async () => {
      vi.mocked(updateUserProfile).mockResolvedValue({
        id: "uid",
        first_name: "Mononym",
        last_name: null,
      } as never);

      const result = await completeProfileSetup({
        userId: "uid",
        displayName: "Mononym",
        username: "mononym",
        bio: "",
        avatarUrl: null,
        bannerUrl: null,
        socialLinks: {},
      });

      expect(updateUserProfile).toHaveBeenCalledWith(
        "uid",
        expect.objectContaining({
          first_name: "Mononym",
          last_name: null,
          bio: null,
        }),
      );
    });
  });
});
