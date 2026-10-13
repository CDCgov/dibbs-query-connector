import {
  fetchAndProcessErsdResources,
  fetchValueSetsFromVsac,
} from "./fetch-external-artifacts";
import { writeErsdData, writeVSACData } from "./write-to-disk";
import { fileURLToPath } from "url";
import * as path from "path";
import { createErsdPayload } from "./process-data";
import { VSAC_FETCH_BATCH_SIZE } from "./constants";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ersd = await fetchAndProcessErsdResources();

writeErsdData(ersd, `${__dirname}/artifacts`);

const ersdValuesets = ersd["entry"]?.filter(
  (e) => (e.resource as { resourceType?: string })?.resourceType === "ValueSet",
);

const ersdPayload = createErsdPayload(ersdValuesets);
const vsacValueSets = await fetchValueSetsFromVsac(
  ersdPayload,
  VSAC_FETCH_BATCH_SIZE,
);

writeVSACData(vsacValueSets, ersd, `${__dirname}/artifacts`);
