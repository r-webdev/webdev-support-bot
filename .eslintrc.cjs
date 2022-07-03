const { createConfig } = require('eslint-config-galex/dist/createConfig');
const { getDependencies } = require('eslint-config-galex/dist/getDependencies');
const {
  createTypeScriptOverride,
} = require('eslint-config-galex/dist/overrides/typescript');

const tsOverride = createTypeScriptOverride({
  ...getDependencies(),
  rules: {
    '@typescript-eslint/no-floating-promises': 0,
    '@typescript-eslint/no-misused-promises': 0,
  },
});

module.exports = createConfig({
  overrides: [tsOverride],
  root: true,
  rules: {
    'no-empty': 0,
    'no-void': 0,
    // this shit isn't properly supported in TS or node, its too early
    'unicorn/prefer-string-replace-all': 0,
    'no-eq-null': 0,
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'no-bitwise': 0,
    // stuff
    'unicorn/import-index': 'off',
  },
});
