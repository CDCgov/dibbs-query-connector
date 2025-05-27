import type { MDXComponents } from "mdx/types";
import Image, { ImageProps } from "next/image";

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
        {...(props as ImageProps)}
      />
    ),
    ...components,
  };
}
