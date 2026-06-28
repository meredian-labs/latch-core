import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function downloadTarball(url: string, destinationPath: string): Promise<{ bytes: number }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw Object.assign(new Error(`Tarball download failed with ${response.status} ${response.statusText}`), {
      code: "REGISTRY_ERROR"
    });
  }

  const data = Buffer.from(await response.arrayBuffer());
  await mkdir(dirname(destinationPath), { recursive: true });
  await writeFile(destinationPath, data);
  return { bytes: data.byteLength };
}
