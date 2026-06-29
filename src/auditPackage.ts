import { stat } from "node:fs/promises";
import { fetchNpmMetadata, DEFAULT_REGISTRY_URL } from "./registry/npmRegistryClient.js";
import { parsePackageSpec } from "./registry/packageSpec.js";
import { findPreviousVersion, resolveVersion } from "./registry/resolveVersion.js";
import { downloadTarball } from "./tarball/downloadTarball.js";
import { extractTarball } from "./tarball/extractTarball.js";
import { getTarballPaths } from "./tarball/tarballPaths.js";
import { verifyTarballIntegrity } from "./tarball/verifyIntegrity.js";
import { readExtractedPackageJson } from "./package-json/readPackageJson.js";
import { analyzePackageJson } from "./package-json/analyzePackageJson.js";
import { scanPackageFiles } from "./scanner/fileScanner.js";
import { scoreAuditReport } from "./risk/riskScorer.js";
import { diffPackageVersions } from "./diff/versionDiff.js";
import {
  isCachedAuditReportValid,
  pathExists,
  readCachedAuditReport,
  shouldReadAuditCache,
  writeCachedAuditReport
} from "./cache/auditCache.js";
import type { LatchAuditReport } from "./risk/riskTypes.js";
import type { NpmVersionMetadata } from "./registry/metadataTypes.js";

export type AuditPackageOptions = {
  tool?: "latchx" | "latchpm" | "core";
  action?: "audit" | "inspect" | "run" | "install";
  registryUrl?: string;
  noCache?: boolean;
};

export async function auditPackage(spec: string, options: AuditPackageOptions = {}): Promise<LatchAuditReport> {
  const parsed = parsePackageSpec(spec);
  const registryUrl = (options.registryUrl ?? DEFAULT_REGISTRY_URL).replace(/\/$/, "");
  const metadata = await fetchNpmMetadata(parsed.name, { registryUrl });
  const resolved = resolveVersion(metadata, parsed.requestedVersion);
  const paths = getTarballPaths(parsed.name, resolved.version, {
    registryUrl,
    integrity: resolved.metadata.dist.integrity,
    shasum: resolved.metadata.dist.shasum
  });

  if (shouldReadAuditCache(options.noCache)) {
    const cached = await readCachedAuditReport(paths.reportPath);
    if (cached && isCachedAuditReportValid(cached, { registryUrl, integrity: resolved.metadata.dist.integrity })) {
      return cached;
    }
  }

  const download = await ensureTarball(resolved.metadata, paths.tarballPath, options.noCache);
  await verifyTarballIntegrity(paths.tarballPath, resolved.metadata.dist.integrity, resolved.metadata.dist.shasum);
  const { extractedPackageJson, analysis, scan, previousVersion, previous } = await withAnalysisErrors(async () => {
    await extractTarball(paths.tarballPath, paths.extractPath);

    const packageJson = await readExtractedPackageJson(paths.extractPath);
    const packageAnalysis = analyzePackageJson(packageJson);
    const packageScan = await scanPackageFiles(paths.extractPath);
    const previousPackageVersion = findPreviousVersion(metadata, resolved.version);
    const previousPackage = previousPackageVersion
      ? await auditPreviousVersion(parsed.name, previousPackageVersion, metadata.versions[previousPackageVersion], registryUrl, options.noCache)
      : undefined;

    return {
      extractedPackageJson: packageJson,
      analysis: packageAnalysis,
      scan: packageScan,
      previousVersion: previousPackageVersion,
      previous: previousPackage
    };
  });

  const baseReport: Omit<LatchAuditReport, "risk" | "decision"> = {
    tool: options.tool ?? "core",
    action: options.action ?? "audit",
    generatedAt: new Date().toISOString(),
    registry: {
      url: registryUrl
    },
    package: {
      name: parsed.name,
      requestedSpec: parsed.raw,
      resolvedVersion: resolved.version,
      tarballUrl: resolved.metadata.dist.tarball,
      integrity: resolved.metadata.dist.integrity,
      publishedAt: metadata.time?.[resolved.version]
    },
    identity: {
      publisher: resolved.metadata._npmUser,
      maintainers: metadata.maintainers,
      repository: extractedPackageJson.repository ?? metadata.repository,
      license: extractedPackageJson.license ?? metadata.license
    },
    size: {
      tarballBytes: download.bytes,
      unpackedBytes: resolved.metadata.dist.unpackedSize,
      fileCount: resolved.metadata.dist.fileCount
    },
    execution: {
      hasBin: analysis.hasBin,
      bin: analysis.bin,
      hasLifecycleScripts: analysis.hasLifecycleScripts,
      lifecycleScripts: analysis.lifecycleScripts
    },
    dependencies: analysis.dependencyCounts,
    scan,
    diff: previousVersion
      ? diffPackageVersions({
          previousVersion,
          currentPackageJson: extractedPackageJson,
          previousPackageJson: previous?.packageJson,
          currentScan: scan,
          previousScan: previous?.scan,
          currentFileCount: resolved.metadata.dist.fileCount ?? scan.totalFiles,
          previousFileCount: previous?.metadata.dist.fileCount ?? previous?.scan.totalFiles,
          currentUnpackedSize: resolved.metadata.dist.unpackedSize,
          previousUnpackedSize: previous?.metadata.dist.unpackedSize
        })
      : {
      previousVersion,
      scriptsAdded: [],
      scriptsRemoved: [],
      scriptsChanged: [],
      dependenciesAdded: [],
      dependenciesRemoved: [],
      binChanged: false
    }
  };

  const scored = scoreAuditReport(baseReport);
  const report: LatchAuditReport = {
    ...baseReport,
    ...scored
  };

  await writeCachedAuditReport(paths.reportPath, report);
  return report;
}

async function withAnalysisErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && String(error.code) === "INTEGRITY_FAILED") {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(`Package analysis failed: ${message}`), { code: "ANALYSIS_FAILED" });
  }
}

async function auditPreviousVersion(
  packageName: string,
  version: string,
  metadata: NpmVersionMetadata,
  registryUrl: string,
  noCache?: boolean
) {
  const paths = getTarballPaths(packageName, version, {
    registryUrl,
    integrity: metadata.dist.integrity,
    shasum: metadata.dist.shasum
  });
  await ensureTarball(metadata, paths.tarballPath, noCache);
  await verifyTarballIntegrity(paths.tarballPath, metadata.dist.integrity, metadata.dist.shasum);
  await extractTarball(paths.tarballPath, paths.extractPath);

  return {
    metadata,
    packageJson: await readExtractedPackageJson(paths.extractPath),
    scan: await scanPackageFiles(paths.extractPath)
  };
}

async function ensureTarball(
  metadata: NpmVersionMetadata,
  tarballPath: string,
  noCache?: boolean
): Promise<{ bytes: number }> {
  if (!noCache && (await pathExists(tarballPath))) {
    await verifyTarballIntegrity(tarballPath, metadata.dist.integrity, metadata.dist.shasum);
    const file = await stat(tarballPath);
    return { bytes: file.size };
  }

  return downloadTarball(metadata.dist.tarball, tarballPath);
}
