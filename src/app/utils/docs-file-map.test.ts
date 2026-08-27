import * as fs from "fs";
import * as path from "path";
import {
  DOCS_FILE_MAP,
  TABLE_OF_CONTENTS_SLUG,
  docPathForFile,
  isMdxDoc,
  resolveDocFile,
} from "./docs-file-map";

const docsDir = path.join(process.cwd(), "src/docs");

describe("DOCS_FILE_MAP", () => {
  it("maps every doc in src/docs, and every mapped file exists", () => {
    const filesOnDisk = fs
      .readdirSync(docsDir)
      .filter((file) => !file.startsWith("."))
      .sort();
    const mappedFiles = [...Object.values(DOCS_FILE_MAP)].sort();

    expect(mappedFiles).toEqual(filesOnDisk);
  });

  it("maps the table of contents to an MDX file", () => {
    expect(isMdxDoc(DOCS_FILE_MAP[TABLE_OF_CONTENTS_SLUG])).toBe(true);
  });
});

describe("resolveDocFile", () => {
  it("resolves canonical slugs, with or without a Markdown extension", () => {
    expect(resolveDocFile("deployment")).toBe("Deployment Guide.mdx");
    expect(resolveDocFile("deployment.mdx")).toBe("Deployment Guide.mdx");
    expect(resolveDocFile("deployment.md")).toBe("Deployment Guide.mdx");
  });

  it("resolves file names, with or without an extension, ignoring case and encoding", () => {
    expect(resolveDocFile("Deployment Guide")).toBe("Deployment Guide.mdx");
    expect(resolveDocFile("Deployment Guide.mdx")).toBe("Deployment Guide.mdx");
    expect(resolveDocFile("Deployment%20Guide.mdx")).toBe(
      "Deployment Guide.mdx",
    );
    expect(resolveDocFile("deployment guide")).toBe("Deployment Guide.mdx");
    expect(resolveDocFile("User Guide.pdf")).toBe("User Guide.pdf");
    expect(resolveDocFile("User%20Guide.pdf")).toBe("User Guide.pdf");
  });

  it("returns undefined for unknown docs", () => {
    expect(resolveDocFile("nope")).toBeUndefined();
    expect(resolveDocFile("../package.json")).toBeUndefined();
    expect(resolveDocFile("User Guide")).toBeUndefined();
  });
});

describe("docPathForFile", () => {
  it("returns the canonical /docs path for a mapped file", () => {
    expect(docPathForFile("Deployment Guide.mdx")).toBe("/docs/deployment");
    expect(docPathForFile("User Guide.pdf")).toBe("/docs/user-guide");
  });

  it("returns undefined for unmapped files", () => {
    expect(docPathForFile("Missing.mdx")).toBeUndefined();
  });
});
