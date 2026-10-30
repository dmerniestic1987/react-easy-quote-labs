export type GrayLevels = { levels: Uint8Array; width: number; height: number };

/** Box-filter downscale of a 0..15 gray level image so its longest side is at most `maxSide`. */
export function downscaleLevels(levels: Uint8Array, width: number, height: number, maxSide: number): GrayLevels {
  const factor = Math.max(1, Math.ceil(Math.max(width, height) / maxSide));
  const outWidth = Math.ceil(width / factor);
  const outHeight = Math.ceil(height / factor);
  const out = new Uint8Array(outWidth * outHeight);
  for (let oy = 0; oy < outHeight; oy++) {
    const y0 = oy * factor;
    const y1 = Math.min(height, y0 + factor);
    for (let ox = 0; ox < outWidth; ox++) {
      const x0 = ox * factor;
      const x1 = Math.min(width, x0 + factor);
      let sum = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) sum += levels[y * width + x];
      out[oy * outWidth + ox] = Math.round(sum / ((y1 - y0) * (x1 - x0)));
    }
  }
  return { levels: out, width: outWidth, height: outHeight };
}
