import type { MDXComponents } from "mdx/types";
import Image, { ImageProps } from "next/image";
import Link from "next/link";
import { AnchorHTMLAttributes } from "react";

/**
 * Rewrites links so they work both on the rendered Next.js site and on GitHub:
 * - Relative `.mdx` links (e.g. `./user-guide.mdx`) become site paths (`/docs/user-guide`)
 * - Absolute `https://queryconnector.dev/...` links become relative paths (`/...`)
 * @param props
 */
function MdxLink(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, ...rest } = props;
  if (href && /^\.\/.*\.mdx(#.*)?$/.test(href)) {
    const [path, fragment] = href.split("#");
    const slug = path.replace(/^\.\//, "").replace(/\.mdx$/, "");
    const resolved = slug === "table-of-contents" ? "/docs" : `/docs/${slug}`;
    return (
      <Link {...rest} href={fragment ? `${resolved}#${fragment}` : resolved} />
    );
  }
  if (href && href.startsWith("https://queryconnector.dev/")) {
    const path = href.replace("https://queryconnector.dev", "");
    return <Link {...rest} href={path} />;
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
    img: (props) => {
      const imgProps = { ...props } as ImageProps;
      if (
        typeof imgProps.src === "string" &&
        imgProps.src.startsWith("../../public/")
      ) {
        imgProps.src = imgProps.src.replace("../../public", "");
      }
      return (
        <Image
          sizes="100vw"
          style={{ width: "100%", height: "auto" }}
          width={1000}
          height={1000}
          alt-label={"Image diagram to illustrate documentation concept"}
          {...imgProps}
        />
      );
    },
    a: MdxLink,
    ...components,
  };
}
