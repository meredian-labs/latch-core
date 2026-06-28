import { describe, expect, it } from "vitest";
import { scoreAuditReport } from "./riskScorer.js";
import type { LatchAuditReport } from "./riskTypes.js";

describe("scoreAuditReport", () => {
  it("allows a quiet package", () => {
    const scored = scoreAuditReport(baseReport());
    expect(scored.risk.score).toBe(100);
    expect(scored.risk.level).toBe("low");
    expect(scored.decision.recommended).toBe("allow");
  });

  it("penalizes install lifecycle scripts and process execution patterns", () => {
    const report = baseReport();
    report.execution.lifecycleScripts = [{ name: "postinstall", command: "node install.js" }];
    report.execution.hasLifecycleScripts = true;
    report.scan.suspiciousPatterns = [
      {
        pattern: "child_process",
        file: "install.js",
        count: 1,
        category: "process"
      }
    ];

    const scored = scoreAuditReport(report);
    expect(scored.risk.score).toBe(60);
    expect(scored.risk.level).toBe("medium");
    expect(scored.decision.recommended).toBe("warn");
  });
});

function baseReport(): Omit<LatchAuditReport, "risk" | "decision"> {
  return {
    tool: "core",
    generatedAt: "2026-06-28T00:00:00.000Z",
    registry: {
      url: "https://registry.npmjs.org"
    },
    package: {
      name: "safe-package",
      requestedSpec: "safe-package",
      resolvedVersion: "1.0.0",
      tarballUrl: "https://registry.npmjs.org/safe-package/-/safe-package-1.0.0.tgz"
    },
    identity: {
      repository: "example/safe-package",
      license: "MIT",
      maintainers: [{ name: "example" }]
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
      suspiciousPatterns: [],
      obfuscation: {
        level: "none",
        files: []
      }
    }
  };
}
