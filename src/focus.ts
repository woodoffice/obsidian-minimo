export interface TextRange { from: number; to: number }

const abbreviation = /(?:^|\s|[([])(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|U\.S|U\.K)\.$/i;

export function sentenceRanges(text: string): TextRange[] {
  const ranges: TextRange[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const mark = text[i];
    if (!'.!?…。！？'.includes(mark)) continue;
    if (mark === '.' && (text[i + 1] === '.' || (text[i - 1] === '.' && text[i - 2] !== '.'))) continue;
    if (mark === '.' && /\d/.test(text[i - 1] ?? '') && /\d/.test(text[i + 1] ?? '')) continue;
    if (mark === '.' && abbreviation.test(text.slice(start, i + 1))) continue;

    let end = i + 1;
    while (/["'”’）)\]*_`]/.test(text[end] ?? '')) end++;
    if (end < text.length && !/\s/.test(text[end])) continue;
    ranges.push({ from: start, to: end });
    start = end;
    while (/\s/.test(text[start] ?? '') && start < text.length) start++;
    i = start - 1;
  }
  if (start < text.length || ranges.length === 0) ranges.push({ from: start, to: text.length });
  return ranges;
}

export function activeSentence(text: string, cursor: number): TextRange {
  const ranges = sentenceRanges(text);
  const clamped = Math.max(0, Math.min(text.length, cursor));
  return ranges.find((range) => clamped >= range.from && clamped <= range.to)
    ?? ranges[ranges.length - 1];
}
