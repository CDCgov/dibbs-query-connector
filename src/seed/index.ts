import { fetchAndProcessErsdResources } from "./fetch-external-artifacts";
import { writeErsdData } from "./write-to-disk";
import { fileURLToPath } from "url";
import * as path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ersd = await fetchAndProcessErsdResources();

writeErsdData(ersd, `${__dirname}/artifacts`);
