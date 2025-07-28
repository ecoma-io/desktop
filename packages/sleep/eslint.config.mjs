import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['packages/sleep/**/*.{ts,js}'],
    rules: {
      // Add any package-specific rules here
    },
  },
];
