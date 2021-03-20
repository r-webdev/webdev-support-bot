const {
  createConfig,
  getDependencies,
} = require('eslint-config-galex/src/createConfig');
const {
  createTSOverride,
} = require('eslint-config-galex/src/overrides/typescript');

const tsOverride = createTSOverride({
  ...getDependencies(),
  rules: {
    '@typescript-eslint/no-floating-promises': 0,
    'inclusive-language/use-inclusive-words': 0,
    '@typescript-eslint/no-floating-promises': 0,
    'no-empty': 0,
    'no-void': 0,
    '@typescript-eslint/no-misused-promises': 0,
    // stuff
  },
});

module.exports = {
  ...createConfig({
    overrides: [tsOverride],
  }),
  ignorePatterns: ['src/v1/*.ts'],
};
