const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
// Note the test environment: this is required to provide the jest dom testing environment
// with access to the node global TextEncoder when using Request/Response, which we'll need
// for either actual use or test mocking
// See https://mswjs.io/docs/migrations/1.x-to-2.x#requestresponsetextencoder-is-not-defined-jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-fixed-jsdom",
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
};

const esModules = ["next-auth", "@auth/core", "oauth4webapi"].join("|");

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
/**
 *
 */
module.exports = async () => ({
  ...(await createJestConfig(customJestConfig)()),
  // Need to manually include some node_modules for transformation to get some integration tests to work
  // https://stackoverflow.com/questions/70916761/next-js-and-jest-syntaxerror-cannot-use-import-statement-outside-a-module
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
});
