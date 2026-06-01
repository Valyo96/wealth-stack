const path = require("path");

/** Resolve a hoisted workspace package to its on-disk root. */
function pkgRoot(name) {
  return path.dirname(
    require.resolve(`${name}/package.json`, { paths: [__dirname] }),
  );
}

const reactRoot = pkgRoot("react");
const reactNativeRoot = pkgRoot("react-native");
const reactTestRendererRoot = pkgRoot("react-test-renderer");

/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@wealth-stack/shared)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "app/**/*.{ts,tsx}",
    "!**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  testMatch: ["**/__tests__/**/*.(test|spec).(ts|tsx)", "**/*.(test|spec).(ts|tsx)"],
  moduleNameMapper: {
    "^react$": reactRoot,
    "^react/(.*)$": `${reactRoot}/$1`,
    "^react-test-renderer$": reactTestRendererRoot,
    "^react-native$": reactNativeRoot,
    "^react-native/(.*)$": `${reactNativeRoot}/$1`,
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
