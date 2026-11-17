import { promises as fs } from "fs";

/**
 * Read eRSD artifact from disk.
 *
 * @returns the compiled eRSD JSON from the generated API artifacts.
 */
export async function readErsdFromArtifact() {
  const ERSD_ARTIFACT_PATH = process.cwd() + "/src/app/artifacts/ersd";
  const appMetadata = await fs.readFile(
    `${ERSD_ARTIFACT_PATH}/manifest.json`,
    "utf8",
  );

  if (!appMetadata) {
    throw new Error("eRSD manifest not found");
  }

  const ersdManifest = JSON.parse(appMetadata);

  if (!ersdManifest?.files || Object.keys(ersdManifest.files).length < 1) {
    throw new Error("eRSD manifest file index malformed");
  }
  const FILENAME_TO_PARSE = Object.keys(ersdManifest.files).sort()[0];

  const ersdData = await fs.readFile(
    `${ERSD_ARTIFACT_PATH}/${FILENAME_TO_PARSE}.json`,
    "utf8",
  );

  if (!ersdData) {
    throw new Error("eRSD ingest failed");
  }

  return JSON.parse(ersdData);
}

/**
 *
 * @returns
 */
export async function readVsacFromArtifact() {
  const VSAC_ARTIFACT_PATH = process.cwd() + "/src/app/artifacts/vsac";
  const appMetadata = await fs.readFile(
    `${VSAC_ARTIFACT_PATH}/manifest.json`,
    "utf8",
  );

  if (!appMetadata) {
    throw new Error("VSAC manifest not found");
  }

  const vsacManifest = JSON.parse(appMetadata);

  if (!vsacManifest?.files || Object.keys(vsacManifest.files).length < 1) {
    throw new Error("eRSD manifest file index malformed");
  }
  const FILENAME_TO_PARSE = Object.keys(vsacManifest.files).sort()[0];

  const vsacData = await fs.readFile(
    `${VSAC_ARTIFACT_PATH}/${FILENAME_TO_PARSE}.json`,
    "utf8",
  );

  if (!vsacData) {
    throw new Error("vSAC ingest failed");
  }

  return JSON.parse(vsacData);
}
