import { readFile, writeFile } from 'node:fs/promises';

const faces = [
  ['IBMPlexMono-Regular.woff2', 'normal', 400],
  ['IBMPlexMono-Italic.woff2', 'italic', 400],
  ['IBMPlexMono-Bold.woff2', 'normal', 700],
  ['IBMPlexMono-BoldItalic.woff2', 'italic', 700],
];

const license = (await readFile('fonts/OFL.txt', 'utf8')).split('\n').map((line) => line.trimEnd()).join('\n').trimEnd();
const rules = await Promise.all(faces.map(async ([file, style, weight]) => {
  const data = (await readFile(`fonts/${file}`)).toString('base64');
  return `@font-face { font-family: "Minimo IBM Plex Mono"; src: url("data:font/woff2;base64,${data}") format("woff2"); font-style: ${style}; font-weight: ${weight}; font-display: swap; }`;
}));
const styles = await readFile('src/styles.css', 'utf8');
await writeFile('styles.css', `/*\n${license}\n*/\n\n${rules.join('\n')}\n\n${styles}`);
