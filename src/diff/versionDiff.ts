import type { NpmVersionMetadata } from "../registry/metadataTypes.js";
import type { ScanResult } from "../scanner/fileScanner.js";
import type { LatchAuditReport } from "../risk/riskTypes.js";

export type PackageVersionDiff = NonNullable<LatchAuditReport["diff"]>;

export function diffPackageVersions(options: {
  previousVersion?: string;
  currentPackageJson: NpmVersionMetadata;
  previousPackageJson?: NpmVersionMetadata;
  currentScan: ScanResult;
  previousScan?: ScanResult;
  currentFileCount?: number;
  previousFileCount?: number;
  currentUnpackedSize?: number;
  previousUnpackedSize?: number;
}): PackageVersionDiff {
  const {
    previousVersion,
    currentPackageJson,
    previousPackageJson,
    currentScan,
    previousScan,
    currentFileCount,
    previousFileCount,
    currentUnpackedSize,
    previousUnpackedSize
  } = options;

  return {
    previousVersion,
    scriptsAdded: previousPackageJson ? addedKeys(previousPackageJson.scripts, currentPackageJson.scripts) : [],
    scriptsRemoved: previousPackageJson ? removedKeys(previousPackageJson.scripts, currentPackageJson.scripts) : [],
    scriptsChanged: previousPackageJson ? changedKeys(previousPackageJson.scripts, currentPackageJson.scripts) : [],
    dependenciesAdded: previousPackageJson ? addedKeys(allDependencies(previousPackageJson), allDependencies(currentPackageJson)) : [],
    dependenciesRemoved: previousPackageJson ? removedKeys(allDependencies(previousPackageJson), allDependencies(currentPackageJson)) : [],
    binChanged: previousPackageJson ? JSON.stringify(previousPackageJson.bin ?? null) !== JSON.stringify(currentPackageJson.bin ?? null) : false,
    fileCountDelta: delta(currentFileCount, previousFileCount),
    unpackedSizeDelta: delta(currentUnpackedSize, previousUnpackedSize),
    suspiciousPatternDelta: previousScan ? suspiciousCount(currentScan) - suspiciousCount(previousScan) : undefined
  };
}

function addedKeys(previous?: Record<string, string>, current?: Record<string, string>): string[] {
  return Object.keys(current ?? {}).filter((key) => !(key in (previous ?? {}))).sort();
}

function removedKeys(previous?: Record<string, string>, current?: Record<string, string>): string[] {
  return Object.keys(previous ?? {}).filter((key) => !(key in (current ?? {}))).sort();
}

function changedKeys(previous?: Record<string, string>, current?: Record<string, string>): string[] {
  return Object.keys(current ?? {})
    .filter((key) => key in (previous ?? {}) && previous?.[key] !== current?.[key])
    .sort();
}

function allDependencies(packageJson: NpmVersionMetadata): Record<string, string> {
  return {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.optionalDependencies ?? {}),
    ...(packageJson.peerDependencies ?? {})
  };
}

function delta(current?: number, previous?: number): number | undefined {
  if (current === undefined || previous === undefined) {
    return undefined;
  }

  return current - previous;
}

function suspiciousCount(scan: ScanResult): number {
  return scan.suspiciousPatterns.reduce((sum, pattern) => sum + pattern.count, 0);
}
