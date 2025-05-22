/**
 * A Next.js page that dynamically imports a Markdown file based on the slug parameter.
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
  // Strip .md from slug
  const slugWithoutExtension = slug.replace(/\.md$/, "");
  const { default: Post } = await import(`@/docs/${slugWithoutExtension}.md`);

  return (
    <div className="main-container">
      <Post />
    </div>
  );
}

/**
 * A function that generates static parameters for the dynamic route.
 * @returns An array of objects containing the slug parameter.
 */
export function generateStaticParams() {
  return [{ slug: "deployment" }, { slug: "development" }];
}

export const dynamicParams = true;
