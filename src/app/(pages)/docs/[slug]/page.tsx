import { notFound, redirect } from "next/navigation";
import {
  DOCS_FILE_MAP,
  isMdxDoc,
  resolveDocFile,
  stripMdxExtension,
} from "@/app/utils/docs-file-map";

/**
 * A Next.js page that dynamically imports a Markdown file based on the slug parameter.
 * Slugs are resolved to file names via DOCS_FILE_MAP so that the on-site URLs stay
 * stable regardless of how the files in src/docs are named. Non-Markdown docs
 * (PDF, XLSX) are redirected to the file-serving route.
 * @param root0 - The root object containing the parameters.
 * @param root0.params - An object containing the slug parameter.
 * @returns A React component that renders the imported Markdown file.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const fileName = resolveDocFile(slug);
  if (!fileName) notFound();

  if (!isMdxDoc(fileName)) {
    redirect(`/docs/files/${encodeURIComponent(fileName)}`);
  }

  const { default: Post } = await import(
    `@/docs/${stripMdxExtension(fileName)}.mdx`
  );

  return (
    <div className="main-container">
      <Post />
    </div>
  );
}

/**
 * Generates static parameters for the dynamic route: one page per Markdown doc slug.
 * @returns An array of objects containing the slug parameter.
 */
export function generateStaticParams() {
  return Object.entries(DOCS_FILE_MAP)
    .filter(([, fileName]) => isMdxDoc(fileName))
    .map(([slug]) => ({ slug }));
}

export const dynamicParams = true;
