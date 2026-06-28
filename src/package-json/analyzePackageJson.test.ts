import { describe, expect, it } from "vitest";
import { readExtractedPackageJson } from "./readPackageJson.js";
import { analyzePackageJson } from "./analyzePackageJson.js";

describe("analyzePackageJson", () => {
  it("uses extracted package.json as source of truth for bin and dependencies", async () => {
    const packageJson = await readExtractedPackageJson("fixtures/packages/safe-package");
    const analysis = analyzePackageJson(packageJson);

    expect(analysis.bin).toEqual({ "safe-package": "index.js" });
    expect(analysis.dependencyCounts.dependencies).toBe(1);
  });

  it("detects all configured lifecycle scripts", async () => {
    const packageJson = await readExtractedPackageJson("fixtures/packages/postinstall-package");
    const analysis = analyzePackageJson(packageJson);

    expect(analysis.lifecycleScripts.map((script) => script.name)).toEqual([
      "preinstall",
      "install",
      "postinstall",
      "prepublish",
      "prepublishOnly",
      "prepare",
      "prepack",
      "postpack"
    ]);
  });

  it("handles scoped packages with string bin entries", async () => {
    const packageJson = await readExtractedPackageJson("fixtures/packages/scoped-package");
    const analysis = analyzePackageJson(packageJson);

    expect(packageJson.name).toBe("@scope/package");
    expect(analysis.bin).toBe("cli.js");
    expect(analysis.hasBin).toBe(true);
  });
});
