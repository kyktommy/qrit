#!/usr/bin/env bun
import { render } from 'ink';
import pkg from '../package.json' with { type: 'json' };
import { ShareView } from './components/ShareView.tsx';
import { resolveShares } from './lib/files.ts';
import { getLanIP, getRandomPort } from './lib/network.ts';
import { isURL } from './lib/downloads.ts';
import { renderQR } from './lib/qr.ts';

type Parsed = {
  port?: number;
  help: boolean;
  version: boolean;
  positional: string[];
};

function parseArgs(argv: string[]): Parsed {
  const out: Parsed = { help: false, version: false, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '-h' || a === '--help') out.help = true;
    else if (a === '-v' || a === '--version') out.version = true;
    else if (a === '-p' || a === '--port') {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n < 1 || n > 65535) {
        throw new Error(`invalid --port: ${argv[i]}`);
      }
      out.port = n;
    } else if (a.startsWith('--port=')) {
      const n = Number(a.slice('--port='.length));
      if (!Number.isInteger(n) || n < 1 || n > 65535) {
        throw new Error(`invalid --port: ${a}`);
      }
      out.port = n;
    } else out.positional.push(a);
  }
  return out;
}

const HELP = `qrit — turn a QR code into a two-way LAN file drop

usage:
  qrit <url>                print-only QR for a URL
  qrit <file...>            share files (also accepts uploads)
  qrit                      upload-only drop

options:
  -p, --port <n>            listen on a specific port (default: random)
  -v, --version             print version
  -h, --help                print this help

uploads are auto-saved to ~/Downloads.
`;

async function main() {
  let parsed: Parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    process.exit(2);
  }

  if (parsed.help) {
    process.stdout.write(HELP);
    return;
  }
  if (parsed.version) {
    process.stdout.write(`${pkg.version}\n`);
    return;
  }

  const args = parsed.positional;

  if (args.length === 1 && isURL(args[0]!)) {
    const url = args[0]!;
    process.stdout.write(`${url}\n\n`);
    process.stdout.write(`${await renderQR(url)}\n`);
    return;
  }

  let entries;
  try {
    entries = resolveShares(args);
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    process.exit(2);
  }

  let host: string;
  try {
    host = getLanIP();
  } catch (err) {
    process.stderr.write(`${(err as Error).message}\n`);
    process.exit(1);
  }
  const port = parsed.port ?? getRandomPort();

  render(<ShareView entries={entries} host={host} port={port} />);
}

void main();
