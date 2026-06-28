import { homedir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { safePackageName } from "../registry/packageSpec.js";

export type TarballPaths = {
  tarballPath: string;
  extractPath: string;
  reportPath: string;
};

export function getTarballPaths(
  packageName: string,
  version: string,
  options: {
    registryUrl?: string;
    integrity?: string;
    shasum?: string;
  } = {}
): TarballPaths {
  const safeName = safePackageName(packageName);
  const cacheKey = createHash("sha256")
    .update([packageName, version, options.registryUrl ?? "", options.integrity ?? options.shasum ?? "missing-integrity"].join("\0"))
    .digest("hex")
    .slice(0, 24);
  const root = join(homedir(), ".latch", "cache");
  return {
    tarballPath: join(root, "tarballs", safeName, version, `${cacheKey}.tgz`),
    extractPath: join(root, "extracted", safeName, version, cacheKey),
    reportPath: join(root, "reports", safeName, version, `${cacheKey}.json`)
  };
}
