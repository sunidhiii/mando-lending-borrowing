module.exports = {
  extends: ['@massalabs', 'eslint:recommended'],
  rules: {
    'new-cap': ['error', { newIsCap: false }],
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  ignorePatterns: ['assembly/**'],
};