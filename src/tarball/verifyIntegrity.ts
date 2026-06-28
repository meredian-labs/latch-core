import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import ssri from "ssri";

export async function verifyTarballIntegrity(path: string, integrity?: string, shasum?: string): Promise<void> {
  const data = await readFile(path);

  if (integrity) {
    const verified = ssri.checkData(data, integrity);
    if (!verified) {
      throw Object.assign(new Error("Tarball integrity verification failed."), { code: "INTEGRITY_FAILED" });
    }
    return;
  }

  if (shasum) {
    const actual = createHash("sha1").update(data).digest("hex");
    if (actual !== shasum) {
      throw Object.assign(new Error("Tarball shasum verification failed."), { code: "INTEGRITY_FAILED" });
    }
  }
}
