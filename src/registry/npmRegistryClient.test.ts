import { describe, expect, it, vi } from "vitest";
import { fetchNpmMetadata } from "./npmRegistryClient.js";

describe("fetchNpmMetadata", () => {
  it("maps thrown fetch failures to registry errors", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch failed"));

    await expect(fetchNpmMetadata("zod")).rejects.toMatchObject({
      code: "REGISTRY_ERROR",
      message: "Registry request failed: fetch failed"
    });

    fetchMock.mockRestore();
  });
});
