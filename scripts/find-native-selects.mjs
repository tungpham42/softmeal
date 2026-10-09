#!/usr/bin/env node
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const scanRoots = ['app', 'components'];
const extensions = new Set(['.tsx', '.jsx', '.ts', '.js']);
const ignored = new Set(['node_modules', '.next', 'dist', 'build', '.git']);
const hits = [];

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    if (entry.isDirectory() && ignored.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath);
      continue;
    }
    if (!entry.isFile() || !extensions.has(path.extname(entry.name))) continue;

    const source = await readFile(fullPath, 'utf8');
    const lines = source.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (/<select\b/i.test(line)) {
        hits.push(`${path.relative(root, fullPath)}:${index + 1}: ${line.trim()}`);
      }
    });
  }
}

for (const scanRoot of scanRoots) await walk(path.join(root, scanRoot));

if (!hits.length) {
  console.log('No native <select> opening tags found in app/ or components/.');
  process.exit(0);
}
console.log(`Found ${hits.length} possible native select opening tag(s):\n`);
console.log(hits.join('\n'));
