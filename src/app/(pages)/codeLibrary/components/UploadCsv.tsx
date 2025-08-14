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
 * @returns A button to upload a CSV file and display the filename or error message
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

// CSV upload handling
const csvInputRef = useRef<HTMLInputElement>(null);
const [csvError, setCsvError] = useState<string>("");

export function triggerCsvPicker() {
  csvInputRef.current?.click();
}

type ImportGroupKey = string; // `${vsName}||${category}||${systemLabel}`

function toTypeStrict(label: string): DibbsConceptType | undefined {
  const t = (label || "").trim().toLowerCase();
  if (t === "labs") return "labs";
  if (t === "conditions") return "conditions";
  if (t === "medications") return "medications";
  return undefined;
}

function toSystemUri(label: string) {
  const t = (label || "").trim().toLowerCase();
  const sysMap: Record<string, string> = {
    loinc: "http://loinc.org",
    rxnorm: "http://www.nlm.nih.gov/research/umls/rxnorm",
    "icd-10-cm": "http://hl7.org/fhir/sid/icd-10-cm",
    cvx: "http://hl7.org/fhir/sid/cvx",
    snomed: "http://snomed.info/sct",
    "snomed ct": "http://snomed.info/sct",
    "cap ecc": "http://cap.org/eCC",
  };
  if (sysMap[t]) return sysMap[t];
  const fromOptions = CodeSystemOptions.find((uri) =>
    uri.toLowerCase().includes(t),
  );
  return fromOptions || label;
}

// exact, strongly-typed CSV row after normalization
type NormalizedRow = {
  "value set name": string;
  category: string;
  "code system": string;
  code: string;
  display: string;
};

const normalizedConstant = (s: string) => s.trim().toLowerCase();
const normStr = (s: string | undefined) => (s ?? "").trim();

function normalizeCsvRows(
  rows: csvRow[],
): { ok: true; rows: NormalizedRow[] } | { ok: false; error: string } {
  if (!rows || rows.length === 0)
    return { ok: false, error: "CSV contained no rows" };

  const first = rows[0];
  const keys = Object.keys(first);

  const map: Record<keyof NormalizedRow, string> = {
    "value set name": "",
    category: "",
    "code system": "",
    code: "",
    display: "",
  };

  for (const k of keys) {
    const kn = normalizedConstant(k);
    if (kn === "value set name") map["value set name"] = k;
    else if (kn === "category") map["category"] = k;
    else if (kn === "code system") map["code system"] = k;
    else if (kn === "code") map["code"] = k;
    else if (kn === "display") map["display"] = k;
  }

  if (
    !map["value set name"] ||
    !map["category"] ||
    !map["code system"] ||
    !map["code"] ||
    !map["display"]
  ) {
    return {
      ok: false,
      error:
        "CSV headers must include: value set name, category, code system, code, display",
    };
  }

  const out: NormalizedRow[] = rows.map((r) => ({
    "value set name": normStr(r[map["value set name"]]),
    category: normStr(r[map["category"]]),
    "code system": normStr(r[map["code system"]]),
    code: normStr(r[map["code"]]),
    display: normStr(r[map["display"]]),
  }));

  return { ok: true, rows: out };
}

function groupNormalizedRows(rows: NormalizedRow[]) {
  const groups = new Map<
    ImportGroupKey,
    { vsName: string; cat: string; sys: string; concepts: Concept[] }
  >();

  for (const r of rows) {
    const vsName = r["value set name"];
    const cat = r["category"];
    const sys = r["code system"];
    const code = r["code"];
    const display = r["display"];

    if (!vsName || !cat || !sys) continue;
    if (!code && !display) continue;

    const key: ImportGroupKey = `${vsName}||${cat}||${sys}`;
    const entry = groups.get(key) ?? { vsName, cat, sys, concepts: [] };
    entry.concepts.push({ code, display, include: true });
    groups.set(key, entry);
  }

  // Build DibbsValueSet objects; drop groups that can't be typed/system-mapped
  const valueSets: DibbsValueSet[] = [];
  for (const g of groups.values()) {
    const t = toTypeStrict(g.cat);
    const sysUri = toSystemUri(g.sys);
    if (!t || !sysUri || g.concepts.length === 0) {
      continue;
    }
    valueSets.push({
      ...emptyValueSet,
      valueSetName: g.vsName,
      dibbsConceptType: t,
      system: sysUri,
      concepts: g.concepts,
    });
  }
  return valueSets;
}

async function importCsvValueSets(rows: csvRow[]) {
  // 1) Normalize headers/rows into a strict shape
  const normalized = normalizeCsvRows(rows);
  if (!normalized.ok) {
    setCsvError(normalized.error);
    return;
  }

  // 2) Group & build value sets (strictly typed)
  const valueSets = groupNormalizedRows(normalized.rows);
  if (valueSets.length === 0) {
    setCsvError("No valid value sets found in CSV");
    return;
  }

  // 3) Confirm
  const totalConcepts = valueSets.reduce(
    (acc, vs) => acc + (vs.concepts?.length || 0),
    0,
  );
  const proceed = window.confirm(
    `Import ${valueSets.length} value set(s), ${totalConcepts} concept(s) total?`,
  );
  if (!proceed) return;

  // 4) Save each valueset via existing insertCustomValueSet
  const results: {
    name: string;
    ok: boolean;
    id?: string;
    error?: string;
  }[] = [];
  for (const vs of valueSets) {
    try {
      const res = await insertCustomValueSet(
        vs as DibbsValueSet,
        currentUser?.id as string,
      );
      results.push({
        name: vs.valueSetName,
        ok: !!res.success,
        id: res.id,
        error: res.success ? undefined : "Failed to save",
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      results.push({
        name: vs.valueSetName,
        ok: false,
        error: message,
      });
    }
  }

  const okCount = results.filter((r) => r.ok).length;
  const failCount = results.length - okCount;

  if (okCount > 0) {
    showToastConfirmation({
      body: `Imported ${okCount}/${results.length} value set(s) successfully.`,
    });
  }
  if (failCount > 0) {
    showToastConfirmation({
      body: `Failed to import ${failCount} value set(s).`,
      variant: "error",
    });
    // Optionally: log details
    console.warn(
      "Import failures:",
      results.filter((r) => !r.ok),
    );
  }

  // 5) After import, go back to manage view (single-form UI isn't built for multi-preview)
  setMode("manage");
}

async function handleCsvFile(file: File) {
  setCsvError("");
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/csv/", { method: "POST", body: fd });
  const json: { rows?: csvRow[]; error?: string } = await res.json();
  if (!res.ok || !json.rows) {
    setCsvError(json.error || "Failed to parse CSV");
    return;
  }
  await importCsvValueSets(json.rows);
}
