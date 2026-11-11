import js from '@eslint/js';
import obsidianmd from 'eslint-plugin-obsidianmd';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['main.js', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...obsidianmd.configs.recommended,
  { files: ['src/**/*.ts'], languageOptions: { parserOptions: { projectService: true } } },
);
