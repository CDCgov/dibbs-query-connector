import type { MDXComponents } from "mdx/types";

/**
 * A custom hook to use MDX components.
 * @param components - The components to be used in the MDX file.
 * @returns An object containing the components.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
