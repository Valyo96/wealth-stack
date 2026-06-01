const path = require("path");
const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: path.join(__dirname),
});

module.exports = [
  {
    files: ["eslint.config.js", "jest.config.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },
  ...compat.config({
    extends: ["expo"],
    ignorePatterns: ["/node_modules/", "/.expo/", "/coverage/"],
  }),
];
