import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    // Ignore files in the 'dist' directory
    ignores: ['dist'],
  },
  {
    files: ['**/*.{ts,tsx}'], // Apply this configuration to TypeScript and TSX files
    languageOptions: {
      parser: tsParser, // Use the TypeScript ESLint parser
      parserOptions: {
        ecmaVersion: 2022, // Specify ECMAScript version
        sourceType: 'module', // Use ES modules
        ecmaFeatures: {
          jsx: true, // Enable JSX
        },
      },
      globals: {
        ...globals.browser, // Add browser global variables (e.g., window, document)
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin, // TypeScript ESLint plugin
      'react-hooks': reactHooks, // React Hooks plugin
      'react-refresh': reactRefresh, // React Refresh plugin
    },
    rules: {
      ...js.configs.recommended.rules, // ESLint's recommended rules
      ...tseslint.configs.recommended.rules, // TypeScript ESLint's recommended rules
      ...reactHooks.configs.recommended.rules, // React Hooks recommended rules
      // Rule for react-refresh to ensure components can be safely hot-reloaded
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true }, // Allow constant exports, common in Vite setups
      ],
    },
    settings: {
      react: {
        version: 'detect', // Automatically detect the React version
      },
    },
  },
];
