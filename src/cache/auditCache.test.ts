import { describe, expect, it } from "vitest";
import { isCachedAuditReportValid, shouldReadAuditCache } from "./auditCache.js";
import { getTarballPaths } from "../tarball/tarballPaths.js";
import type { LatchAuditReport } from "../risk/riskTypes.js";

describe("audit cache", () => {
  it("respects --no-cache", () => {
    expect(shouldReadAuditCache()).toBe(true);
    expect(shouldReadAuditCache(false)).toBe(true);
    expect(shouldReadAuditCache(true)).toBe(false);
  });

  it("misses cache when integrity changes", () => {
    const cached = report("sha512-old");

    expect(isCachedAuditReportValid(cached, { registryUrl: "https://registry.npmjs.org", integrity: "sha512-old" })).toBe(true);
    expect(isCachedAuditReportValid(cached, { registryUrl: "https://registry.npmjs.org", integrity: "sha512-new" })).toBe(false);
  });

  it("keys tarball and report paths by integrity", () => {
    const oldPaths = getTarballPaths("fixture", "1.0.0", {
      registryUrl: "https://registry.npmjs.org",
      integrity: "sha512-old"
    });
    const newPaths = getTarballPaths("fixture", "1.0.0", {
      registryUrl: "https://registry.npmjs.org",
      integrity: "sha512-new"
    });

    expect(oldPaths.tarballPath).not.toBe(newPaths.tarballPath);
    expect(oldPaths.reportPath).not.toBe(newPaths.reportPath);
  });
});

function report(integrity: string): LatchAuditReport {
  return {
    tool: "latchx",
    generatedAt: "2026-06-28T00:00:00.000Z",
    registry: { url: "https://registry.npmjs.org" },
    package: {
      name: "fixture",
      requestedSpec: "fixture",
      resolvedVersion: "1.0.0",
      tarballUrl: "https://registry.npmjs.org/fixture/-/fixture-1.0.0.tgz",
      integrity
    },
    identity: {},
    size: {},
    execution: { hasBin: false, bin: null, hasLifecycleScripts: false, lifecycleScripts: [] },
    dependencies: { dependencies: 0, devDependencies: 0, optionalDependencies: 0, peerDependencies: 0, bundledDependencies: 0 },
    scan: { scannedFiles: 0, skippedFiles: 0, totalFiles: 0, suspiciousPatterns: [], obfuscation: { level: "none", files: [] } },
    risk: { score: 100, level: "low", findings: [] },
    decision: { recommended: "allow", reason: "ok" }
  };
}
