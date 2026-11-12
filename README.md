# Minimo

Room to write.

Minimo gives the current note a quiet, centered page. Same editor. Same file. Turning the view on or off leaves your Markdown untouched.

By WOOD OFFICE.

## Use

1. Open a Markdown note in Live Preview on desktop Obsidian.
2. Run **Minimo: Toggle writing view** from the command palette.
3. To add a shortcut, find the command in **Settings → Hotkeys**. None is assigned by default.
4. Run the command again to leave. Escape also works when the editor is active; menus and suggestions keep their usual Escape behavior.

## Writing view

Minimo covers the other panes and app chrome without closing them.

- The note title is hidden by default.
- Headings stay at text size, in bold.
- The cursor and selection stay in place.
- Scrolling works without a visible scrollbar.
- Leaving restores your workspace and its earlier scroll position.

## Settings

**Type.** Use system mono or the included IBM Plex Mono. Geist Mono, iA Writer Mono, Berkeley Mono, and custom fonts use copies installed on your machine. Missing fonts fall back to system mono.

**Page.** Set the type size, line height, line width, title visibility, background, text color, and caret color. The default background follows your Obsidian theme in light and dark mode.

**Focus.** Typewriter scrolling and sentence focus are on by default. Focus dims surrounding text and rendered callouts. Both can be changed or turned off.

## Privacy

No network access or telemetry. Minimo stores its settings through Obsidian and does not edit your Markdown.

## Support

Found a bug? Use the [GitHub issue tracker](https://github.com/woodoffice/obsidian-minimo/issues).

## Development

Minimo supports Obsidian 1.15.0 or newer on desktop.

```sh
npm install
npm run build
npm run lint
npm test
```

To test locally, copy `main.js`, `manifest.json`, and `styles.css` into `.obsidian/plugins/minimo/` in a separate development vault, then enable Minimo under Community plugins.

## License

Plugin source: MIT. Bundled IBM Plex Mono: SIL Open Font License 1.1. Its notice and terms are in `fonts/OFL.txt` and the release stylesheet.
