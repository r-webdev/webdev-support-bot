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
    // stuff
  },
});

module.exports = {
  ...createConfig({
    overrides: [tsOverride],
  }),
  ignorePatterns: ['src/v1/*.ts'],
};
