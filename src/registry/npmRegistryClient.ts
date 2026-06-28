import { encodePackageName } from "./packageSpec.js";
import type { NpmPackageMetadata } from "./metadataTypes.js";

export const DEFAULT_REGISTRY_URL = "https://registry.npmjs.org";

export async function fetchNpmMetadata(
  packageName: string,
  options: { registryUrl?: string } = {}
): Promise<NpmPackageMetadata> {
  const registryUrl = (options.registryUrl ?? DEFAULT_REGISTRY_URL).replace(/\/$/, "");
  const response = await fetch(`${registryUrl}/${encodePackageName(packageName)}`, {
    headers: {
      accept: "application/json"
    }
  });

  if (response.status === 404) {
    throw Object.assign(new Error(`Package not found: ${packageName}`), { code: "PACKAGE_NOT_FOUND" });
  }

  if (!response.ok) {
    throw Object.assign(new Error(`Registry request failed with ${response.status} ${response.statusText}`), {
      code: "REGISTRY_ERROR"
    });
  }

  return (await response.json()) as NpmPackageMetadata;
}
