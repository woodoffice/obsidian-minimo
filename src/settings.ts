export type FontChoice = 'system' | 'IBM Plex Mono' | 'local';
export type BackgroundChoice = 'theme' | 'dark' | 'white' | 'paper' | 'custom';
export type FocusChoice = 'off' | 'sentence' | 'paragraph';

export interface MinimoSettings {
  font: FontChoice;
  localFont: string;
  fontSize: number;
  lineHeight: number;
  lineWidth: number;
  showTitle: boolean;
  background: BackgroundChoice;
  customBackground: string;
  textColor: string;
  caretColor: string;
  typewriter: boolean;
  verticalPosition: number;
  focus: FocusChoice;
  dimOpacity: number;
}

export const DEFAULT_SETTINGS: MinimoSettings = {
  font: 'system',
  localFont: '',
  fontSize: 23,
  lineHeight: 1.65,
  lineWidth: 65,
  showTitle: false,
  background: 'theme',
  customBackground: '#202124',
  textColor: '',
  caretColor: '',
  typewriter: true,
  verticalPosition: 50,
  focus: 'sentence',
  dimOpacity: 30,
};

const fonts: FontChoice[] = ['system', 'IBM Plex Mono', 'local'];
const formerFonts = ['Geist Mono', 'iA Writer Mono', 'Berkeley Mono'];
const backgrounds: BackgroundChoice[] = ['theme', 'dark', 'white', 'paper', 'custom'];
const focuses: FocusChoice[] = ['off', 'sentence', 'paragraph'];

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function numberIn(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

export function normalizeSettings(raw: unknown): MinimoSettings {
  const data = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const formerFont = typeof data.font === 'string' && formerFonts.includes(data.font) ? data.font : '';
  const localFont = typeof data.localFont === 'string' ? data.localFont.replace(/[\n\r\t]/g, ' ').slice(0, 100).trim() : '';
  return {
    font: formerFont ? 'local' : fonts.includes(data.font as FontChoice) ? data.font as FontChoice : DEFAULT_SETTINGS.font,
    localFont: formerFont || localFont,
    fontSize: numberIn(data.fontSize, 14, 36, DEFAULT_SETTINGS.fontSize),
    lineHeight: numberIn(data.lineHeight, 1.2, 2.2, DEFAULT_SETTINGS.lineHeight),
    lineWidth: numberIn(data.lineWidth, 40, 100, DEFAULT_SETTINGS.lineWidth),
    showTitle: typeof data.showTitle === 'boolean' ? data.showTitle : DEFAULT_SETTINGS.showTitle,
    background: backgrounds.includes(data.background as BackgroundChoice) ? data.background as BackgroundChoice : DEFAULT_SETTINGS.background,
    customBackground: typeof data.customBackground === 'string' && isHexColor(data.customBackground) ? data.customBackground : DEFAULT_SETTINGS.customBackground,
    textColor: typeof data.textColor === 'string' && (data.textColor === '' || isHexColor(data.textColor)) ? data.textColor : DEFAULT_SETTINGS.textColor,
    caretColor: typeof data.caretColor === 'string' && isHexColor(data.caretColor) ? data.caretColor : '',
    typewriter: typeof data.typewriter === 'boolean' ? data.typewriter : DEFAULT_SETTINGS.typewriter,
    verticalPosition: numberIn(data.verticalPosition, 25, 75, DEFAULT_SETTINGS.verticalPosition),
    focus: focuses.includes(data.focus as FocusChoice) ? data.focus as FocusChoice : DEFAULT_SETTINGS.focus,
    dimOpacity: numberIn(data.dimOpacity, 10, 90, DEFAULT_SETTINGS.dimOpacity),
  };
}

export function fontStack(settings: MinimoSettings): string {
  if (settings.font === 'system') return 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  if (settings.font === 'IBM Plex Mono') return '"Minimo IBM Plex Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  const family = settings.font === 'local' ? settings.localFont : settings.font;
  const safe = family.replace(/["\\]/g, '').trim();
  return safe ? `"${safe}", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` : 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
}

export function backgroundColor(settings: MinimoSettings): string {
  switch (settings.background) {
    case 'theme': return 'var(--background-primary)';
    case 'white': return '#ffffff';
    case 'paper': return '#f5f1e8';
    case 'dark': return '#202124';
    case 'custom': return settings.customBackground;
  }
}

export function resolvedTextColor(settings: MinimoSettings): string {
  if (settings.textColor) return settings.textColor;
  if (settings.background === 'theme') return 'var(--text-normal)';
  const background = backgroundColor(settings);
  const red = parseInt(background.slice(1, 3), 16);
  const green = parseInt(background.slice(3, 5), 16);
  const blue = parseInt(background.slice(5, 7), 16);
  return (red * 299 + green * 587 + blue * 114) / 1000 >= 160 ? '#202124' : '#f5f1e8';
}
