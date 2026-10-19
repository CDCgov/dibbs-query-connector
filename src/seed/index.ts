import {
  fetchAndProcessErsdResources,
  fetchValueSetsFromVsac,
} from "./fetch/fetch-external-artifacts";
import {
  checkForCompatibleManifest,
  createManifest,
  writeErsdData,
  writeVSACData,
} from "./write-to-disk";
import { fileURLToPath } from "url";
import * as path from "path";
import { createErsdPayload } from "./process-data";
import { VSAC_FETCH_BATCH_SIZE } from "./constants";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ERSD_ARTIFACT_PATH = `${__dirname}/artifacts/ersd`;
const ERSD_MANIFEST_PATH = `${__dirname}/artifacts/ersd/manifest.json`;
const VSAC_ARTIFACT_PATH = `${__dirname}/artifacts/vsac`;
const VSAC_MANIFEST_PATH = `${__dirname}/artifacts/vsac/manifest.json`;

// bump manifest version when the eRSD / VSAC API's introduce breaking changes
// to the parsing code
const ERSD_MANIFEST_VERSION = 1;
const VSAC_MANIFEST_VERSION = 1;

// check for mainfest existence and validate the version is compatible with
// the existing hardcoded version

await checkForCompatibleManifest(ERSD_MANIFEST_PATH, ERSD_MANIFEST_VERSION);

const ersd = await fetchAndProcessErsdResources();
const { ersdManifest, ersdValueSets } = await writeErsdData(
  ersd,
  ERSD_ARTIFACT_PATH,
  ERSD_MANIFEST_VERSION,
);
await createManifest(ERSD_MANIFEST_PATH, ersdManifest);

await checkForCompatibleManifest(VSAC_MANIFEST_PATH, VSAC_MANIFEST_VERSION);
const ersdPayload = createErsdPayload(ersdValueSets);
const vsacValueSets = await fetchValueSetsFromVsac(
  ersdPayload,
  VSAC_FETCH_BATCH_SIZE,
);

const vsacManifest = await writeVSACData(
  vsacValueSets,
  ersd,
  VSAC_ARTIFACT_PATH,
  VSAC_MANIFEST_VERSION,
);
await createManifest(VSAC_MANIFEST_PATH, vsacManifest);

// // based on the outputted data, update manifest file metadata
// } catch (error) {
//   console.error("❌ Error writing file:", error);
// }
