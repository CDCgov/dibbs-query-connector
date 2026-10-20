import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig: Config = {
  coverageProvider: "v8",
  testEnvironment: "jest-fixed-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  coveragePathIgnorePatterns: ["@types", "app/tests"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default async () => {
  const config = await createJestConfig(customJestConfig)();

  return {
    ...config,
    // Next.js sets default transformIgnorePatterns which overrides custom config.
    // We override it here after Next.js finishes generating its base config.
    transformIgnorePatterns: [
      "/node_modules/(?!(next-auth|@next-auth|@auth/core)/)",
    ],
  };
};
