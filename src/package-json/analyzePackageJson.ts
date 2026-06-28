import type { NpmVersionMetadata } from "../registry/metadataTypes.js";

const lifecycleNames = ["preinstall", "install", "postinstall", "prepublish", "prepublishOnly", "prepare", "prepack", "postpack"];

export type PackageJsonAnalysis = {
  hasBin: boolean;
  bin: null | string | Record<string, string>;
  hasLifecycleScripts: boolean;
  lifecycleScripts: Array<{ name: string; command: string }>;
  dependencyCounts: {
    dependencies: number;
    devDependencies: number;
    optionalDependencies: number;
    peerDependencies: number;
    bundledDependencies: number;
  };
};

export function analyzePackageJson(packageJson: NpmVersionMetadata): PackageJsonAnalysis {
  const scripts = packageJson.scripts ?? {};
  const lifecycleScripts = lifecycleNames
    .filter((name) => Boolean(scripts[name]))
    .map((name) => ({ name, command: scripts[name] }));

  return {
    hasBin: Boolean(packageJson.bin),
    bin: packageJson.bin ?? null,
    hasLifecycleScripts: lifecycleScripts.length > 0,
    lifecycleScripts,
    dependencyCounts: {
      dependencies: countObject(packageJson.dependencies),
      devDependencies: countObject(packageJson.devDependencies),
      optionalDependencies: countObject(packageJson.optionalDependencies),
      peerDependencies: countObject(packageJson.peerDependencies),
      bundledDependencies: countBundled(packageJson.bundledDependencies ?? packageJson.bundleDependencies)
    }
  };
}

function countObject(value?: Record<string, string>): number {
  return value ? Object.keys(value).length : 0;
}

function countBundled(value?: string[] | Record<string, string>): number {
  if (!value) {
    return 0;
  }

  return Array.isArray(value) ? value.length : Object.keys(value).length;
}
