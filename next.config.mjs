/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";
import createMDX from "@next/mdx";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  sassOptions: {
    implementation: "sass-embedded",
    includePaths: [
      path.join(__dirname, "./", "node_modules", "@uswds", "uswds", "packages"),
    ],
    silenceDeprecations: ["global-builtin", "mixed-decls", "legacy-js-api"],
  },
  transpilePackages: ["yaml"],
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

// import createBundleAnalyzer from "@next/mdx";
// const withBundleAnalyzer = createBundleAnalyzer({
//   enabled: process.env.ANALYZE === "true",
// });
//
// export default withBundleAnalyzer(withMDX(nextConfig));

export default withMDX(nextConfig);
