import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SETTINGS, fontStack, normalizeSettings } from '../src/settings.ts';

test('invalid persisted settings fall back or clamp to supported ranges', () => {
  const result = normalizeSettings({ font: 'unknown', fontSize: 900, lineWidth: -1, textColor: 'red', caretColor: '#123456', focus: 'unknown' });
  assert.equal(result.font, DEFAULT_SETTINGS.font);
  assert.equal(result.fontSize, 36);
  assert.equal(result.lineWidth, 40);
  assert.equal(result.textColor, DEFAULT_SETTINGS.textColor);
  assert.equal(result.caretColor, '#123456');
  assert.equal(result.focus, DEFAULT_SETTINGS.focus);
});

test('local font value remains inside a quoted CSS family and has fallback', () => {
  const settings = normalizeSettings({ font: 'local', localFont: 'My "Mono"' });
  assert.match(fontStack(settings), /^"My Mono", ui-monospace/);
  assert.match(fontStack(normalizeSettings({ font: 'local', localFont: '' })), /^ui-monospace/);
});
