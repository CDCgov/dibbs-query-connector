import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { DOCS_FILE_MAP, isMdxDoc } from "@/app/utils/docs-file-map";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * Serves the non-Markdown documentation files (PDF, XLSX) that live in src/docs.
 * Only files listed in DOCS_FILE_MAP are served, so the file name from the URL
 * is never used to read outside the docs directory.
 * @param _request - The incoming request.
 * @param context - The route context.
 * @param context.params - An object containing the requested file name.
 * @returns The file contents, or a 404 if the file isn't a known doc.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  let requested = file;
  try {
    requested = decodeURIComponent(file);
  } catch {
    // Not valid percent-encoding; fall through with the raw value.
  }

  const fileName = Object.values(DOCS_FILE_MAP).find(
    (mappedFile) =>
      !isMdxDoc(mappedFile) &&
      mappedFile.toLowerCase() === requested.toLowerCase(),
  );
  if (!fileName) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Keep the docs directory as a string literal so Next's output file tracing
  // scopes the runtime file access to src/docs.
  const contents = await readFile(
    path.join(process.cwd(), "src/docs", fileName),
  );
  const contentType =
    CONTENT_TYPES[path.extname(fileName).toLowerCase()] ??
    "application/octet-stream";

  return new NextResponse(contents, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
