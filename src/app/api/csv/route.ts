import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse";
import { Readable } from "stream";

export const runtime = "nodejs";

export type csvRow = Record<string, string>;

function parseCsvStream(nodeStream: Readable): Promise<csvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: csvRow[] = [];
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
    });

    nodeStream
      .pipe(parser)
      .on("data", (record: csvRow) => {
        rows.push(record);
      })
      .on("end", () => resolve(rows))
      .on("error", (err: Error) => reject(err));
  });
}

/**
 * Handles CSV file upload and parsing.
 * @param req - The NextRequest object containing the uploaded CSV file in form data.
 * @returns - A JSON response containing the parsed rows or an error message.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  // Stream the uploaded file -> csv-parse
  const webStream = file.stream();

  // Utility to convert a web ReadableStream to a Node.js Readable
  function webStreamToNodeReadable(
    webStream: ReadableStream<Uint8Array>,
  ): Readable {
    const reader = webStream.getReader();
    return new Readable({
      async read() {
        try {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(Buffer.from(value));
          }
        } catch (err) {
          this.destroy(err as Error);
        }
      },
    });
  }

  const nodeStream = webStreamToNodeReadable(
    webStream as ReadableStream<Uint8Array>,
  );
  try {
    const rows = await parseCsvStream(nodeStream);
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message ?? "Failed to parse CSV" },
      { status: 500 },
    );
  }
}
