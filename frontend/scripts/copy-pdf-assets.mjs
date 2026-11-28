// Copies the pdf.js runtime assets out of node_modules into public/pdfjs so the
// PDF tool works offline, behind a strict CSP, and always matches the installed
// pdfjs-dist version. Runs automatically via the "postinstall" script.
//
// public/pdfjs is generated output and is git-ignored.

import { cp, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const packageRoot = process.cwd();
const source = path.join(packageRoot, 'node_modules', 'pdfjs-dist');
const target = path.join(packageRoot, 'public', 'pdfjs');

const FILES = ['build/pdf.worker.min.mjs'];
const DIRECTORIES = ['cmaps', 'standard_fonts', 'wasm'];

async function exists(candidate) {
  try {
    await stat(candidate);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(source))) {
  console.warn('[pdfjs] pdfjs-dist is not installed; skipping asset copy.');
  process.exit(0);
}

await mkdir(target, { recursive: true });

for (const file of FILES) {
  const from = path.join(source, file);
  if (!(await exists(from))) {
    console.warn(`[pdfjs] missing ${file}; skipping.`);
    continue;
  }
  await cp(from, path.join(target, path.basename(file)));
}

for (const directory of DIRECTORIES) {
  const from = path.join(source, directory);
  if (!(await exists(from))) {
    console.warn(`[pdfjs] missing ${directory}/; skipping.`);
    continue;
  }
  await cp(from, path.join(target, directory), { recursive: true });
}

console.log(`[pdfjs] runtime assets copied to ${path.relative(packageRoot, target)}/`);
