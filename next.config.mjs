/** @type {import('next').NextConfig} */
import path from "path";
import { fileURLToPath } from "url";
import createMDX from "@next/mdx";
import withBundleAnalyzer from "@next/mdx";
import { remarkImageTransform } from "./src/lib/remark-image-transform.mjs";

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
    remarkPlugins: [remarkImageTransform],
  },
});

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default bundleAnalyzer(withMDX(nextConfig));
