import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.local-backup/**',
      '.agents/**',
      'public/**',
      '.husky/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: { eqeqeq: ['error', 'always'] },
  },
  { files: ['src/ui.js'], languageOptions: { globals: globals.browser } },
  { files: ['tests/**/*.js', 'eslint.config.js'], languageOptions: { globals: globals.node } },
]
