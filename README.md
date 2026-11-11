# Zen Writing Mode

Zen Writing Mode is a temporary, quiet writing view for an open Markdown note in Obsidian Live Preview. It uses the current editor and file. Toggling it does not copy, convert, or rewrite note contents.

## Use

1. Open a Markdown note in Live Preview on desktop Obsidian.
2. Run **Toggle Zen mode** from the command palette.
3. In **Settings → Hotkeys**, assign your preferred shortcut to that command. No shortcut is assigned by default.
4. Run the command again to exit. Escape also exits when the editor owns the key and no menu, dialog, suggestion, or IME composition is active.

Zen covers the other panes and app chrome without closing or moving them. The active note keeps its cursor and selection. Exiting restores the normal workspace view and its earlier scroll position.

## Settings

Choose Geist Mono, iA Writer Mono, Berkeley Mono, IBM Plex Mono, or the name of a font installed locally. Fonts are not included. A missing font falls back to the system monospace stack. Set font size, line height, centered line width, background and text colors, and an optional caret color. Typewriter scrolling defaults to on; focus defaults to the current sentence. Focus changes only the display opacity of other text.

## Build and local test

This plugin targets Obsidian 1.15.1 or newer on desktop. Run `npm install`, `npm run build`, `npm run lint`, and `npm test`. For a local test, place `main.js`, `manifest.json`, and `styles.css` in `.obsidian/plugins/zen-writing-mode/` inside a **separate development vault**, then enable it under Community plugins. Do not test plugin development in a primary vault.

## Privacy and support

The plugin does not use the network, telemetry, or files outside the vault. It stores only its appearance settings through Obsidian's plugin data API. It does not change Markdown content itself. For support before a public repository exists, contact the author directly; the eventual public repository will carry the issue tracker.

The plugin source is licensed under the MIT License. The provisional name and ID must be confirmed before a public release.
