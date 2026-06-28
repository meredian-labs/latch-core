import { describe, expect, it } from "vitest";
import { diffPackageVersions } from "./versionDiff.js";

describe("diffPackageVersions", () => {
  it("compares scripts, dependencies, bin, size, file count, and scanner deltas", () => {
    const diff = diffPackageVersions({
      previousVersion: "1.0.0",
      previousPackageJson: {
        name: "fixture",
        version: "1.0.0",
        scripts: { test: "vitest" },
        dependencies: { a: "1.0.0" },
        bin: { fixture: "old.js" },
        dist: { tarball: "https://example.com/old.tgz" }
      },
      currentPackageJson: {
        name: "fixture",
        version: "1.1.0",
        scripts: { test: "vitest run", postinstall: "node install.js" },
        dependencies: { a: "1.0.0", b: "1.0.0" },
        bin: { fixture: "new.js" },
        dist: { tarball: "https://example.com/new.tgz" }
      },
      previousScan: scanWithCount(1),
      currentScan: scanWithCount(4),
      previousFileCount: 3,
      currentFileCount: 8,
      previousUnpackedSize: 100,
      currentUnpackedSize: 350
    });

    expect(diff.scriptsAdded).toEqual(["postinstall"]);
    expect(diff.scriptsChanged).toEqual(["test"]);
    expect(diff.dependenciesAdded).toEqual(["b"]);
    expect(diff.binChanged).toBe(true);
    expect(diff.fileCountDelta).toBe(5);
    expect(diff.unpackedSizeDelta).toBe(250);
    expect(diff.suspiciousPatternDelta).toBe(3);
  });
});

function scanWithCount(count: number) {
  return {
    scannedFiles: 1,
    skippedFiles: 0,
    totalFiles: 1,
    suspiciousPatterns: count
      ? [
          {
            pattern: "exec(",
            file: "index.js",
            count,
            category: "process"
          }
        ]
      : [],
    obfuscation: {
      level: "none" as const,
      files: []
    }
  };
}
