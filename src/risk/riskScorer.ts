import type { LatchAuditReport, RiskFinding } from "./riskTypes.js";

export function scoreAuditReport(report: Omit<LatchAuditReport, "risk" | "decision">): Pick<LatchAuditReport, "risk" | "decision"> {
  let score = 100;
  const findings: RiskFinding[] = [];

  const lifecycleNames = new Set(report.execution.lifecycleScripts.map((script) => script.name));
  if (["preinstall", "install", "postinstall"].some((name) => lifecycleNames.has(name))) {
    score -= 25;
    findings.push({
      code: "INSTALL_LIFECYCLE_SCRIPT",
      title: "Install lifecycle script found",
      message:
        "This package can run code during installation. That is common for some tools, but it expands what happens before a user directly starts the package.",
      severity: "high",
      category: "scripts"
    });
  }

  if (lifecycleNames.has("prepare")) {
    score -= 15;
    findings.push({
      code: "PREPARE_SCRIPT",
      title: "Prepare script found",
      message:
        "This package declares a prepare script. Prepare scripts are often used for builds, but they are still package-controlled commands.",
      severity: "medium",
      category: "scripts"
    });
  }

  if (report.execution.hasBin) {
    score -= 10;
    findings.push({
      code: "BIN_ENTRY",
      title: "Executable bin entry found",
      message: "This package exposes a command-line executable. That is expected for npx-style use, but it is still the code that will run after approval.",
      severity: "low",
      category: "bin"
    });
  }

  const totalDependencies =
    report.dependencies.dependencies +
    report.dependencies.optionalDependencies +
    report.dependencies.peerDependencies +
    report.dependencies.bundledDependencies;

  if (totalDependencies > 50) {
    score -= 10;
    findings.push({
      code: "VERY_HIGH_DEPENDENCY_COUNT",
      title: "Very high dependency count",
      message: `This package declares ${totalDependencies} runtime-like dependencies. More dependencies increase the amount of third-party code involved.`,
      severity: "medium",
      category: "dependencies"
    });
  } else if (totalDependencies > 20) {
    score -= 5;
    findings.push({
      code: "HIGH_DEPENDENCY_COUNT",
      title: "High dependency count",
      message: `This package declares ${totalDependencies} runtime-like dependencies. This is not inherently bad, but it increases review surface.`,
      severity: "low",
      category: "dependencies"
    });
  }

  const runtimeDependencyDelta = report.diff?.dependenciesAdded.length ?? 0;
  if (runtimeDependencyDelta > 20) {
    score -= 20;
    findings.push({
      code: "DEPENDENCY_SPIKE",
      title: "Dependency count increased sharply",
      message: `This version added ${runtimeDependencyDelta} runtime-like dependencies compared with the previous version. Sudden dependency growth can change package behavior materially.`,
      severity: "high",
      category: "diff"
    });
  }

  const newInstallScripts = (report.diff?.scriptsAdded ?? []).filter((script) => ["preinstall", "install", "postinstall"].includes(script));
  if (newInstallScripts.length) {
    score -= 20;
    findings.push({
      code: "NEW_INSTALL_SCRIPT",
      title: "New install lifecycle script added",
      message: `This version added install-time lifecycle script(s): ${newInstallScripts.join(", ")}. New install-time code deserves review before execution.`,
      severity: "high",
      category: "diff",
      evidence: newInstallScripts.join(", ")
    });
  }

  if ((report.diff?.unpackedSizeDelta ?? 0) > 5 * 1024 * 1024 || (report.diff?.fileCountDelta ?? 0) > 500) {
    score -= 10;
    findings.push({
      code: "SIZE_SPIKE",
      title: "Package size increased sharply",
      message: "This version has a large file count or unpacked size increase compared with the previous version. Size changes can be legitimate, but they are worth inspecting.",
      severity: "medium",
      category: "diff"
    });
  }

  if ((report.diff?.suspiciousPatternDelta ?? 0) > 10) {
    score -= 15;
    findings.push({
      code: "SUSPICIOUS_PATTERN_SPIKE",
      title: "Suspicious scanner signals increased",
      message: `This version added ${report.diff?.suspiciousPatternDelta} scanner signal(s) compared with the previous version. This is a review prompt, not a verdict.`,
      severity: "medium",
      category: "diff"
    });
  }

  score -= addPatternFinding(report, "process", "PROCESS_PATTERNS", "Process execution patterns found", 15, findings);
  score -= addPatternFinding(report, "network", "NETWORK_PATTERNS", "Network access patterns found", 10, findings);
  score -= addPatternFinding(report, "environment", "ENVIRONMENT_PATTERNS", "Environment variable access found", 10, findings);
  score -= addPatternFinding(report, "filesystem", "FILESYSTEM_PATTERNS", "Filesystem access patterns found", 8, findings);
  score -= addPatternFinding(report, "shell", "SHELL_PATTERNS", "Shell command patterns found", 10, findings);
  score -= addPatternFinding(report, "obfuscation", "DYNAMIC_CODE_PATTERNS", "Dynamic code execution patterns found", 10, findings);

  if (report.scan.obfuscation.level === "likely") {
    score -= 25;
    findings.push({
      code: "LIKELY_OBFUSCATION",
      title: "Likely obfuscated files found",
      message: "One or more files look intentionally hard to read. Minified output can be legitimate, but opaque code is harder to audit before running.",
      severity: "high",
      category: "obfuscation"
    });
  } else if (report.scan.obfuscation.level === "possible") {
    score -= 10;
    findings.push({
      code: "POSSIBLE_OBFUSCATION",
      title: "Possible obfuscation found",
      message: "One or more files contain possible obfuscation signals. This may be bundled or minified code, but it reduces audit clarity.",
      severity: "medium",
      category: "obfuscation"
    });
  }

  if (!report.identity.repository || !report.identity.license || !report.identity.maintainers?.length) {
    score -= 15;
    findings.push({
      code: "INCOMPLETE_IDENTITY_METADATA",
      title: "Incomplete identity metadata",
      message: "Repository, license, or maintainer metadata is missing. Missing identity metadata makes it harder to establish package provenance.",
      severity: "medium",
      category: "identity"
    });
  }

  score = Math.max(0, Math.min(100, score));
  const level = score >= 80 ? "low" : score >= 60 ? "medium" : score >= 40 ? "high" : "critical";
  const recommended = score >= 80 ? "allow" : score >= 60 ? "warn" : "deny";
  const reason =
    recommended === "allow"
      ? "No blocking risk signals were found by the local scanner."
      : recommended === "warn"
        ? "Risk signals were found. Review findings before running."
        : "High risk signals were found. Running is not recommended.";

  if (findings.length === 0) {
    findings.push({
      code: "NO_MAJOR_FINDINGS",
      title: "No major findings",
      message: "The local scanner did not find install lifecycle scripts or configured suspicious patterns.",
      severity: "info",
      category: "metadata"
    });
  }

  return {
    risk: { score, level, findings },
    decision: { recommended, reason }
  };
}

function addPatternFinding(
  report: Omit<LatchAuditReport, "risk" | "decision">,
  category: string,
  code: string,
  title: string,
  penalty: number,
  findings: RiskFinding[]
): number {
  const matches = report.scan.suspiciousPatterns.filter((pattern) => pattern.category === category);
  if (!matches.length) {
    return 0;
  }

  findings.push({
    code,
    title,
    message: patternMessage(category, matches.length),
    severity: category === "process" ? "medium" : "low",
    category: mapPatternCategory(category),
    file: matches[0]?.file,
    evidence: matches[0] ? `${matches[0].pattern} (${matches[0].count})` : undefined
  });

  return penalty;
}

function patternMessage(category: string, count: number): string {
  if (category === "process") {
    return `Found ${count} process-execution signal(s). CLIs often spawn tools, but these calls can run additional commands.`;
  }

  if (category === "network") {
    return `Found ${count} network-access signal(s). Network use may be normal, but it can fetch or send data at runtime.`;
  }

  if (category === "environment") {
    return `Found ${count} environment-variable signal(s). Environment access can reveal tokens, paths, or CI context if used carelessly.`;
  }

  if (category === "filesystem") {
    return `Found ${count} filesystem write/delete signal(s). File access may be needed, but it can modify local project state.`;
  }

  if (category === "shell") {
    return `Found ${count} shell command signal(s). Shell download or deletion commands deserve review before execution.`;
  }

  if (category === "obfuscation") {
    return `Found ${count} dynamic-code signal(s). Dynamic code execution makes behavior harder to inspect statically.`;
  }

  return `Found ${count} scanner signal(s). This is a review prompt, not a malware verdict.`;
}

function mapPatternCategory(category: string): RiskFinding["category"] {
  if (category === "environment") {
    return "metadata";
  }

  if (category === "shell") {
    return "process";
  }

  return category as RiskFinding["category"];
}
