import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "./evaluatePolicy.js";
import type { LatchAuditReport } from "../risk/riskTypes.js";

describe("evaluatePolicy", () => {
  it("allows a report that satisfies policy", () => {
    const decision = evaluatePolicy(baseReport(), { minScore: 80, allowedRegistries: ["https://registry.npmjs.org"] });

    expect(decision.allowed).toBe(true);
  });

  it("does not hard-deny critical reports without a policy", () => {
    const report = baseReport();
    report.risk.score = 20;
    report.risk.level = "critical";

    const decision = evaluatePolicy(report);

    expect(decision.allowed).toBe(true);
  });

  it("denies by score", () => {
    const report = baseReport();
    report.risk.score = 70;
    report.risk.level = "medium";

    const decision = evaluatePolicy(report, { minScore: 90 });

    expect(decision.allowed).toBe(false);
    expect(decision.violations[0]).toContain("below policy minimum");
  });

  it("denies by lifecycle scripts", () => {
    const report = baseReport();
    report.execution.hasLifecycleScripts = true;
    report.execution.lifecycleScripts = [{ name: "postinstall", command: "node install.js" }];

    const decision = evaluatePolicy(report, { denyLifecycleScripts: true });

    expect(decision.allowed).toBe(false);
    expect(decision.violations[0]).toContain("Lifecycle scripts");
  });

  it("denies by package name", () => {
    const decision = evaluatePolicy(baseReport(), { denyPackages: ["fixture"] });

    expect(decision.allowed).toBe(false);
    expect(decision.violations[0]).toContain("denied by policy");
  });

  it("allows allowlisted packages despite score policy", () => {
    const report = baseReport();
    report.risk.score = 10;
    report.risk.level = "critical";

    const decision = evaluatePolicy(report, { allowPackages: ["fixture"], minScore: 90, denyCritical: true });

    expect(decision.allowed).toBe(true);
    expect(decision.trusted).toBe(true);
  });
});

function baseReport(): LatchAuditReport {
  return {
    tool: "latchx",
    generatedAt: "2026-06-28T00:00:00.000Z",
    registry: { url: "https://registry.npmjs.org" },
    package: {
      name: "fixture",
      requestedSpec: "fixture",
      resolvedVersion: "1.0.0",
      tarballUrl: "https://registry.npmjs.org/fixture/-/fixture-1.0.0.tgz",
      integrity: "sha512-example"
    },
    identity: {
      publisher: { name: "maintainer" },
      maintainers: [{ name: "maintainer" }],
      repository: "example/fixture",
      license: "MIT"
    },
    size: {},
    execution: {
      hasBin: false,
      bin: null,
      hasLifecycleScripts: false,
      lifecycleScripts: []
    },
    dependencies: {
      dependencies: 0,
      devDependencies: 0,
      optionalDependencies: 0,
      peerDependencies: 0,
      bundledDependencies: 0
    },
    scan: {
      scannedFiles: 1,
      skippedFiles: 0,
      totalFiles: 1,
      suspiciousPatterns: [],
      obfuscation: { level: "none", files: [] }
    },
    diff: {
      previousVersion: "0.9.0",
      scriptsAdded: [],
      scriptsRemoved: [],
      scriptsChanged: [],
      dependenciesAdded: [],
      dependenciesRemoved: [],
      binChanged: false
    },
    risk: {
      score: 100,
      level: "low",
      findings: []
    },
    decision: {
      recommended: "allow",
      reason: "ok"
    }
  };
}
