import {
  fetchAndProcessErsdResources,
  fetchConditionsFromVsac,
  fetchValueSetsFromVsac,
} from "./service";
import {
  checkForCompatibleManifest,
  createManifest,
  writeErsdData,
  writeVSACData,
} from "./write-to-disk";
import { fileURLToPath } from "url";
import * as path from "path";
import { createErsdPayload } from "./process-data";
import { VSAC_FETCH_BATCH_SIZE } from "./utils";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ERSD_ARTIFACT_PATH = `${__dirname}/../app/artifacts/ersd`;
const ERSD_MANIFEST_PATH = `${__dirname}/../app/artifacts/ersd/manifest.json`;
const VSAC_ARTIFACT_PATH = `${__dirname}/../app/artifacts/vsac`;
const VSAC_MANIFEST_PATH = `${__dirname}/../app/artifacts/vsac/manifest.json`;

// TODO: manually bump the manifest version when the eRSD / VSAC API's introduce
// breaking changes to the parsing code
const ERSD_MANIFEST_VERSION = 1;
const VSAC_MANIFEST_VERSION = 1;

// check for mainfest existence and validate the version is compatible with
// the existing hardcoded version
try {
  const isErsdManifestCompatible = await checkForCompatibleManifest(
    ERSD_MANIFEST_PATH,
    ERSD_MANIFEST_VERSION,
  );
  if (!isErsdManifestCompatible.compatible) {
    throw Error(
      `Incompatible eRSD manifest: expected ${ERSD_MANIFEST_VERSION} incompatible with ${isErsdManifestCompatible.version}`,
    );
  }

  const ersd = await fetchAndProcessErsdResources();
  const { ersdManifest, ersdValueSets } = await writeErsdData(
    ersd,
    ERSD_ARTIFACT_PATH,
    ERSD_MANIFEST_VERSION,
  );
  await createManifest(ERSD_MANIFEST_PATH, ersdManifest);

  const isVsacManifestCompatible = await checkForCompatibleManifest(
    VSAC_MANIFEST_PATH,
    VSAC_MANIFEST_VERSION,
  );

  if (!isVsacManifestCompatible.compatible) {
    throw Error(
      `Incompatible VSAC manifest: expected ${VSAC_MANIFEST_VERSION} incompatible with ${isVsacManifestCompatible.version}`,
    );
  }
  const ersdPayload = createErsdPayload(ersdValueSets);

  const conditionSet = new Set<string>();
  ersdPayload.conditions.forEach((c) => {
    const repString = c.code + "*" + c.system + "*" + c.text;
    conditionSet.add(repString);
  });

  const conditionStructs = await fetchConditionsFromVsac(conditionSet);

  const vsacValueSets = await fetchValueSetsFromVsac(
    ersdPayload,
    VSAC_FETCH_BATCH_SIZE,
  );

  const vsacManifest = await writeVSACData(
    vsacValueSets,
    conditionStructs,
    ersd,
    VSAC_ARTIFACT_PATH,
    VSAC_MANIFEST_VERSION,
  );
  await createManifest(VSAC_MANIFEST_PATH, vsacManifest);
} catch (error) {
  console.error("❌ Error updating API artifact files:", error);
}
