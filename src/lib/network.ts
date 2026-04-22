import { networkInterfaces } from 'node:os';

const PRIVATE_RANGES: Array<[number, number, number, number]> = [
  [10, 0, 0, 8],
  [172, 16, 0, 12],
  [192, 168, 0, 16],
];

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts as [number, number, number, number];
  for (const [ra, rb, , prefix] of PRIVATE_RANGES) {
    if (prefix === 8 && a === ra) return true;
    if (prefix === 12 && a === ra && b >= rb && b <= rb + 15) return true;
    if (prefix === 16 && a === ra && b === rb) return true;
  }
  return false;
}

export function getLanIP(): string {
  const ifaces = networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const addrs = ifaces[name];
    if (!addrs) continue;
    for (const a of addrs) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (isPrivateIPv4(a.address)) return a.address;
    }
  }
  throw new Error('no private IPv4 address found on any interface');
}

export function getRandomPort(): number {
  // Ephemeral range: 32768 - 61000
  return Math.floor(Math.random() * (61001 - 32768)) + 32768;
}
