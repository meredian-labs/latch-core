import type { LatchAuditReport } from "../risk/riskTypes.js";

export function formatHumanReport(report: LatchAuditReport): string {
  const lines: string[] = [];
  lines.push("LatchX Preflight Report");
  lines.push("");
  section(lines, "Package", [
    `Name: ${report.package.name}`,
    `Version: ${report.package.resolvedVersion}`,
    `Registry: ${report.registry.url}`,
    `Published: ${report.package.publishedAt ?? "unknown"}`
  ]);
  section(lines, "Identity", [
    `Published by: ${formatPerson(report.identity.publisher)}`,
    `Maintainers: ${report.identity.maintainers?.map((person) => person.name ?? person.email).filter(Boolean).join(", ") || "unknown"}`,
    `Repository: ${formatUnknown(report.identity.repository)}`,
    `License: ${report.identity.license ?? "unknown"}`
  ]);
  section(lines, "Size", [
    `Tarball: ${formatBytes(report.size.tarballBytes)}`,
    `Unpacked: ${formatBytes(report.size.unpackedBytes)}`,
    `Files: ${report.size.fileCount ?? "unknown"}`
  ]);
  section(lines, "Execution", [
    "Bin entries:",
    ...formatBin(report.execution.bin).map((line) => `  ${line}`)
  ]);
  section(lines, "Lifecycle Scripts", formatLifecycleScripts(report));
  section(lines, "Dependencies", [
    `dependencies: ${report.dependencies.dependencies}`,
    `devDependencies: ${report.dependencies.devDependencies}`,
    `optionalDependencies: ${report.dependencies.optionalDependencies}`,
    `peerDependencies: ${report.dependencies.peerDependencies}`,
    `bundledDependencies: ${report.dependencies.bundledDependencies}`
  ]);
  section(lines, "Diff", formatDiff(report));
  section(lines, "Scan", [
    `Scanned files: ${report.scan.scannedFiles}`,
    `Skipped files: ${report.scan.skippedFiles}`,
    `Total files: ${report.scan.totalFiles ?? "unknown"}`,
    `Suspicious pattern groups: ${report.scan.suspiciousPatterns.length}`,
    `Obfuscation: ${report.scan.obfuscation.level}`
  ]);
  section(lines, "Risk", [`Score: ${report.risk.score}/100`, `Level: ${report.risk.level}`]);
  section(
    lines,
    "Findings",
    report.risk.findings.map((finding) => {
      const marker = finding.severity === "info" ? "ok" : "!";
      return `${marker} ${finding.title}: ${finding.message}`;
    })
  );
  section(lines, "Decision", [`Recommendation: ${report.decision.recommended}`, report.decision.reason]);

  return lines.join("\n");
}

function section(lines: string[], title: string, body: string[]): void {
  lines.push(title);
  for (const line of body) {
    lines.push(`  ${line}`);
  }
  lines.push("");
}

function formatPerson(person?: { name?: string; email?: string }): string {
  if (!person?.name && !person?.email) {
    return "unknown";
  }

  return [person.name, person.email ? `<${person.email}>` : undefined].filter(Boolean).join(" ");
}

function formatUnknown(value: unknown): string {
  if (!value) {
    return "unknown";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && "url" in value && typeof value.url === "string") {
    return value.url;
  }

  return JSON.stringify(value);
}

function formatBytes(bytes?: number): string {
  if (bytes === undefined) {
    return "unknown";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatBin(bin: LatchAuditReport["execution"]["bin"]): string[] {
  if (!bin) {
    return ["none"];
  }

  if (typeof bin === "string") {
    return [bin];
  }

  return Object.entries(bin).map(([name, target]) => `${name} -> ${target}`);
}

function formatLifecycleScripts(report: LatchAuditReport): string[] {
  if (!report.execution.lifecycleScripts.length) {
    return ["none"];
  }

  return report.execution.lifecycleScripts.map((script) => `${script.name}: ${script.command}`);
}

function formatDiff(report: LatchAuditReport): string[] {
  if (!report.diff?.previousVersion) {
    return ["Previous version: none"];
  }

  return [
    `Previous version: ${report.diff.previousVersion}`,
    `Scripts added: ${formatList(report.diff.scriptsAdded)}`,
    `Scripts removed: ${formatList(report.diff.scriptsRemoved)}`,
    `Scripts changed: ${formatList(report.diff.scriptsChanged)}`,
    `Dependencies added: ${formatList(report.diff.dependenciesAdded)}`,
    `Dependencies removed: ${formatList(report.diff.dependenciesRemoved)}`,
    `Bin changed: ${report.diff.binChanged ? "yes" : "no"}`,
    `File count delta: ${formatDelta(report.diff.fileCountDelta)}`,
    `Unpacked size delta: ${formatBytesDelta(report.diff.unpackedSizeDelta)}`,
    `Suspicious pattern delta: ${formatDelta(report.diff.suspiciousPatternDelta)}`
  ];
}

function formatList(values: string[]): string {
  return values.length ? values.join(", ") : "none";
}

function formatDelta(value?: number): string {
  if (value === undefined) {
    return "unknown";
  }

  return value > 0 ? `+${value}` : String(value);
}

function formatBytesDelta(value?: number): string {
  if (value === undefined) {
    return "unknown";
  }

  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatBytes(Math.abs(value))}`;
}
