import { Bundle, Resource, ValueSet } from "fhir/r4";
import { writeFile, access, constants, readFile } from "fs/promises";
import { fetchVsacCapability, VsacResult } from "./fetch-external-artifacts";
import { createHash } from "crypto";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";

type ApiManifestFile = {
  version: string;
  releaseDate: string;
  hash: string;
  resourceCount: number;
  fetchedAtUtc: string;
};

type ApiManifest = {
  manifestVersion: number;
  name: string;
  files: Record<string, ApiManifestFile>;
};

function generateErsdIdentificationProperties(data: Bundle) {
  const entryResources = data["entry"];

  const bundleErsdSpecificationCandiates = entryResources?.filter(
    (e) => e.fullUrl === ERSD_SPECIFICATION_LIBRARY_URL,
  );

  if (
    !bundleErsdSpecificationCandiates ||
    bundleErsdSpecificationCandiates.length != 1
  ) {
    throw Error(
      "Should have exactly one specification resource per eRSD bundle",
    );
  }

  const bundleSpecification = bundleErsdSpecificationCandiates[0].resource as
    ErsdSpecificationResource | undefined;

  const releaseVersion = bundleSpecification
    ? bundleSpecification["version"]
    : "";
  const releaseDate = bundleSpecification ? bundleSpecification["date"] : "";

  return {
    filename: `ersd_${releaseVersion}`,
    releaseVersion: releaseVersion,
    releaseDate: releaseDate,
  };
}

const ERSD_SPECIFICATION_LIBRARY_URL =
  "http://ersd.aimsplatform.org/fhir/Library/ersd-specification";

type ErsdSpecificationResource = Resource & {
  version: string;
  date: string;
  id: string;
};

function generateErsdManifestDetails(
  data: Bundle<Resource>,
  hash: string,
  manifestVersion: number,
) {
  const entryResources = data["entry"];
  const entryValueSets =
    entryResources?.filter(
      (e) =>
        (e.resource as { resourceType?: string })?.resourceType === "ValueSet",
    ) ?? [];

  const { filename, releaseDate, releaseVersion } =
    generateErsdIdentificationProperties(data);

  return {
    manifestDetails: {
      manifestVersion: manifestVersion,
      name: "ersd",
      files: {
        [filename]: {
          version: releaseVersion,
          releaseDate: releaseDate,
          hash: hash,
          fetchedAtUtc: new Date().toISOString(),
          resourceCount: entryValueSets.length,
        },
      },
    } as ApiManifest,
    ersdValueSets: entryValueSets,
  };
}
/**
 * Write the fetched eRSD resources to disk
 *
 * @param data Fetched eRSD bundle. Will use the bundle ID as the filename
 * @param outputDir Output directory to write the final artifacts to
 * @param manifestVersion Version of the manifest denoting the current schema that
 * the ingest parsing code supports
 * @returns None - compiled resource file will be written to disk
 */
export async function writeErsdData(
  data: Bundle<Resource>,
  outputDir: string,
  manifestVersion: number,
) {
  const { filename } = generateErsdIdentificationProperties(data);

  const filePath = `${outputDir}/${filename}.json`;

  const entryResources = data?.entry;
  if (entryResources === undefined) {
    throw Error("No entry resources found in file bundle");
  }

  console.log(`📡  📝 Writing ${entryResources.length} resources to disk`);

  await writeFile(filePath, JSON.stringify(data?.entry), "utf-8");
  const fileHash = await calculateSha256(filePath);
  const { manifestDetails, ersdValueSets } = generateErsdManifestDetails(
    data,
    fileHash,
    manifestVersion,
  );
  console.log("✅ File written successfully!");

  return { ersdManifest: manifestDetails, ersdValueSets };
}

async function generateVsacIdentificationProperties() {
  const vsacCapabilityMetadata = await fetchVsacCapability();
  if (vsacCapabilityMetadata.resourceType !== "CapabilityStatement") {
    throw Error("VSAC capability fetch failed");
  }

  const releaseVersion = vsacCapabilityMetadata["software"]["version"];
  const releaseDate = vsacCapabilityMetadata["software"]["releaseDate"];
  const filename = `${vsacCapabilityMetadata["software"]["name"]}_${releaseVersion}`;

  return { releaseVersion, releaseDate, filename };
}

async function generateVsacManifestDetails(
  data: ValueSet[],
  filename: string,
  releaseVersion: string,
  releaseDate: string,
  hash: string,
  manifestVersion: number,
) {
  return {
    manifestDetails: {
      manifestVersion: manifestVersion,
      name: "vsac",
      files: {
        [filename]: {
          version: releaseVersion,
          releaseDate: releaseDate,
          hash: hash,
          fetchedAtUtc: new Date().toISOString(),
          resourceCount: data.length,
        },
      },
    } as ApiManifest,
  };
}
/**
 * Write the fetched VSAC resources to disk
 *
 * @param data Fetched eRSD bundle. Will use the bundle ID as the filename
 * @param ersd Corresponding eRSD bundle. Will use the bundle ID in the resulting filename
 * @param outputDir Output directory to write the final artifacts to
 * @param manifestVersion
 * @returns None - compiled resource file will be written to disk
 */
export async function writeVSACData(
  data: VsacResult[],
  ersd: Bundle,
  outputDir: string,
  manifestVersion: number,
) {
  const { releaseVersion, releaseDate, filename } =
    await generateVsacIdentificationProperties();
  const { filename: ersdFilename } = generateErsdIdentificationProperties(ersd);

  const valueSets = data.map((r) => r.vs);

  const filePath = `${outputDir}/${filename}_${ersdFilename}.json`;

  console.log(`📡  📝 Writing ${valueSets.length} resources to disk`);
  await writeFile(filePath, JSON.stringify(valueSets), "utf-8");
  console.log("✅ File written successfully!");

  const fileHash = await calculateSha256(filePath);
  const { manifestDetails } = await generateVsacManifestDetails(
    valueSets,
    filename,
    releaseVersion,
    releaseDate,
    fileHash,
    manifestVersion,
  );

  return manifestDetails;
}

/**
 * Function to validate seeded artifact manifest is compatible with seeded artifact code.
 *
 * @param mainfestPath
 * @param curManifestVersion
 * @returns True if no manifest exists or if the manifest is compatible. False otherwise.
 */
export async function checkForCompatibleManifest(
  mainfestPath: string,
  curManifestVersion: number,
) {
  try {
    await access(mainfestPath, constants.F_OK);
    const mainfestData = JSON.parse(await readFile(mainfestPath, "utf-8"));

    return mainfestData["manifestVersion"] === curManifestVersion;
  } catch {
    // otherwise, no artifacts are present, so we're good to go
    return true;
  }
}

/**
 * Function to write API resource manifest to disk
 * @param mainfestPath - path to write file to
 * @param data - manifest data to write
 */
export async function createManifest(mainfestPath: string, data: ApiManifest) {
  await writeFile(mainfestPath, JSON.stringify(data), "utf-8");
}

/**
 * Creates a hash from a file to be used for mainfest indexing.  
 * @param filePath
 * @returns string - sha256 hash string to write to the mainfest file.
 */
export async function calculateSha256(filePath: string) {
  const hash = createHash("sha256");
  const fileStream = createReadStream(filePath);

  await pipeline(fileStream, hash);
  return hash.digest("hex").toString();
}
