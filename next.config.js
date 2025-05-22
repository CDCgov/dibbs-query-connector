/** @type {import('next').NextConfig} */
const path = require("path");
const createMDX = require("@next/mdx");

const nextConfig = {
  sassOptions: {
    includePaths: [
      path.join(__dirname, "./", "node_modules", "@uswds", "uswds", "packages"),
    ],
  },
  transpilePackages: ["yaml"],
  output: "standalone",
  basePath: "",
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [["rehype-mermaid", { strict: true, throwOnError: true }]],
  },
});

module.exports = withMDX(nextConfig);
