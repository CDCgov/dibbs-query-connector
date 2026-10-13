import { Bundle } from "fhir/r4";
import { writeFile } from "fs/promises";
import { VsacResult } from "./fetch-external-artifacts";

function generateArtifactFilename(data: Bundle) {
  return data.id;
}

/**
 * Write the fetched eRSD resources to disk
 * @param data Fetched eRSD bundle. Will use the bundle ID as the filename
 * @param outputDir Output directory to write the final artifacts to
 * @returns None - compiled resource file will be written to disk
 */
export async function writeErsdData(data: Bundle, outputDir: string) {
  const artifactFilename = generateArtifactFilename(data);
  const filePath = `${outputDir}/${artifactFilename}.json`;

  try {
    const entryResources = data?.entry;
    if (entryResources === undefined) {
      throw Error("No entry resources found in file bundle");
    }

    console.log(`📡  📝 Writing ${entryResources.length} resources to disk`);

    await writeFile(filePath, JSON.stringify(data?.entry), "utf-8");
    console.log("✅ File written successfully!");
  } catch (error) {
    console.error("❌ Error writing file:", error);
  }
}

/**
 * Write the fetched VSAC resources to disk
 * @param data Fetched eRSD bundle. Will use the bundle ID as the filename
 * @param ersd Corresponding eRSD bundle. Will use the bundle ID in the resulting filename
 * @param outputDir Output directory to write the final artifacts to
 * @returns None - compiled resource file will be written to disk
 */
export async function writeVSACData(
  data: VsacResult[],
  ersd: Bundle,
  outputDir: string,
) {
  const artifactFilename = generateArtifactFilename(ersd);
  const filePath = `${outputDir}/vsacValueSets-${artifactFilename}.json`;

  try {
    const valueSets = data.map((r) => r.vs);
    console.log(`📡  📝 Writing ${valueSets.length} resources to disk`);

    await writeFile(filePath, JSON.stringify(valueSets), "utf-8");
    console.log("✅ File written successfully!");
  } catch (error) {
    console.error("❌ Error writing file:", error);
  }
}
