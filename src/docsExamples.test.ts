import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("core documentation examples", () => {
  it("keeps core README release sections", async () => {
    const readme = await readFile("README.md", "utf8");

    expect(readme).toContain("# latch-core");
    expect(readme).toContain("## What It Does");
    expect(readme).toContain("## Dogfooding");
    expect(readme).toContain("## Release");
  });

  it("parses core policy examples", async () => {
    const files = ["strict.policy.json", "relaxed.policy.json"];

    for (const file of files) {
      const raw = await readFile(`examples/policies/${file}`, "utf8");
      expect(() => JSON.parse(raw)).not.toThrow();
    }
  });
});
