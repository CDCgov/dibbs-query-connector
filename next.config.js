/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  sassOptions: {
    includePaths: [
      path.join(__dirname, "./", "node_modules", "@uswds", "uswds", "packages"),
    ],
    // adding these suppressions until this USWDS fix goes in
    // https://github.com/uswds/uswds/pull/6418
    silenceDeprecations: ["global-builtin", "mixed-decls", "legacy-js-api"],
  },
  transpilePackages: ["yaml"],

  output: "standalone",
  basePath: "",
};

module.exports = nextConfig;
