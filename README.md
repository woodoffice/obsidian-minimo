# Minimo

Room to write. Minimo gives the current Markdown note a quiet, centered view. It keeps Obsidian's editor and file; toggling it does not change note content.

By WOOD OFFICE.

## Use

1. Open a Markdown note in Live Preview on desktop Obsidian.
2. Run **Minimo: Toggle writing view** from the command palette.
3. In **Settings → Hotkeys**, assign your preferred shortcut to that command. No shortcut is assigned by default.
4. Run the command again to exit. Escape also exits when the editor owns the key and no menu, dialog, suggestion, or IME composition is active.

Minimo covers the other panes and app chrome without closing or moving them. It hides the note title by default and keeps Markdown headings at the text size, in bold. The active note keeps its cursor and selection. Scrolling stays available without a visible scrollbar. Exiting restores the normal workspace view and its earlier scroll position.

## Settings

The default is the system monospace font. You can choose Geist Mono, iA Writer Mono, Berkeley Mono, IBM Plex Mono, or another font installed locally. Fonts are not included; a missing font falls back to system mono. Set font size, line height, centered line width, title visibility, background and text colors, and an optional caret color. The default background follows Obsidian's theme in light and dark mode; preset backgrounds use automatic text contrast. Typewriter scrolling defaults to on; focus defaults to the current sentence. Focus changes only the display opacity of other text.

## Build and local test

This plugin targets Obsidian 1.15.0 or newer on desktop. Run `npm install`, `npm run build`, `npm run lint`, and `npm test`. For a local test, place `main.js`, `manifest.json`, and `styles.css` in `.obsidian/plugins/minimo/` inside a **separate development vault**, then enable it under Community plugins. Do not test plugin development in a primary vault.

## Privacy and support

The plugin does not use the network, telemetry, or files outside the vault. It stores only its appearance settings through Obsidian's plugin data API. It does not change Markdown content itself. For support before a public repository exists, contact the author directly; the eventual public repository will carry the issue tracker.

The plugin source is licensed under the MIT License.
