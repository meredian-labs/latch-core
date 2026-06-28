import { spawn } from "node:child_process";

export async function runNpmExec(packageSpec: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["exec", packageSpec, "--", ...args], {
      stdio: "inherit"
    });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}
