import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SETTINGS, fontStack, normalizeSettings, resolvedTextColor } from '../src/settings.ts';

void test('invalid persisted settings fall back or clamp to supported ranges', () => {
  const result = normalizeSettings({ font: 'unknown', fontSize: 900, lineWidth: -1, textColor: 'red', caretColor: '#123456', focus: 'unknown' });
  assert.equal(result.font, DEFAULT_SETTINGS.font);
  assert.equal(result.fontSize, 36);
  assert.equal(result.lineWidth, 40);
  assert.equal(result.textColor, DEFAULT_SETTINGS.textColor);
  assert.equal(result.caretColor, '#123456');
  assert.equal(result.focus, DEFAULT_SETTINGS.focus);
  assert.equal(result.showTitle, false);
});

void test('local font value remains inside a quoted CSS family and has fallback', () => {
  assert.match(fontStack(DEFAULT_SETTINGS), /^ui-monospace/);
  assert.match(fontStack(normalizeSettings({ font: 'IBM Plex Mono' })), /^"Minimo IBM Plex Mono", "IBM Plex Mono", ui-monospace/);
  const settings = normalizeSettings({ font: 'local', localFont: 'My "Mono"' });
  assert.match(fontStack(settings), /^"My Mono", ui-monospace/);
  assert.match(fontStack(normalizeSettings({ font: 'local', localFont: '' })), /^ui-monospace/);
});

void test('former named fonts become installed fonts without losing the selection', () => {
  for (const font of ['Geist Mono', 'iA Writer Mono', 'Berkeley Mono']) {
    const settings = normalizeSettings({ font, localFont: 'Old custom font' });
    assert.equal(settings.font, 'local');
    assert.equal(settings.localFont, font);
    assert.match(fontStack(settings), new RegExp(`^"${font}"`));
  }
});

void test('automatic text color contrasts with light and dark backgrounds', () => {
  assert.equal(resolvedTextColor(normalizeSettings({ background: 'theme' })), 'var(--text-normal)');
  assert.equal(normalizeSettings({ background: 'theme' }).background, 'theme');
  assert.equal(normalizeSettings({ showTitle: true }).showTitle, true);
  assert.equal(resolvedTextColor(normalizeSettings({ background: 'dark' })), '#f5f1e8');
  assert.equal(resolvedTextColor(normalizeSettings({ background: 'white' })), '#202124');
  assert.equal(resolvedTextColor(normalizeSettings({ background: 'paper' })), '#202124');
  assert.equal(resolvedTextColor(normalizeSettings({ background: 'custom', customBackground: '#101010' })), '#f5f1e8');
  assert.equal(resolvedTextColor(normalizeSettings({ background: 'white', textColor: '#123456' })), '#123456');
});
