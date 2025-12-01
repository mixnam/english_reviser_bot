module.exports = {
  'env': {
    'es2021': true,
    'node': true,
  },
  'extends': [
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'rules': {
    'valid-jsdoc': 0,
    'max-len': 0,
    'camelcase': 0,
  },
  'overrides': [
    {
      'env': {
        'node': true,
      },
      'files': [
        '.eslintrc.{js,cjs}',
      ],
      'parserOptions': {
        'sourceType': 'script',
      },
    },
    {
      'files': ['*.ts', '*.tsx'],
      'parser': '@typescript-eslint/parser',
      'plugins': ['@typescript-eslint'],
      'extends': [
        'google',
        'plugin:@typescript-eslint/recommended',
      ],
      'rules': {
        'valid-jsdoc': 0,
        'max-len': 0,
        'camelcase': 0,
        'require-jsdoc': 0, // Disable JSDoc requirement for TS files as types provide documentation
        '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for now
        '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      },
    },
  ],
};