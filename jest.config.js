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
  coveragePathIgnorePatterns: ["@types", "app/tests"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

// work around https://github.com/vercel/next.js/issues/35634
/**
 * This function is a workaround for the issue with Next.js and Jest
 * @returns - The Jest config object
 */
async function hackJestConfig() {
  // createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
  const nextJestConfig = await createJestConfig(customJestConfig)();
  // /node_modules/ is the first pattern, so overwrite it with the correct version
  nextJestConfig.transformIgnorePatterns[0] = "/node_modules/(?!(next-auth))/";
  return nextJestConfig;
}

export default hackJestConfig;
