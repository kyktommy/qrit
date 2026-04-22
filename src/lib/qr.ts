import QRCode from 'qrcode';

// ANSI colors for half-block rendering: each terminal row renders two QR rows
// with the UPPER HALF BLOCK (▀). Foreground = top pixel, background = bottom.
const FG_BLACK = '\x1b[30m';
const FG_WHITE = '\x1b[37m';
const BG_BLACK = '\x1b[40m';
const BG_WHITE = '\x1b[47m';
const RESET = '\x1b[0m';
const HALF = '▀'; // ▀

type Matrix = { size: number; data: ArrayLike<number> };

function isBlack(m: Matrix, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= m.size || y >= m.size) return false;
  return m.data[y * m.size + x] === 1;
}

export async function renderQR(text: string, quietZone = 2): Promise<string> {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'L' });
  const size = qr.modules.size;
  const data = qr.modules.data;
  const m: Matrix = { size, data };

  const total = size + quietZone * 2;
  const lines: string[] = [];

  for (let y = -quietZone; y < size + quietZone; y += 2) {
    let line = '';
    for (let x = -quietZone; x < size + quietZone; x++) {
      const top = isBlack(m, x, y);
      const bot = y + 1 < size + quietZone ? isBlack(m, x, y + 1) : false;
      const fg = top ? FG_BLACK : FG_WHITE;
      const bg = bot ? BG_BLACK : BG_WHITE;
      line += `${fg}${bg}${HALF}`;
    }
    lines.push(`${line}${RESET}`);
  }
  return lines.join('\n');
}

/** Measure the rendered QR's character dimensions for layout. */
export function qrDimensions(text: string, quietZone = 2): { cols: number; rows: number } {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'L' });
  const total = qr.modules.size + quietZone * 2;
  return { cols: total, rows: Math.ceil(total / 2) };
}
