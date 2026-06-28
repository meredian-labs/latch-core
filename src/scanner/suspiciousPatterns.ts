export type SuspiciousPattern = {
  pattern: string;
  category: "filesystem" | "network" | "process" | "obfuscation" | "shell" | "environment";
  regex: RegExp;
};

export const suspiciousPatterns: SuspiciousPattern[] = [
  { pattern: "child_process", category: "process", regex: /\bchild_process\b/g },
  { pattern: "exec(", category: "process", regex: /\bexec\s*\(/g },
  { pattern: "execSync(", category: "process", regex: /\bexecSync\s*\(/g },
  { pattern: "spawn(", category: "process", regex: /\bspawn\s*\(/g },
  { pattern: "spawnSync(", category: "process", regex: /\bspawnSync\s*\(/g },
  { pattern: "fork(", category: "process", regex: /\bfork\s*\(/g },
  { pattern: "process.env", category: "environment", regex: /\bprocess\.env\b/g },
  { pattern: "require(\"fs\")", category: "filesystem", regex: /require\s*\(\s*["']fs["']\s*\)/g },
  { pattern: "fs.writeFile", category: "filesystem", regex: /\bfs\.writeFile(?:Sync)?\b/g },
  { pattern: "fs.rm", category: "filesystem", regex: /\bfs\.rm(?:Sync)?\b/g },
  { pattern: "fs.unlink", category: "filesystem", regex: /\bfs\.unlink(?:Sync)?\b/g },
  { pattern: "fs.chmod", category: "filesystem", regex: /\bfs\.chmod\b/g },
  { pattern: "fs.chown", category: "filesystem", regex: /\bfs\.chown\b/g },
  { pattern: "require(\"net\")", category: "network", regex: /require\s*\(\s*["']net["']\s*\)/g },
  { pattern: "require(\"http\")", category: "network", regex: /require\s*\(\s*["']https?["']\s*\)/g },
  { pattern: "fetch(", category: "network", regex: /\bfetch\s*\(/g },
  { pattern: "XMLHttpRequest", category: "network", regex: /\bXMLHttpRequest\b/g },
  { pattern: "eval(", category: "obfuscation", regex: /\beval\s*\(/g },
  { pattern: "new Function(", category: "obfuscation", regex: /\bnew\s+Function\s*\(/g },
  { pattern: "vm.runIn", category: "obfuscation", regex: /\bvm\.runIn/g },
  { pattern: "Buffer.from(", category: "obfuscation", regex: /\bBuffer\.from\s*\(/g },
  { pattern: "atob(", category: "obfuscation", regex: /\batob\s*\(/g },
  { pattern: "curl", category: "shell", regex: /\bcurl\b/g },
  { pattern: "wget", category: "shell", regex: /\bwget\b/g },
  { pattern: "chmod +x", category: "shell", regex: /chmod\s+\+x/g },
  { pattern: "rm -rf", category: "shell", regex: /rm\s+-rf/g },
  { pattern: "powershell", category: "shell", regex: /\bpowershell\b/gi },
  { pattern: "Invoke-WebRequest", category: "shell", regex: /\bInvoke-WebRequest\b/g },
  { pattern: "certutil", category: "shell", regex: /\bcertutil\b/g },
  { pattern: "base64", category: "obfuscation", regex: /\bbase64\b/g },
  { pattern: "nc", category: "network", regex: /\bnc\b/g },
  { pattern: "netcat", category: "network", regex: /\bnetcat\b/g },
  { pattern: "node-gyp", category: "process", regex: /\bnode-gyp\b/g },
  { pattern: "prebuild-install", category: "process", regex: /\bprebuild-install\b/g }
];
