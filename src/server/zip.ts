import archiver from 'archiver';
import { Readable } from 'node:stream';
import type { SharedEntry } from '../lib/files.ts';

/**
 * Stream a zip archive of the given entries as a Response body.
 *
 * The archive is built on the fly — no temp file ever lands on disk, so there's
 * nothing to clean up after the download completes (or is cancelled).
 * Cancelling the response aborts the archiver via the web stream's cancel(),
 * which destroys the underlying node stream.
 */
export function zipResponse(entries: SharedEntry[], filename: string): Response {
  const archive = archiver('zip', { zlib: { level: 6 } });

  for (const entry of entries) {
    if (entry.kind === 'dir') archive.directory(entry.path, entry.name);
    else archive.file(entry.path, { name: entry.name });
  }

  // archiver errors propagate as stream errors → Response body closes
  archive.on('warning', (err) => {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') archive.destroy(err);
  });

  void archive.finalize();

  const body = Readable.toWeb(archive) as unknown as BodyInit;
  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
