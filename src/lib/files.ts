import { readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

export type SharedEntry = {
  kind: 'file' | 'dir';
  name: string; // URL-safe basename
  path: string; // absolute path on disk
  size: number; // bytes (sum of all files inside, for dirs)
  sizeHuman: string;
  fileCount?: number; // for dirs only
};

export function humanSize(n: number): string {
  const unit = 1024;
  if (n < unit) return `${n} B`;
  const units = ['K', 'M', 'G', 'T', 'P', 'E'];
  let div = unit;
  let exp = 0;
  for (let x = Math.floor(n / unit); x >= unit; x = Math.floor(x / unit)) {
    div *= unit;
    exp++;
  }
  const unitChar = units[exp] ?? 'E';
  return `${(n / div).toFixed(1)} ${unitChar}B`;
}

function walkDir(root: string): { size: number; count: number } {
  let size = 0;
  let count = 0;
  const stack = [root];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const e of readdirSync(cur, { withFileTypes: true })) {
      if (e.name.startsWith('.')) continue; // skip hidden
      const p = join(cur, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.isFile()) {
        size += statSync(p).size;
        count++;
      }
    }
  }
  return { size, count };
}

export function resolveShares(args: string[]): SharedEntry[] {
  return args.map((a) => {
    const abs = resolve(a);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(abs);
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      if (e.code === 'ENOENT') throw new Error(`file not found: ${abs}`);
      throw new Error(`stat ${a}: ${e.message}`);
    }
    const name = basename(abs).replaceAll(' ', '-');
    if (stat.isDirectory()) {
      const { size, count } = walkDir(abs);
      return { kind: 'dir', name, path: abs, size, sizeHuman: humanSize(size), fileCount: count };
    }
    return { kind: 'file', name, path: abs, size: stat.size, sizeHuman: humanSize(stat.size) };
  });
}
