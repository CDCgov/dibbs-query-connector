import {
  DOCS_FILE_MAP,
  TABLE_OF_CONTENTS_SLUG,
  stripMdxExtension,
} from "@/app/utils/docs-file-map";

/**
 * A Next.js page that renders a Markdown file with a table of contents.
 * @returns A React component that renders the Markdown file.
 */
export default async function Page() {
  const tableOfContents = stripMdxExtension(
    DOCS_FILE_MAP[TABLE_OF_CONTENTS_SLUG],
  );
  const { default: Post } = await import(`@/docs/${tableOfContents}.mdx`);

  return (
    <div className="main-container">
      <Post />
    </div>
  );
}
