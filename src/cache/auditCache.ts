import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { LatchAuditReport } from "../risk/riskTypes.js";

export async function readCachedAuditReport(reportPath: string): Promise<LatchAuditReport | undefined> {
  const raw = await readFile(reportPath, "utf8").catch(() => undefined);
  if (!raw) {
    return undefined;
  }

  return JSON.parse(raw) as LatchAuditReport;
}

export async function writeCachedAuditReport(reportPath: string, report: LatchAuditReport): Promise<void> {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
}

export async function pathExists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false);
}

export function shouldReadAuditCache(noCache?: boolean): boolean {
  return !noCache;
}

export function isCachedAuditReportValid(
  cached: LatchAuditReport,
  expected: { registryUrl: string; integrity?: string }
): boolean {
  return cached.registry.url === expected.registryUrl && cached.package.integrity === expected.integrity;
}
