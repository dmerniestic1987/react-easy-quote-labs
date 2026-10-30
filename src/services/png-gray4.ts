/** A 4-bit PNG always has 16 levels: 0 is black and 15 is white. */
const MAX_LEVEL = 15;

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

async function deflate(raw: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Fallback for browsers without CompressionStream: an 8-bit grayscale PNG made by the canvas (larger file). */
async function encodeWithCanvas(levels: Uint8Array, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  const image = ctx.createImageData(width, height);
  const step = 255 / MAX_LEVEL;
  for (let i = 0; i < levels.length; i++) {
    const v = Math.round(levels[i] * step);
    image.data[i * 4] = v;
    image.data[i * 4 + 1] = v;
    image.data[i * 4 + 2] = v;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png'),
  );
}

/**
 * Encodes gray levels 0 (black) to 15 (white) as a real 4-bit grayscale PNG. `canvas.toDataURL` cannot do this:
 * it always writes 8 bits per channel plus alpha, which makes the file 2-4 times larger.
 */
export async function encodeGray4Png(levels: Uint8Array, width: number, height: number): Promise<Blob> {
  if (typeof CompressionStream === 'undefined') return encodeWithCanvas(levels, width, height);

  const stride = Math.ceil(width / 2);
  const raw = new Uint8Array(new ArrayBuffer((stride + 1) * height)); // filter byte 0 (None) + packed row
  for (let y = 0; y < height; y++) {
    const out = y * (stride + 1) + 1;
    const row = y * width;
    for (let x = 0; x < width; x += 2) {
      const high = levels[row + x];
      const low = x + 1 < width ? levels[row + x + 1] : 0;
      raw[out + (x >> 1)] = (high << 4) | low;
    }
  }

  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header.set([4, 0, 0, 0, 0], 8); // bit depth 4, color type 0 (grayscale), default compression/filter, no interlace

  const body = await deflate(raw);
  return new Blob(
    [new Uint8Array(PNG_SIGNATURE), chunk('IHDR', header), chunk('IDAT', body), chunk('IEND', new Uint8Array())],
    { type: 'image/png' },
  );
}
