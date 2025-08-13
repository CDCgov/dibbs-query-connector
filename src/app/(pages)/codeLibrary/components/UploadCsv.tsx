"use client";

import { useRef, useState } from "react";
import type { csvRow } from "@/app/api/csv/route";

type Props = {
  onParsed: (rows: csvRow[]) => void;
};

/**
 * Component for uploading and parsing a CSV file.
 * @param root0 - props
 * @param root0.onParsed - callback function invoked with parsed CSV rows
 */
export default function UploadCsv({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filename, setFilename] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function handleFile(file: File) {
    setError("");
    setFilename(file.name);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/csv/", { method: "POST", body: fd });
    const json: { rows?: csvRow[]; error?: string } = await res.json();
    if (!res.ok || !json.rows) {
      setError(json.error || "Failed to parse CSV");
      return;
    }
    onParsed(json.rows);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <button type="button" onClick={() => inputRef.current?.click()}>
        Upload CSV
      </button>
      {filename && <div>{filename}</div>}
      {error && <div role="alert">{error}</div>}
    </div>
  );
}
