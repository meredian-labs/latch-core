import type { LatchAuditReport } from "../risk/riskTypes.js";

export type LatchPolicy = {
  minScore?: number;
  denyCritical?: boolean;
  denyHigh?: boolean;
  denyLifecycleScripts?: boolean;
  denyNewLifecycleScripts?: boolean;
  denyLikelyObfuscation?: boolean;
  denyIntegrityMissing?: boolean;
  denyIntegrityFailure?: boolean;
  allowPackages?: string[];
  denyPackages?: string[];
  trustedScopes?: string[];
  trustedMaintainers?: string[];
  allowedRegistries?: string[];
};

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
  violations: string[];
  policy: LatchPolicy;
  trusted: boolean;
  matchedAllowRule?: string;
};

export type PolicyEvaluationInput = {
  report: LatchAuditReport;
  policy?: LatchPolicy;
};
