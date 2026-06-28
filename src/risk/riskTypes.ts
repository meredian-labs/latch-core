export type RiskFinding = {
  code: string;
  title: string;
  message: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  category:
    | "identity"
    | "metadata"
    | "scripts"
    | "bin"
    | "dependencies"
    | "diff"
    | "filesystem"
    | "network"
    | "process"
    | "obfuscation"
    | "policy";
  file?: string;
  evidence?: string;
};

export type LatchAuditReport = {
  tool: "latchx" | "core";
  generatedAt: string;
  registry: {
    url: string;
  };
  package: {
    name: string;
    requestedSpec: string;
    resolvedVersion: string;
    tarballUrl: string;
    integrity?: string;
    publishedAt?: string;
  };
  identity: {
    publisher?: {
      name?: string;
      email?: string;
    };
    maintainers?: Array<{
      name?: string;
      email?: string;
    }>;
    repository?: unknown;
    license?: string;
  };
  size: {
    tarballBytes?: number;
    unpackedBytes?: number;
    fileCount?: number;
  };
  execution: {
    hasBin: boolean;
    bin: null | string | Record<string, string>;
    hasLifecycleScripts: boolean;
    lifecycleScripts: Array<{
      name: string;
      command: string;
    }>;
  };
  dependencies: {
    dependencies: number;
    devDependencies: number;
    optionalDependencies: number;
    peerDependencies: number;
    bundledDependencies: number;
  };
  scan: {
    scannedFiles: number;
    skippedFiles: number;
    totalFiles?: number;
    suspiciousPatterns: Array<{
      pattern: string;
      file: string;
      count: number;
      category: string;
    }>;
    obfuscation: {
      level: "none" | "possible" | "likely";
      files: string[];
    };
  };
  diff?: {
    previousVersion?: string;
    scriptsAdded: string[];
    scriptsRemoved: string[];
    scriptsChanged: string[];
    dependenciesAdded: string[];
    dependenciesRemoved: string[];
    binChanged: boolean;
    fileCountDelta?: number;
    unpackedSizeDelta?: number;
    suspiciousPatternDelta?: number;
  };
  risk: {
    score: number;
    level: "low" | "medium" | "high" | "critical";
    findings: RiskFinding[];
  };
  decision: {
    recommended: "allow" | "warn" | "deny";
    reason: string;
  };
};
