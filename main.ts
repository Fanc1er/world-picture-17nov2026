// News image entry (Node 22, standard library only): validates the entry.png beside this file
// and copies it to ${MAKEFUN_OUTPUT_DIR:-/output}/entry.png. The grader accepts a whole PNG of
// at most 1 MiB and exactly 1024x1024 pixels; the judge sees exactly the bytes copied.
//
// Local test:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node --experimental-strip-types main.ts

import { copyFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1048576; // 1 MiB
const REQUIRED_SIZE = 1024;

const VALIDATION_FAILED = Symbol('validation-failed');

function fail(message: string): never {
  console.error(`entry.png validation failed: ${message}`);
  process.exitCode = 1;
  throw VALIDATION_FAILED;
}

function validateDimensions(width: number, height: number): void {
  if (width !== REQUIRED_SIZE || height !== REQUIRED_SIZE) {
    fail(`image must be exactly ${REQUIRED_SIZE}x${REQUIRED_SIZE}, got ${width}x${height}`);
  }
}

function validatePng(path: string): void {
  const bytes = readFileSync(path);

  if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
    fail('not a PNG file (magic number 89 50 4E 47 0D 0A 1A 0A not found)');
  }

  if (bytes.length > MAX_BYTES) {
    fail(`file is ${bytes.length} bytes, exceeding the 1 MiB limit by ${bytes.length - MAX_BYTES} bytes`);
  }

  // IHDR block: width at bytes 16-19, height at bytes 20-23 (big-endian uint32).
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  validateDimensions(width, height);
}

async function main(): Promise<void> {
  const source = new URL('./entry.png', import.meta.url);
  try {
    validatePng(source);
  } catch (e) {
    if (e !== VALIDATION_FAILED) throw e;
    return;
  }
  copyFileSync(source, join(process.env.MAKEFUN_OUTPUT_DIR ?? '/output', 'entry.png'));
}

await main();
