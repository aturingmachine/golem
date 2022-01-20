module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['import'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': [
      'error',
      {
        arrays: 'only-multiline',
        objects: 'only-multiline',
        imports: 'only-multiline',
        exports: 'only-multiline',
        functions: 'only-multiline',
        enums: 'only-multiline',
        generics: 'only-multiline',
        tuples: 'only-multiline',
      },
    ],
    'import/order': [
      // Enfore Import ordering
      'error',
      {
        // Place '~/**' imports before relative imports
        pathGroups: [
          {
            pattern: '~/**',
            group: 'sibling',
            position: 'before',
          },
        ],
        // Sort alpabetically (sorts based on path not member name)
        alphabetize: {
          order: 'asc',
          caseInsensitive: false,
        },
        // Dont newline within import blocks
        'newlines-between': 'never',
      },
    ],
    // ensure sort-imports is off to make sure we don't conflict with import/order at all
    'sort-imports': ['off'],
  },
}
