import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { suspiciousPatterns } from "./suspiciousPatterns.js";

export type ScanResult = {
  scannedFiles: number;
  skippedFiles: number;
  totalFiles: number;
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

const scanExtensions = new Set([
  ".js",
  ".cjs",
  ".mjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".sh",
  ".bash",
  ".ps1",
  ".cmd",
  ".bat",
  ".py",
  ".rb"
]);

const skipDirectories = new Set(["node_modules", ".git"]);
const maxScanBytes = 512 * 1024;
const binaryExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".ico",
  ".pdf",
  ".zip",
  ".gz",
  ".tgz",
  ".wasm",
  ".node",
  ".exe",
  ".dll",
  ".dylib",
  ".so",
  ".mp4",
  ".mov",
  ".mp3",
  ".woff",
  ".woff2",
  ".ttf"
]);

export async function scanPackageFiles(extractPath: string): Promise<ScanResult> {
  const root = join(extractPath, "package");
  const files = await listFiles(root);
  const result: ScanResult = {
    scannedFiles: 0,
    skippedFiles: 0,
    totalFiles: files.length,
    suspiciousPatterns: [],
    obfuscation: {
      level: "none",
      files: []
    }
  };

  for (const filePath of files) {
    const fileStat = await stat(filePath);
    const ext = getExtension(filePath);
    if (binaryExtensions.has(ext) || !scanExtensions.has(ext) || fileStat.size > maxScanBytes) {
      result.skippedFiles += 1;
      continue;
    }

    const text = await readFile(filePath, "utf8").catch(() => undefined);
    if (text === undefined) {
      result.skippedFiles += 1;
      continue;
    }

    const rel = relative(root, filePath);
    result.scannedFiles += 1;
    for (const suspiciousPattern of suspiciousPatterns) {
      const matches = text.match(suspiciousPattern.regex);
      if (matches?.length) {
        result.suspiciousPatterns.push({
          pattern: suspiciousPattern.pattern,
          file: rel,
          count: matches.length,
          category: suspiciousPattern.category
        });
      }
    }

    if (looksObfuscated(text)) {
      result.obfuscation.files.push(rel);
    }
  }

  if (result.obfuscation.files.length > 2) {
    result.obfuscation.level = "likely";
  } else if (result.obfuscation.files.length > 0) {
    result.obfuscation.level = "possible";
  }

  return result;
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (skipDirectories.has(entry.name)) {
        continue;
      }
      files.push(...(await listFiles(join(directory, entry.name))));
    } else if (entry.isFile()) {
      files.push(join(directory, entry.name));
    }
  }

  return files;
}

function getExtension(filePath: string): string {
  const match = filePath.match(/(\.[^.]+)$/);
  return match?.[1] ?? "";
}

function looksObfuscated(text: string): boolean {
  const lines = text.split(/\r?\n/);
  const hasVeryLongLine = lines.some((line) => line.length > 1500);
  const escapedStrings = (text.match(/\\x[0-9a-fA-F]{2}|\\u[0-9a-fA-F]{4}/g) ?? []).length;
  const base64Like = (text.match(/[A-Za-z0-9+/]{160,}={0,2}/g) ?? []).length;
  const denseLines = lines.filter((line) => line.length > 300 && line.replace(/\s/g, "").length / line.length > 0.92);
  const dynamicExecution = /\beval\s*\(|\bnew\s+Function\s*\(/.test(text);

  return hasVeryLongLine || escapedStrings > 20 || base64Like > 2 || (base64Like > 0 && dynamicExecution) || denseLines.length > 5;
}
