import type { MDXComponents } from "mdx/types";
import Image, { ImageProps } from "next/image";
import Link from "next/link";
import { AnchorHTMLAttributes } from "react";

/**
 * Rewrites relative `.mdx` links (e.g. `./user-guide.mdx`) to site paths
 * (`/docs/user-guide`) so that links work both on the rendered site and on
 * GitHub where the raw MDX files live side-by-side.
 * @param props
 */
function MdxLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, ...rest } = props;
  if (href && /^\.\/.*\.mdx$/.test(href)) {
    const slug = href.replace(/^\.\//, "").replace(/\.mdx$/, "");
    const resolved = slug === "table-of-contents" ? "/docs" : `/docs/${slug}`;
    return <Link {...rest} href={resolved} />;
  }
  return <a {...rest} href={href} />;
}

/**
 * A custom hook to use MDX components.
 * @param components - The components to be used in the MDX file.
 * @returns An object containing the components.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    img: (props) => (
      <Image
        sizes="100vw"
        style={{ width: "100%", height: "auto" }}
        width={1000}
        height={1000}
        alt-label={"Image diagram to illustrate documentation concept"}
        {...(props as ImageProps)}
      />
    ),
    a: MdxLink,
    ...components,
  };
}
