import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readExtractedPackageJson } from "./readPackageJson.js";

describe("readExtractedPackageJson", () => {
  it("reads the standard package/package.json layout", async () => {
    const extractPath = await mkdtemp(join(tmpdir(), "latch-package-json-"));
    await mkdir(join(extractPath, "package"));
    await writeFile(join(extractPath, "package", "package.json"), JSON.stringify({ name: "zod", version: "1.0.0" }));

    await expect(readExtractedPackageJson(extractPath)).resolves.toMatchObject({
      name: "zod",
      version: "1.0.0"
    });
  });

  it("reads tarballs whose root directory is the package name", async () => {
    const extractPath = await mkdtemp(join(tmpdir(), "latch-package-json-named-"));
    await mkdir(join(extractPath, "node"));
    await writeFile(join(extractPath, "node", "package.json"), JSON.stringify({ name: "@types/node", version: "26.0.1" }));

    await expect(readExtractedPackageJson(extractPath)).resolves.toMatchObject({
      name: "@types/node",
      version: "26.0.1"
    });
  });
});
