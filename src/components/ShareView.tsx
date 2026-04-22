import { Box, Text, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { useEffect, useState } from 'react';
import type { SharedFile } from '../lib/files.ts';
import { ShareServer, type UploadEvent } from '../server/index.ts';
import { QRCode } from './QRCode.tsx';

type Props = {
  files: SharedFile[];
  host: string;
  port: number;
};

const MAX_FEED = 8;

export function ShareView({ files, host, port }: Props) {
  const { exit } = useApp();
  const [server] = useState(() => new ShareServer(files, host, port));
  const [feed, setFeed] = useState<UploadEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onUpload = (e: UploadEvent) => {
      setFeed((prev) => [e, ...prev].slice(0, MAX_FEED));
    };
    const onError = (err: Error) => setError(err.message);
    server.on('upload', onUpload);
    server.on('error', onError);
    server.start();

    const shutdown = async () => {
      await server.stop();
      exit();
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    return () => {
      server.off('upload', onUpload);
      server.off('error', onError);
      process.off('SIGINT', shutdown);
      process.off('SIGTERM', shutdown);
      void server.stop();
    };
  }, [server, exit]);

  const url = server.url;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          {url}
        </Text>
      </Box>

      <QRCode value={url} />

      <Box marginTop={1} flexDirection="column">
        <Text color="gray">
          <Spinner type="dots" /> Listening — scan the QR to open the share page.
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Shared ({files.length})</Text>
        {files.length === 0 ? (
          <Text color="gray">  (upload-only — no files offered for download)</Text>
        ) : (
          files.map((f) => (
            <Text key={f.name}>
              {'  '}
              <Text color="green">↓</Text> {f.name}{' '}
              <Text color="gray">{f.sizeHuman}</Text>
            </Text>
          ))
        )}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Uploads</Text>
        {feed.length === 0 ? (
          <Text color="gray">  (none yet — uploads land in ~/Downloads)</Text>
        ) : (
          feed.map((e) => (
            <Text key={`${e.at.getTime()}-${e.name}`}>
              {'  '}
              <Text color="magenta">↑</Text> {e.name}{' '}
              <Text color="gray">
                {e.sizeHuman} · from {e.from}
              </Text>
            </Text>
          ))
        )}
      </Box>

      {error && (
        <Box marginTop={1}>
          <Text color="red">error: {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color="gray">press Ctrl+C to stop</Text>
      </Box>
    </Box>
  );
}
