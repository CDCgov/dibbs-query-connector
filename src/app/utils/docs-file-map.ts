/**
 * Maps the URL slugs served under /docs to the files in src/docs.
 *
 * The files in src/docs carry human-readable names (e.g. "Deployment Guide.mdx")
 * so they read well on GitHub, while the site keeps the short, stable slugs
 * that existing links point at (e.g. /docs/deployment). Add an entry here
 * whenever a doc is added or renamed.
 *
 * Docs written primarily for public health staff (user guide, FAQ, UAT guide,
 * etc.) must go through CDC eClearance and be published on the CDC template,
 * so they live here as PDF/XLSX rather than Markdown. Technical docs for IT
 * staff and developers can stay in Markdown.
 */
export const DOCS_FILE_MAP: Record<string, string> = {
  "table-of-contents": "Table of Contents.mdx",
  "user-guide": "User Guide.pdf",
  faq: "Frequently Asked Questions Guide.pdf",
  "uat-guide": "User Acceptance Testing Guide.pdf",
  "uat-checklist": "User Acceptance Testing Checklist.xlsx",
  "it-guide": "IT Guide.pdf",
  deployment: "Deployment Guide.mdx",
  "idp-setup": "IDP Configuration.mdx",
  api: "API Reference Documentation.mdx",
  "mutual-tls-setup": "Mutual TLS Testing Setup Guide.mdx",
  "fhir-connection-guide": "FHIR Connection Guide.mdx",
  "audit-log": "Audit Logging.mdx",
  "maintenance-guide": "Maintenance Guide.pdf",
  development: "Local Development Guide.mdx",
  contributing: "Contributing.mdx",
  release: "Release Documentation.mdx",
  disclaimer: "Disclaimer.mdx",
};

export const TABLE_OF_CONTENTS_SLUG = "table-of-contents";

const MDX_EXTENSION = /\.mdx?$/i;

/**
 * Strips a trailing .md / .mdx extension from a slug or file name.
 * @param name - The slug or file name.
 * @returns The name without its Markdown extension.
 */
export function stripMdxExtension(name: string): string {
  return name.replace(MDX_EXTENSION, "");
}

/**
 * Whether a file name refers to an MDX document (rendered as a page) as opposed
 * to a binary document (served as a download).
 * @param fileName - A file name from DOCS_FILE_MAP.
 * @returns True if the file is Markdown/MDX.
 */
export function isMdxDoc(fileName: string): boolean {
  return MDX_EXTENSION.test(fileName);
}

/**
 * Resolves a /docs URL slug to a file name in src/docs.
 *
 * Accepts the canonical slug ("deployment"), the slug with a Markdown extension
 * ("deployment.mdx", as used by relative links inside the docs), or the file's
 * actual name with or without extension ("Deployment Guide", "Deployment
 * Guide.mdx", "User Guide.pdf"). Matching on the file name is case-insensitive.
 * @param slug - The slug from the URL, possibly still percent-encoded.
 * @returns The matching file name, or undefined if there is no such doc.
 */
export function resolveDocFile(slug: string): string | undefined {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // Not valid percent-encoding; fall through with the raw slug.
  }

  const bySlug = DOCS_FILE_MAP[stripMdxExtension(decoded)];
  if (bySlug) return bySlug;

  const needle = decoded.toLowerCase();
  const needleWithoutExtension = stripMdxExtension(needle);
  return Object.values(DOCS_FILE_MAP).find((fileName) => {
    const lower = fileName.toLowerCase();
    return (
      lower === needle || stripMdxExtension(lower) === needleWithoutExtension
    );
  });
}

/**
 * Returns the URL path under which a doc is served, given its file name.
 * @param fileName - A file name from DOCS_FILE_MAP.
 * @returns The /docs path for the doc, or undefined if the file isn't mapped.
 */
export function docPathForFile(fileName: string): string | undefined {
  const slug = Object.entries(DOCS_FILE_MAP).find(
    ([, mappedFile]) => mappedFile === fileName,
  )?.[0];
  return slug ? `/docs/${slug}` : undefined;
}
