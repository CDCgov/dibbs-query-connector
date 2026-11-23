import path from "path";
import { readFileSync } from "fs";

/**
 * Helper utility to resolve the path of a JSON asset file across environments.
 * In production (standalone build), __dirname resolves relative to the bundled
 * output. In dev (Turbopack), __dirname may resolve to a virtual path, so we
 * fall back to process.cwd()-based resolution.
 * @param filename The file to read from. Must be located in the assets folder.
 * @returns The stringified file data.
 */
export async function readJsonFromRelativePath(filename: string) {
  const allowedDirs = [
    path.resolve(__dirname, "../../assets"),
    path.resolve(process.cwd(), "src/app/assets"),
    path.resolve(process.cwd(), ".next/server/app/assets"),
  ];

  for (const dir of allowedDirs) {
    const resolved = path.resolve(dir, filename);
    if (!resolved.startsWith(dir + path.sep)) {
      continue;
    }
    try {
      return readFileSync(/*turbopackIgnore: true*/ resolved, "utf-8");
    } catch {
      // Try next candidate
    }
  }

  console.error(
    `Could not find asset file ${filename}. Tried: ${allowedDirs.map((d) => path.join(/*turbopackIgnore: true*/ d, filename)).join(", ")}`,
  );
  throw new Error(`Could not load asset file "${filename}".`);
}
