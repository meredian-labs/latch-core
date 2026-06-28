import { describe, expect, it } from "vitest";
import { findPreviousVersion } from "./resolveVersion.js";
import type { NpmPackageMetadata } from "./metadataTypes.js";

describe("findPreviousVersion", () => {
  it("uses npm metadata publish time ordering", () => {
    const metadata: NpmPackageMetadata = {
      name: "fixture",
      "dist-tags": {
        latest: "2.0.0"
      },
      versions: {
        "1.0.0": version("1.0.0"),
        "1.5.0": version("1.5.0"),
        "2.0.0": version("2.0.0")
      },
      time: {
        "2.0.0": "2026-01-03T00:00:00.000Z",
        "1.0.0": "2026-01-01T00:00:00.000Z",
        "1.5.0": "2026-01-02T00:00:00.000Z"
      }
    };

    expect(findPreviousVersion(metadata, "2.0.0")).toBe("1.5.0");
  });
});

function version(versionNumber: string) {
  return {
    name: "fixture",
    version: versionNumber,
    dist: {
      tarball: `https://example.com/fixture-${versionNumber}.tgz`
    }
  };
}
