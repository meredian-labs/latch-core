import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import ssri from "ssri";
import { verifyTarballIntegrity } from "./verifyIntegrity.js";

describe("verifyTarballIntegrity", () => {
  it("verifies npm dist.integrity", async () => {
    const file = await writeFixture("integrity-data");
    const integrity = ssri.fromData("integrity-data").toString();

    await expect(verifyTarballIntegrity(file, integrity)).resolves.toBeUndefined();
  });

  it("falls back to dist.shasum", async () => {
    const data = "shasum-data";
    const file = await writeFixture(data);
    const shasum = createHash("sha1").update(data).digest("hex");

    await expect(verifyTarballIntegrity(file, undefined, shasum)).resolves.toBeUndefined();
  });

  it("rejects integrity mismatches", async () => {
    const file = await writeFixture("bad-data");

    await expect(verifyTarballIntegrity(file, undefined, "not-the-shasum")).rejects.toThrow("shasum");
  });
});

async function writeFixture(data: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "latch-integrity-"));
  const file = join(directory, "fixture.tgz");
  await writeFile(file, data);
  return file;
}
