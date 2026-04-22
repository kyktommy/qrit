import { Box, Text } from 'ink';
import { useEffect, useState } from 'react';
import { renderQR } from '../lib/qr.ts';

type Props = { value: string };

export function QRCode({ value }: Props) {
  const [art, setArt] = useState<string>('');

  useEffect(() => {
    let alive = true;
    renderQR(value).then((s) => {
      if (alive) setArt(s);
    });
    return () => {
      alive = false;
    };
  }, [value]);

  if (!art) return null;
  return (
    <Box flexDirection="column">
      <Text>{art}</Text>
    </Box>
  );
}
