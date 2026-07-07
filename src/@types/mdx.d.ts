// TypeScript 6 no longer falls back to @types/mdx's ambient `*.mdx` module
// when a path-mapped specifier (e.g. `@/docs/foo.mdx`) resolves to a real
// file, so declare the alias pattern explicitly.
declare module "@/docs/*.mdx" {
  import { Element, MDXProps } from "mdx/types";

  export default function MDXContent(props: MDXProps): Element;
}
