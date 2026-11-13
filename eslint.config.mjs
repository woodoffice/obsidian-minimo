import js from '@eslint/js';
import obsidianmd from 'eslint-plugin-obsidianmd';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['main.js', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...obsidianmd.configs.recommended,
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    languageOptions: { parserOptions: { projectService: true } },
    rules: { 'obsidianmd/ui/sentence-case': ['warn', { brands: ['Zen', 'Markdown', 'Live Preview'] }] },
  },
  { files: ['test/**/*.ts'], rules: { 'obsidianmd/no-nodejs-modules': 'off' } },
);
