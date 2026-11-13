import { App, MarkdownView, Notice, Plugin, PluginSettingTab, SettingDefinitionItem, WorkspaceLeaf } from 'obsidian';
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view';
import { Compartment, StateEffect } from '@codemirror/state';
import { backgroundColor, DEFAULT_SETTINGS, fontStack, isHexColor, normalizeSettings, resolvedTextColor, MinimoSettings } from './settings';
import { activeSentence, TextRange } from './focus';

function codeMirrorView(markdown: MarkdownView): EditorView | null {
  // Obsidian documents this adapter, but its TypeScript Editor interface omits `cm`.
  const editor = markdown.editor as typeof markdown.editor & { cm?: EditorView };
  return editor.cm && typeof editor.cm.dispatch === 'function' ? editor.cm : null;
}

function paragraphRange(view: EditorView, cursor: number): TextRange {
  const doc = view.state.doc;
  const current = doc.lineAt(cursor);
  const startsBlock = (text: string): boolean => /^(?:\s{0,3}#{1,6}\s|\s*(?:[-*+]\s|\d+[.)]\s|>\s|```|~~~))/.test(text);
  if (!current.text.trim()) return { from: current.from, to: current.to };
  if (startsBlock(current.text)) return { from: current.from, to: current.to };
  let first = current.number;
  let last = current.number;
  while (first > 1) {
    const previous = doc.line(first - 1);
    if (!previous.text.trim() || startsBlock(previous.text) || startsBlock(doc.line(first).text)) break;
    first--;
  }
  while (last < doc.lines) {
    const next = doc.line(last + 1);
    if (!next.text.trim() || startsBlock(next.text)) break;
    last++;
  }
  return { from: doc.line(first).from, to: doc.line(last).to };
}

function focusedRange(view: EditorView, settings: MinimoSettings): TextRange {
  const cursor = view.state.selection.main.head;
  const paragraph = paragraphRange(view, cursor);
  if (settings.focus === 'paragraph') return paragraph;
  const content = view.state.doc.sliceString(paragraph.from, paragraph.to);
  const sentence = activeSentence(content, cursor - paragraph.from);
  return { from: paragraph.from + sentence.from, to: paragraph.from + sentence.to };
}

function focusDecorations(view: EditorView, settings: MinimoSettings): DecorationSet {
  if (settings.focus === 'off' || view.state.doc.length === 0) return Decoration.none;
  const active = focusedRange(view, settings);
  const undimmed: TextRange[] = [active, ...view.state.selection.ranges
    .filter((range) => !range.empty)
    .map((range) => ({ from: range.from, to: range.to }))]
    .sort((a, b) => a.from - b.from);
  const merged: TextRange[] = [];
  for (const range of undimmed) {
    const previous = merged[merged.length - 1];
    if (previous && range.from <= previous.to) previous.to = Math.max(previous.to, range.to);
    else merged.push({ ...range });
  }
  const marks = [];
  let start = 0;
  for (const range of merged) {
    if (range.from > start) marks.push(Decoration.mark({ class: 'minimo-dimmed' }).range(start, range.from));
    start = Math.max(start, range.to);
  }
  if (start < view.state.doc.length) marks.push(Decoration.mark({ class: 'minimo-dimmed' }).range(start, view.state.doc.length));
  return Decoration.set(marks);
}

class MinimoEditorView {
  decorations: DecorationSet = Decoration.none;
  private manualScroll = false;
  private readonly measureCallouts = { read: () => null, write: () => this.syncCallouts() };
  private readonly onWheel = () => { this.manualScroll = true; };
  private readonly onPointerDown = (event: PointerEvent) => {
    if (event.target === this.view.scrollDOM) this.manualScroll = true;
  };
  private readonly resize: ResizeObserver;

  constructor(private readonly view: EditorView, private readonly owner: MinimoPlugin) {
    view.scrollDOM.addEventListener('wheel', this.onWheel, { passive: true });
    view.scrollDOM.addEventListener('pointerdown', this.onPointerDown);
    this.resize = new ResizeObserver(() => this.layout());
    this.resize.observe(view.scrollDOM);
    this.refresh();
  }

  update(update: ViewUpdate): void {
    if (!this.owner.isActiveEditor(this.view)) return;
    if (update.docChanged) this.manualScroll = false;
    if (update.docChanged || update.selectionSet || update.viewportChanged) {
      this.decorations = focusDecorations(this.view, this.owner.settings);
      this.view.requestMeasure(this.measureCallouts);
      if (update.docChanged || update.selectionSet) this.layout();
    }
  }

  refresh(): void {
    const active = this.owner.isActiveEditor(this.view);
    this.decorations = active ? focusDecorations(this.view, this.owner.settings) : Decoration.none;
    this.view.requestMeasure(this.measureCallouts);
    this.manualScroll = false;
    this.layout();
  }

  private layout(): void {
    if (!this.owner.isActiveEditor(this.view) || !this.owner.settings.typewriter) {
      this.view.dom.ownerDocument.body.style.removeProperty('--minimo-edge-space');
      return;
    }
    this.view.requestMeasure({
      read: () => Math.max(0, this.view.scrollDOM.clientHeight * this.owner.settings.verticalPosition / 100 - this.view.defaultLineHeight / 2),
      write: (space) => {
        this.view.dom.ownerDocument.body.style.setProperty('--minimo-edge-space', `${space}px`);
        if (!this.manualScroll) this.centerCaret();
      },
    });
  }

  private centerCaret(): void {
    this.view.requestMeasure({
      read: () => {
        const caret = this.view.coordsAtPos(this.view.state.selection.main.head);
        const viewport = this.view.scrollDOM.getBoundingClientRect();
        return caret ? caret.top + (caret.bottom - caret.top) / 2 - (viewport.top + viewport.height * this.owner.settings.verticalPosition / 100) : 0;
      },
      write: (delta) => {
        if (!this.manualScroll && this.owner.isActiveEditor(this.view) && Math.abs(delta) > 0.5) {
          this.view.scrollDOM.scrollTop += delta;
        }
      },
    });
  }

  private syncCallouts(): void {
    const callouts = this.view.contentDOM.querySelectorAll<HTMLElement>('.cm-embed-block.cm-callout');
    const active = this.owner.isActiveEditor(this.view) && this.owner.settings.focus !== 'off'
      ? focusedRange(this.view, this.owner.settings) : null;
    const doc = this.view.state.doc;
    callouts.forEach((callout) => {
      if (!active) { callout.classList.remove('minimo-dimmed-block'); return; }
      const first = doc.lineAt(this.view.posAtDOM(callout));
      let last = first.number;
      while (last < doc.lines && /^\s*>/.test(doc.line(last + 1).text)) last++;
      const from = first.from;
      const to = doc.line(last).to;
      const focused = active.from < to && active.to > from;
      const selected = this.view.state.selection.ranges.some((range) => !range.empty && range.from < to && range.to > from);
      callout.classList.toggle('minimo-dimmed-block', !focused && !selected);
    });
  }

  destroy(): void {
    this.view.contentDOM.querySelectorAll('.cm-callout.minimo-dimmed-block').forEach((callout) => callout.classList.remove('minimo-dimmed-block'));
    this.resize.disconnect();
    this.view.scrollDOM.removeEventListener('wheel', this.onWheel);
    this.view.scrollDOM.removeEventListener('pointerdown', this.onPointerDown);
    this.view.dom.ownerDocument.body.style.removeProperty('--minimo-edge-space');
  }
}

function createEditorExtension(owner: MinimoPlugin) {
  return ViewPlugin.fromClass(
    class extends MinimoEditorView {
      constructor(view: EditorView) { super(view, owner); }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}

interface MinimoSession {
  leaf: WorkspaceLeaf;
  filePath: string;
  leafElement: HTMLElement;
  view: EditorView;
  compartment: Compartment;
  editorAttached: boolean;
  body: HTMLElement;
  scrollTop: number;
  hadFocus: boolean;
  keydown: (event: KeyboardEvent) => void;
}

export default class MinimoPlugin extends Plugin {
  settings: MinimoSettings = DEFAULT_SETTINGS;
  private session: MinimoSession | null = null;
  private readonly compartments = new WeakMap<EditorView, Compartment>();
  private readonly editorExtension = createEditorExtension(this);

  async onload(): Promise<void> {
    this.settings = normalizeSettings(await this.loadData());
    this.addCommand({ id: 'toggle', name: 'Toggle writing view', callback: () => this.toggle() });
    this.addSettingTab(new MinimoSettingTab(this.app, this));
    this.registerEvent(this.app.workspace.on('active-leaf-change', (leaf) => {
      if (this.session && leaf !== this.session.leaf) this.exit(false);
    }));
    this.registerEvent(this.app.workspace.on('layout-change', () => {
      if (this.session && (!this.session.view.dom.isConnected || !(this.session.leaf.view instanceof MarkdownView) || this.session.leaf.view.getMode() !== 'source')) this.exit(false);
    }));
    this.registerEvent(this.app.workspace.on('file-open', (file) => {
      if (this.session && file?.path !== this.session.filePath) this.exit(false);
    }));
  }

  onunload(): void {
    this.exit(false);
  }

  isActiveEditor(view: EditorView): boolean { return this.session?.view === view; }

  private toggle(): void {
    if (this.session) { this.exit(true); return; }
    const markdown = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdown || markdown.getMode() !== 'source' || !markdown.containerEl.querySelector('.markdown-source-view.is-live-preview')) {
      new Notice('Open a Markdown note in Live Preview first.');
      return;
    }
    const view = codeMirrorView(markdown);
    if (!view) {
      new Notice('Could not access the current editor.');
      return;
    }
    const body = view.dom.ownerDocument.body;
    const leaf = markdown.leaf;
    const filePath = markdown.file?.path;
    if (!filePath) return;
    const leafElement = markdown.containerEl.closest<HTMLElement>('.workspace-leaf');
    if (!leafElement) {
      new Notice('Could not find the current pane.');
      return;
    }
    const hadFocus = view.hasFocus;
    const cached = this.compartments.get(view);
    const compartment = cached && cached.get(view.state) !== undefined ? cached : new Compartment();
    const firstUse = compartment !== cached;
    if (firstUse) this.compartments.set(view, compartment);
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.safeToExit(event, view)) {
        event.preventDefault();
        event.stopPropagation();
        this.exit(true);
      }
    };
    const session: MinimoSession = { leaf, filePath, leafElement, view, compartment, editorAttached: false, body, scrollTop: view.scrollDOM.scrollTop, hadFocus, keydown };
    this.session = session;
    try {
      view.dispatch({ effects: firstUse
        ? StateEffect.appendConfig.of(compartment.of(this.editorExtension))
        : compartment.reconfigure(this.editorExtension) });
      session.editorAttached = true;
      if (!view.plugin(this.editorExtension)) throw new Error('Editor extension unavailable');
      leafElement.classList.add('minimo-active-leaf');
      body.classList.add('minimo-active');
      this.applyStyle();
      view.plugin(this.editorExtension)?.refresh();
      body.ownerDocument.addEventListener('keydown', keydown, true);
      view.focus();
    } catch {
      if (!session.editorAttached) this.compartments.delete(view);
      this.exit(false);
      new Notice('Could not start writing mode in this editor.');
    }
  }

  private safeToExit(event: KeyboardEvent, view: EditorView): boolean {
    if (!this.isActiveEditor(view) || event.isComposing || event.defaultPrevented) return false;
    const doc = view.dom.ownerDocument;
    return !Array.from(doc.querySelectorAll<HTMLElement>('.modal-container, .menu, .suggestion-container, .prompt, .popover'))
      .some((element) => element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden');
  }

  private exit(restoreFocus: boolean): void {
    const session = this.session;
    if (!session) return;
    this.session = null;
    session.body.classList.remove('minimo-active');
    session.leafElement.classList.remove('minimo-active-leaf');
    session.leafElement.classList.remove('minimo-show-title');
    session.body.ownerDocument.removeEventListener('keydown', session.keydown, true);
    try {
      if (session.editorAttached && session.view.dom.isConnected) session.view.dispatch({ effects: session.compartment.reconfigure([]) });
    } finally {
      this.clearStyle(session.body);
      if (session.view.dom.isConnected) session.view.scrollDOM.scrollTop = session.scrollTop;
      if (restoreFocus && session.hadFocus && session.view.dom.isConnected) session.view.focus();
    }
  }

  private refreshEditor(view = this.session?.view): void {
    if (view && view.dom.isConnected) {
      const session = this.session;
      if (session) view.dispatch({ effects: session.compartment.reconfigure(this.editorExtension) });
    }
  }

  private applyStyle(): void {
    const session = this.session;
    if (!session) return;
    session.leafElement.classList.toggle('minimo-show-title', this.settings.showTitle);
    const style = session.body.style;
    style.setProperty('--minimo-font-family', fontStack(this.settings));
    style.setProperty('--minimo-font-size', `${this.settings.fontSize}px`);
    style.setProperty('--minimo-line-height', String(this.settings.lineHeight));
    style.setProperty('--minimo-line-width', `${this.settings.lineWidth}ch`);
    style.setProperty('--minimo-background', backgroundColor(this.settings));
    const textColor = resolvedTextColor(this.settings);
    style.setProperty('--minimo-text-color', textColor);
    style.setProperty('--minimo-caret-color', this.settings.caretColor || textColor);
    style.setProperty('--minimo-dim-opacity', String(this.settings.dimOpacity / 100));
  }

  private clearStyle(body: HTMLElement): void {
    for (const name of ['font-family', 'font-size', 'line-height', 'line-width', 'background', 'text-color', 'caret-color', 'dim-opacity', 'edge-space']) {
      body.style.removeProperty(`--minimo-${name}`);
    }
  }

  async saveSettings(): Promise<void> {
    this.settings = normalizeSettings(this.settings);
    await this.saveData(this.settings);
    this.applyStyle();
    this.refreshEditor();
  }
}

class MinimoSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: MinimoPlugin) { super(app, plugin); }

  getSettingDefinitions(): SettingDefinitionItem[] {
    const color = (key: 'customBackground' | 'textColor' | 'caretColor', name: string, desc?: string, placeholder = '#000000'): SettingDefinitionItem => ({
      name,
      desc,
      control: { type: 'text', key, placeholder, validate: (value) => key !== 'customBackground' && value === '' || isHexColor(value) ? undefined : 'Enter a six-digit hex color.' },
      visible: key === 'customBackground' ? () => this.plugin.settings.background === 'custom' : true,
    });
    return [
      { name: 'Font', desc: 'IBM Plex Mono is included. You can also use a font installed on this computer.', control: { type: 'dropdown', key: 'font', options: { 'IBM Plex Mono': 'IBM Plex Mono', system: 'System mono', local: 'Installed font' } } },
      { name: 'Installed font', desc: 'Enter its font family name. Falls back to system mono if unavailable.', control: { type: 'text', key: 'localFont' }, visible: () => this.plugin.settings.font === 'local' },
      { name: 'Font size', control: { type: 'slider', key: 'fontSize', min: 14, max: 36, step: 1, displayFormat: (value) => `${value}px` } },
      { name: 'Line height', control: { type: 'slider', key: 'lineHeight', min: 1.2, max: 2.2, step: 0.05 } },
      { name: 'Line width', desc: 'Approximate characters per line.', control: { type: 'slider', key: 'lineWidth', min: 40, max: 100, step: 1, displayFormat: (value) => `${value} chars` } },
      { name: 'Show note title', control: { type: 'toggle', key: 'showTitle' } },
      { name: 'Background', control: { type: 'dropdown', key: 'background', options: { theme: 'Obsidian theme', dark: 'Dark charcoal', white: 'White', paper: 'Warm paper', custom: 'Custom' } } },
      color('customBackground', 'Custom background'),
      color('textColor', 'Text color', 'Leave blank for automatic contrast.', 'Auto'),
      color('caretColor', 'Caret color', 'Leave blank to match text.', 'Use text color'),
      { name: 'Typewriter scrolling', desc: 'Center the line while typing.', control: { type: 'toggle', key: 'typewriter' } },
      { name: 'Line position', control: { type: 'slider', key: 'verticalPosition', min: 25, max: 75, step: 1, displayFormat: (value) => `${value}%` }, visible: () => this.plugin.settings.typewriter },
      { name: 'Focus', desc: 'Dim surrounding text.', control: { type: 'dropdown', key: 'focus', options: { off: 'Off', sentence: 'Sentence', paragraph: 'Paragraph' } } },
      { name: 'Dimmed text opacity', control: { type: 'slider', key: 'dimOpacity', min: 10, max: 90, step: 1, displayFormat: (value) => `${value}%` }, visible: () => this.plugin.settings.focus !== 'off' },
    ];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    this.plugin.settings = normalizeSettings({ ...this.plugin.settings, [key]: value });
    await this.plugin.saveSettings();
    if (['font', 'background', 'typewriter', 'focus'].includes(key)) this.update();
  }
}
