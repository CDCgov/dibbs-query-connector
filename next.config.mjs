/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";
import createMDX from "@next/mdx";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uswdsPackagesPath = path.join(
  __dirname,
  "node_modules",
  "@uswds",
  "uswds",
  "packages",
);

const nextConfig = {
  // Pin the workspace root so Turbopack doesn't infer a parent directory
  // (e.g. when building from a nested git worktree)
  turbopack: {
    root: __dirname,
  },
  sassOptions: {
    implementation: "sass-embedded",
    includePaths: [uswdsPackagesPath],
    // The modern Sass API (used by Turbopack builds) calls this loadPaths
    loadPaths: [uswdsPackagesPath],
    silenceDeprecations: ["global-builtin", "legacy-js-api", "if-function"],
  },
  transpilePackages: ["yaml"],
  serverExternalPackages: ["@aws-sdk/client-secrets-manager"],
  output: "standalone",
  basePath: "",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    // Turbopack doesn't seem to play nice with Remark plugins
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

// uncomment this in order to run the Next trace package by
// 1. running dev with NEXT_TURBOPACK_TRACING=1 npm run dev
// 2. clicking around the problematic pages
// 3. in a separate terminal, running next internal turbo-trace-server .next/trace-turbopack
// and opening the generated file at trace.nextjs.org

export default withMDX(nextConfig);
