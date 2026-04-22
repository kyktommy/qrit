import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { downloadsDir, sanitizeFilename, uniquePath } from '../lib/downloads.ts';
import { humanSize, type SharedFile } from '../lib/files.ts';
import { renderIndex } from './page.ts';

export type UploadEvent = {
  name: string;
  path: string;
  size: number;
  sizeHuman: string;
  from: string;
  at: Date;
};

export type ShareEvents = {
  upload: (e: UploadEvent) => void;
  error: (err: Error) => void;
};

export class ShareServer extends EventEmitter {
  private server?: ReturnType<typeof Bun.serve>;
  private byName: Map<string, SharedFile>;

  constructor(
    private files: SharedFile[],
    private host: string,
    private port: number,
  ) {
    super();
    this.byName = new Map(files.map((f) => [f.name, f]));
  }

  get url(): string {
    return `http://${this.host}:${this.port}/`;
  }

  start(): void {
    this.server = Bun.serve({
      hostname: this.host,
      port: this.port,
      fetch: (req) => this.handle(req),
      error: (err) => {
        this.emit('error', err);
        return new Response('internal error', { status: 500 });
      },
    });
  }

  async stop(): Promise<void> {
    await this.server?.stop(true);
  }

  private async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const { pathname } = url;

    if (req.method === 'GET' && pathname === '/') {
      return new Response(renderIndex(this.files), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (req.method === 'GET' && pathname.startsWith('/send/')) {
      const name = decodeURIComponent(pathname.slice('/send/'.length));
      const f = this.byName.get(name);
      if (!f) return new Response('not found', { status: 404 });
      const file = Bun.file(f.path);
      return new Response(file, {
        headers: {
          'Content-Disposition': `attachment; filename="${f.name}"`,
          'Content-Length': String(f.size),
        },
      });
    }

    if (pathname === '/upload') {
      if (req.method !== 'POST') {
        return new Response('method not allowed', { status: 405 });
      }
      return this.handleUpload(req);
    }

    return new Response('not found', { status: 404 });
  }

  private async handleUpload(req: Request): Promise<Response> {
    let form: FormData;
    try {
      form = await req.formData();
    } catch (err) {
      return new Response(`bad form: ${(err as Error).message}`, { status: 400 });
    }
    const files = form.getAll('files').filter((v): v is File => v instanceof File);
    if (files.length === 0) return new Response('no files', { status: 400 });

    const remoteAddr =
      this.server?.requestIP(req)?.address ?? req.headers.get('x-forwarded-for') ?? 'unknown';
    const dir = downloadsDir();
    const saved: string[] = [];

    for (const file of files) {
      const dest = uniquePath(join(dir, sanitizeFilename(file.name)));
      try {
        const nodeStream = Readable.fromWeb(file.stream() as never);
        await pipeline(nodeStream, createWriteStream(dest, { flags: 'wx', mode: 0o644 }));
      } catch (err) {
        return new Response(`save: ${(err as Error).message}`, { status: 500 });
      }
      saved.push(dest);
      this.emit('upload', {
        name: file.name,
        path: dest,
        size: file.size,
        sizeHuman: humanSize(file.size),
        from: remoteAddr,
        at: new Date(),
      } satisfies UploadEvent);
    }

    return new Response(`received: ${saved.join(', ')}\n`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
