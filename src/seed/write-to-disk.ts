import { Bundle } from "fhir/r4";
import { writeFile } from "fs/promises";

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
