import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LatchPolicy } from "./policyTypes.js";

export const DEFAULT_POLICY_FILE = "latch.policy.json";

export async function loadPolicy(policyPath?: string, cwd = process.cwd()): Promise<{ policy?: LatchPolicy; path?: string }> {
  const resolvedPath = policyPath ?? join(cwd, DEFAULT_POLICY_FILE);
  const exists = await access(resolvedPath)
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    if (policyPath) {
      throw Object.assign(new Error(`Policy file not found: ${policyPath}`), { code: "POLICY_ERROR" });
    }

    return {};
  }

  const raw = await readFile(resolvedPath, "utf8");
  return {
    policy: JSON.parse(raw) as LatchPolicy,
    path: resolvedPath
  };
}
