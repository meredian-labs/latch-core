import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NpmVersionMetadata } from "../registry/metadataTypes.js";

export async function readExtractedPackageJson(extractPath: string): Promise<NpmVersionMetadata> {
  const packageJsonPath = join(extractPath, "package", "package.json");
  const raw = await readFile(packageJsonPath, "utf8");
  return JSON.parse(raw) as NpmVersionMetadata;
}
