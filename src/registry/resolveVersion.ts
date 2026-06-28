import semver from "semver";
import type { NpmPackageMetadata, NpmVersionMetadata } from "./metadataTypes.js";

export type ResolvedVersion = {
  version: string;
  metadata: NpmVersionMetadata;
};

export function resolveVersion(metadata: NpmPackageMetadata, requestedVersion?: string): ResolvedVersion {
  const requested = requestedVersion ?? "latest";
  const distTagVersion = metadata["dist-tags"]?.[requested];
  const targetVersion = distTagVersion ?? requested;

  if (metadata.versions[targetVersion]) {
    return { version: targetVersion, metadata: metadata.versions[targetVersion] };
  }

  const max = semver.maxSatisfying(Object.keys(metadata.versions), requested);
  if (max && metadata.versions[max]) {
    return { version: max, metadata: metadata.versions[max] };
  }

  throw new Error(`Could not resolve version "${requested}" for ${metadata.name}.`);
}

export function findPreviousVersion(metadata: NpmPackageMetadata, targetVersion: string): string | undefined {
  const versionsByPublishTime = Object.keys(metadata.versions)
    .filter((version) => version !== targetVersion && metadata.time?.[version])
    .sort((a, b) => {
      return new Date(metadata.time![a]).getTime() - new Date(metadata.time![b]).getTime();
    });

  const targetTime = metadata.time?.[targetVersion];
  if (!targetTime) {
    return undefined;
  }

  const targetMs = new Date(targetTime).getTime();
  return versionsByPublishTime.filter((version) => new Date(metadata.time![version]).getTime() < targetMs).at(-1);
}
