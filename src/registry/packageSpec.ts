export type ParsedPackageSpec = {
  raw: string;
  name: string;
  requestedVersion?: string;
};

export function parsePackageSpec(spec: string): ParsedPackageSpec {
  const raw = spec.trim();
  if (!raw) {
    throw new Error("Package spec is required.");
  }

  if (raw.startsWith("@")) {
    const slashIndex = raw.indexOf("/");
    if (slashIndex === -1) {
      throw new Error(`Invalid scoped package spec: ${raw}`);
    }

    const versionSeparator = raw.indexOf("@", slashIndex);
    if (versionSeparator === -1) {
      return { raw, name: raw };
    }

    return {
      raw,
      name: raw.slice(0, versionSeparator),
      requestedVersion: raw.slice(versionSeparator + 1) || undefined
    };
  }

  const versionSeparator = raw.lastIndexOf("@");
  if (versionSeparator <= 0) {
    return { raw, name: raw };
  }

  return {
    raw,
    name: raw.slice(0, versionSeparator),
    requestedVersion: raw.slice(versionSeparator + 1) || undefined
  };
}

export function encodePackageName(packageName: string): string {
  return packageName.startsWith("@") ? packageName.replace("/", "%2F") : encodeURIComponent(packageName);
}

export function safePackageName(packageName: string): string {
  return packageName.replace("/", "__").replace(/[^a-zA-Z0-9@._-]/g, "_");
}
