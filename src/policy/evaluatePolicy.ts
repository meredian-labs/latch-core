import type { LatchAuditReport } from "../risk/riskTypes.js";
import type { LatchPolicy, PolicyDecision } from "./policyTypes.js";

const defaultPolicy: LatchPolicy = {};

const lifecycleNames = new Set(["preinstall", "install", "postinstall", "prepare", "prepublish", "prepublishOnly", "prepack", "postpack"]);

export function evaluatePolicy(report: LatchAuditReport, policy: LatchPolicy = defaultPolicy): PolicyDecision {
  const effectivePolicy = { ...defaultPolicy, ...policy };
  const violations: string[] = [];
  const explicitDeny = matchesPackage(report.package.name, effectivePolicy.denyPackages);
  const registryDenied = Boolean(
    effectivePolicy.allowedRegistries?.length && !effectivePolicy.allowedRegistries.map(normalizeRegistry).includes(normalizeRegistry(report.registry.url))
  );
  const integrityMissing = Boolean(effectivePolicy.denyIntegrityMissing && !report.package.integrity);

  if (explicitDeny) {
    violations.push(`Package ${report.package.name} is denied by policy.`);
  }

  if (registryDenied) {
    violations.push(`Registry ${report.registry.url} is not allowed by policy.`);
  }

  if (integrityMissing) {
    violations.push("Package metadata does not include dist.integrity.");
  }

  const trust = getTrustMatch(report, effectivePolicy);
  if (!explicitDeny && !registryDenied && !integrityMissing && trust.trusted) {
    return {
      allowed: true,
      reason: `Allowed by trusted policy rule: ${trust.rule}.`,
      violations: [],
      policy: effectivePolicy,
      trusted: true,
      matchedAllowRule: trust.rule
    };
  }

  if (effectivePolicy.minScore !== undefined && report.risk.score < effectivePolicy.minScore) {
    violations.push(`Risk score ${report.risk.score} is below policy minimum ${effectivePolicy.minScore}.`);
  }

  if (effectivePolicy.denyCritical && report.risk.level === "critical") {
    violations.push("Risk level is critical.");
  }

  if (effectivePolicy.denyHigh && (report.risk.level === "high" || report.risk.level === "critical")) {
    violations.push(`Risk level ${report.risk.level} is denied by policy.`);
  }

  if (effectivePolicy.denyLifecycleScripts && report.execution.hasLifecycleScripts) {
    violations.push("Lifecycle scripts are denied by policy.");
  }

  const newLifecycleScripts = (report.diff?.scriptsAdded ?? []).filter((script) => lifecycleNames.has(script));
  if (effectivePolicy.denyNewLifecycleScripts && newLifecycleScripts.length) {
    violations.push(`New lifecycle scripts are denied by policy: ${newLifecycleScripts.join(", ")}.`);
  }

  if (effectivePolicy.denyLikelyObfuscation && report.scan.obfuscation.level === "likely") {
    violations.push("Likely obfuscation is denied by policy.");
  }

  return {
    allowed: violations.length === 0,
    reason: violations.length ? violations[0] : "Allowed by policy.",
    violations,
    policy: effectivePolicy,
    trusted: false
  };
}

function getTrustMatch(report: LatchAuditReport, policy: LatchPolicy): { trusted: boolean; rule?: string } {
  if (matchesPackage(report.package.name, policy.allowPackages)) {
    return { trusted: true, rule: `allowPackages:${report.package.name}` };
  }

  const scope = report.package.name.startsWith("@") ? report.package.name.split("/")[0] : undefined;
  if (scope && policy.trustedScopes?.includes(scope)) {
    return { trusted: true, rule: `trustedScopes:${scope}` };
  }

  const maintainers = [
    report.identity.publisher?.name,
    report.identity.publisher?.email,
    ...(report.identity.maintainers ?? []).flatMap((person) => [person.name, person.email])
  ].filter((maintainer): maintainer is string => Boolean(maintainer));
  const trustedMaintainer = maintainers.find((maintainer) => policy.trustedMaintainers?.includes(maintainer));
  if (trustedMaintainer) {
    return { trusted: true, rule: `trustedMaintainers:${trustedMaintainer}` };
  }

  return { trusted: false };
}

function matchesPackage(packageName: string, packages?: string[]): boolean {
  return Boolean(packages?.includes(packageName));
}

function normalizeRegistry(registry: string): string {
  return registry.replace(/\/$/, "");
}
