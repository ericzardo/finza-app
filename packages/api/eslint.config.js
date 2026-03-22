import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { FlatCompat } from '@eslint/eslintrc';

// Plugins
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';

const compat = new FlatCompat();

export default [
  // Regras base do JS
  js.configs.recommended,

  // Integração com Prettier
  prettier,
  eslintPluginPrettier,
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          semi: true,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'all',
        },
      ],
    },
  },

  // Import Resolver
  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
    plugins: { import: eslintPluginImport },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['bun:test'] }],
      'import/no-relative-parent-imports': 'off',

      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              // Impede que uma feature importe de OUTRA feature diretamente
              target: './src/features',
              from: './src/features/*',
              except: ['./**'],
              message: 'Não importe diretamente de outra feature.',
            },
          ],
        },
      ],
    },
  },

  {
    plugins: { 'unused-imports': eslintPluginUnusedImports },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Unused imports/vars
  {
    plugins: { 'unused-imports': eslintPluginUnusedImports },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'no-unused-vars': [
        'error',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: false },
      ],
    },
  },

  // Suporte a TypeScript
  ...compat.extends('plugin:@typescript-eslint/recommended'),
];
