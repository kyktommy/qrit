import { statSync } from 'node:fs';
import { basename, resolve } from 'node:path';

export type SharedFile = {
  name: string;
  path: string;
  size: number;
  sizeHuman: string;
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

export function resolveShares(args: string[]): SharedFile[] {
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
    if (stat.isDirectory()) throw new Error(`directory not supported: ${abs}`);
    const name = basename(abs).replaceAll(' ', '-');
    return { name, path: abs, size: stat.size, sizeHuman: humanSize(stat.size) };
  });
}
