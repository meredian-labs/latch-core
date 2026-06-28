import { rm, mkdir } from "node:fs/promises";
import * as tar from "tar";

export async function extractTarball(tarballPath: string, destinationPath: string): Promise<void> {
  await rm(destinationPath, { recursive: true, force: true });
  await mkdir(destinationPath, { recursive: true });
  await tar.x({
    file: tarballPath,
    cwd: destinationPath,
    strip: 0
  });
}
