export type NpmPerson = {
  name?: string;
  email?: string;
  url?: string;
};

export type NpmVersionMetadata = {
  name: string;
  version: string;
  description?: string;
  license?: string;
  main?: string;
  module?: string;
  exports?: unknown;
  bin?: string | Record<string, string>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  bundledDependencies?: string[] | Record<string, string>;
  bundleDependencies?: string[] | Record<string, string>;
  repository?: unknown;
  dist: {
    tarball: string;
    integrity?: string;
    shasum?: string;
    fileCount?: number;
    unpackedSize?: number;
  };
  _npmUser?: NpmPerson;
};

export type NpmPackageMetadata = {
  name: string;
  description?: string;
  "dist-tags": Record<string, string>;
  versions: Record<string, NpmVersionMetadata>;
  time?: Record<string, string>;
  maintainers?: NpmPerson[];
  author?: NpmPerson;
  repository?: unknown;
  license?: string;
};
