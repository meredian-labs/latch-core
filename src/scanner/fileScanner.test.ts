import { describe, expect, it } from "vitest";
import { scanPackageFiles } from "./fileScanner.js";

describe("scanPackageFiles", () => {
  it("detects process, filesystem, network, environment, shell, and obfuscation patterns", async () => {
    const scan = await scanPackageFiles("fixtures/packages/child-process-package");
    const patterns = new Set(scan.suspiciousPatterns.map((pattern) => pattern.pattern));

    expect(patterns).toContain("child_process");
    expect(patterns).toContain("exec(");
    expect(patterns).toContain("spawn(");
    expect(patterns).toContain("process.env");
    expect(patterns).toContain("fs.writeFile");
    expect(patterns).toContain("fs.rm");
    expect(patterns).toContain("require(\"http\")");
    expect(patterns).toContain("fetch(");
    expect(patterns).toContain("Buffer.from(");
    expect(patterns).toContain("curl");
    expect(patterns).toContain("wget");
    expect(patterns).toContain("powershell");
    expect(patterns).toContain("chmod +x");
    expect(patterns).toContain("rm -rf");
  });

  it("detects possible obfuscation", async () => {
    const scan = await scanPackageFiles("fixtures/packages/obfuscated-package");
    expect(scan.obfuscation.level).toBe("possible");
    expect(scan.obfuscation.files).toContain("index.js");
  });

  it("skips ignored directories and binary-like assets", async () => {
    const scan = await scanPackageFiles("fixtures/packages/skip-package");
    const scannedPatterns = scan.suspiciousPatterns.map((pattern) => pattern.file);

    expect(scannedPatterns).not.toContain("node_modules/ignored/index.js");
    expect(scan.skippedFiles).toBeGreaterThan(0);
  });
});
