/**
 * A Next.js page that renders a Markdown file with a table of contents.
 * @returns A React component that renders the Markdown file.
 */
export default async function Page() {
  const { default: Post } = await import(`@/docs/table-of-contents.md`);

  return (
    <div className="main-container">
      <Post />
    </div>
  );
}
