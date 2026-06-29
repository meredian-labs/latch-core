import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NpmVersionMetadata } from "../registry/metadataTypes.js";

export async function readExtractedPackageJson(extractPath: string): Promise<NpmVersionMetadata> {
  const packageJsonPath = await findExtractedPackageJsonPath(extractPath);
  const raw = await readFile(packageJsonPath, "utf8");
  return JSON.parse(raw) as NpmVersionMetadata;
}

async function findExtractedPackageJsonPath(extractPath: string): Promise<string> {
  const defaultPath = join(extractPath, "package", "package.json");
  if (await canRead(defaultPath)) {
    return defaultPath;
  }

  const entries = await readdir(extractPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageJsonPath = join(extractPath, entry.name, "package.json");
    if (await canRead(packageJsonPath)) {
      return packageJsonPath;
    }
  }

  return defaultPath;
}

async function canRead(path: string): Promise<boolean> {
  return readFile(path)
    .then(() => true)
    .catch(() => false);
}
