import assert from 'node:assert/strict';
import test from 'node:test';
import { activeSentence, sentenceRanges } from '../src/focus.ts';

void test('sentences keep common abbreviations and decimals together', () => {
  const text = 'Dr. Smith paid 3.14. Next sentence!';
  assert.deepEqual(sentenceRanges(text), [
    { from: 0, to: 20 },
    { from: 21, to: 35 },
  ]);
});

void test('sentence focus follows cursor and keeps Markdown marks in the source', () => {
  const text = '**First sentence.** Then another?';
  assert.deepEqual(activeSentence(text, 4), { from: 0, to: 19 });
  assert.deepEqual(activeSentence(text, text.length), { from: 20, to: text.length });
});

void test('blank or unpunctuated text remains a single focus range', () => {
  assert.deepEqual(activeSentence('', 0), { from: 0, to: 0 });
  assert.deepEqual(activeSentence('A quiet line', 5), { from: 0, to: 12 });
});

void test('sentence-ending ellipses and Unicode sentence marks split at the following space', () => {
  assert.deepEqual(sentenceRanges('Wait... Then write。 Next'), [
    { from: 0, to: 7 },
    { from: 8, to: 19 },
    { from: 20, to: 24 },
  ]);
});

void test('ellipses followed by lowercase words stay in the same sentence', () => {
  for (const mark of ['...', '…']) {
    const text = `The woods were barren${mark} the trees had grown. A new thought.`;
    const next = text.indexOf(' A new thought.');
    assert.deepEqual(sentenceRanges(text), [
      { from: 0, to: next },
      { from: next + 1, to: text.length },
    ]);
    assert.deepEqual(activeSentence(text, text.indexOf('trees')), { from: 0, to: next });
  }
});

void test('Markdown emphasis does not split a common abbreviation', () => {
  assert.deepEqual(sentenceRanges('**Dr. Smith** wrote. Next.'), [
    { from: 0, to: 20 },
    { from: 21, to: 26 },
  ]);
});
