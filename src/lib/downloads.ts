import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, extname, join } from 'node:path';

export function downloadsDir(): string {
  const dir = join(homedir(), 'Downloads');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o755 });
  return dir;
}

export function sanitizeFilename(name: string): string {
  const base = basename(name);
  if (base === '.' || base === '/' || base === '') return 'upload';
  return base;
}

export function uniquePath(p: string): string {
  if (!existsSync(p)) return p;
  const ext = extname(p);
  const stem = basename(p, ext);
  const dir = p.slice(0, -basename(p).length);
  for (let i = 1; ; i++) {
    const candidate = `${dir}${stem} (${i})${ext}`;
    if (!existsSync(candidate)) return candidate;
  }
}

export function isURL(s: string): boolean {
  return s.startsWith('http://') || s.startsWith('https://');
}
