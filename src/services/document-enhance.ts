/**
 * Document photo cleanup for prescriptions: removes shadows and uneven lighting, flattens the paper to pure white
 * and keeps the ink in 16 gray levels (4 bits per pixel). Pure functions, no DOM: runs in a Web Worker or in Node.
 *
 * Pipeline (validated on synthetic and real prescription photos):
 *  1. Per color channel: light denoise, estimate the paper brightness (downscale, max filter to erase strokes,
 *     blur, upscale) and divide the channel by it. This flattens shadows and removes the color cast.
 *  2. Take the darkest channel, so blue pen stays as dark as black ink.
 *  3. Sauvola local threshold decides WHERE the ink is; everything else becomes pure white (cleaner and
 *     much smaller after PNG compression).
 *  4. A tone curve maps the ink to 16 levels, keeping anti-aliasing and pen pressure.
 */

export const GRAY_LEVELS = 16;

const DENOISE_RADIUS = 1;
const BACKGROUND_SCALE = 4;
const BACKGROUND_MAX_RADIUS = 3;
const BACKGROUND_BLUR_RADIUS = 2;
const WHITE_POINT = 0.88;
const BLACK_PERCENTILE = 0.005;
const MIN_TONE_RANGE = 8;
const GAMMA = 1.6;
const SAUVOLA_RADIUS = 20;
const SAUVOLA_K = 0.2;
const INK_DILATE_RADIUS = 2;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Box blur with replicated borders. `dst` may be the same array as `src`; `tmp` must be a different one. */
function boxBlur(src: Float32Array, dst: Float32Array, tmp: Float32Array, w: number, h: number, r: number): void {
  const size = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[row + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / size;
      sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  // Vertical pass walks row by row with one running sum per column: cache friendly.
  const column = new Float64Array(w);
  for (let y = -r; y <= r; y++) {
    const row = clamp(y, 0, h - 1) * w;
    for (let x = 0; x < w; x++) column[x] += tmp[row + x];
  }
  for (let y = 0; y < h; y++) {
    const out = y * w;
    for (let x = 0; x < w; x++) dst[out + x] = column[x] / size;
    const add = Math.min(h - 1, y + r + 1) * w;
    const sub = Math.max(0, y - r) * w;
    for (let x = 0; x < w; x++) column[x] += tmp[add + x] - tmp[sub + x];
  }
}

function maxFilter(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) m = Math.max(m, src[y * w + k]);
      tmp[y * w + x] = m;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) m = Math.max(m, tmp[k * w + x]);
      out[y * w + x] = m;
    }
  }
  return out;
}

/** Paper brightness map, same size as the input. Strokes are erased because they are thinner than the max filter. */
function estimateBackground(src: Float32Array, out: Float32Array, w: number, h: number): void {
  const s = Math.max(1, Math.min(BACKGROUND_SCALE, Math.floor(Math.min(w, h) / 16)));
  const sw = Math.floor(w / s);
  const sh = Math.floor(h / s);

  let small: Float32Array = new Float32Array(sw * sh);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      let acc = 0;
      for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) acc += src[(y * s + j) * w + x * s + i];
      small[y * sw + x] = acc / (s * s);
    }
  }
  small = maxFilter(small, sw, sh, BACKGROUND_MAX_RADIUS);
  const scratch = new Float32Array(sw * sh);
  boxBlur(small, small, scratch, sw, sh, BACKGROUND_BLUR_RADIUS);
  boxBlur(small, small, scratch, sw, sh, BACKGROUND_BLUR_RADIUS);

  const x0 = new Int32Array(w);
  const x1 = new Int32Array(w);
  const fx = new Float32Array(w);
  for (let x = 0; x < w; x++) {
    const f = clamp((x + 0.5) / s - 0.5, 0, sw - 1);
    x0[x] = Math.floor(f);
    x1[x] = Math.min(sw - 1, x0[x] + 1);
    fx[x] = f - x0[x];
  }
  for (let y = 0; y < h; y++) {
    const f = clamp((y + 0.5) / s - 0.5, 0, sh - 1);
    const y0 = Math.floor(f);
    const y1 = Math.min(sh - 1, y0 + 1);
    const dy = f - y0;
    for (let x = 0; x < w; x++) {
      const top = small[y0 * sw + x0[x]] * (1 - fx[x]) + small[y0 * sw + x1[x]] * fx[x];
      const bottom = small[y1 * sw + x0[x]] * (1 - fx[x]) + small[y1 * sw + x1[x]] * fx[x];
      out[y * w + x] = Math.max(1, top * (1 - dy) + bottom * dy);
    }
  }
}

/** Separable square dilation of a 0/1 mask. */
function dilate(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r) && !v; k++) v = mask[y * w + k];
      tmp[y * w + x] = v;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r) && !v; k++) v = tmp[k * w + x];
      out[y * w + x] = v;
    }
  }
  return out;
}

/**
 * @param rgba pixels as returned by `getImageData` (4 bytes per pixel)
 * @returns one byte per pixel with a gray level from 0 (black) to 15 (white)
 */
export function enhanceDocument(rgba: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const n = width * height;

  // Steps 1 and 2: lighting-normalized darkest channel, 0..255 where the paper is ~255.
  const norm = new Float32Array(n).fill(255);
  const a = new Float32Array(n);
  const b = new Float32Array(n);
  const c = new Float32Array(n);
  for (let channel = 0; channel < 3; channel++) {
    for (let i = 0; i < n; i++) a[i] = rgba[i * 4 + channel];
    boxBlur(a, b, c, width, height, DENOISE_RADIUS);
    estimateBackground(b, c, width, height);
    for (let i = 0; i < n; i++) {
      const v = (255 * b[i]) / c[i];
      if (v < norm[i]) norm[i] = v;
    }
  }

  // Tone curve end points: black from a low percentile, white fixed just below the paper level.
  const histogram = new Uint32Array(1024);
  for (let i = 0; i < n; i++) histogram[Math.min(1023, Math.floor(norm[i] * 4))]++;
  let seen = 0;
  let bin = 0;
  while (bin < 1023 && seen + histogram[bin] < n * BLACK_PERCENTILE) seen += histogram[bin++];
  const white = WHITE_POINT * 255;
  const black = Math.min(bin / 4, white - MIN_TONE_RANGE);
  const toneLut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    const t = clamp((v - black) / (white - black), 0, 1);
    toneLut[v] = Math.round((GRAY_LEVELS - 1) * t ** GAMMA);
  }

  // Step 3: Sauvola threshold. Reuse the scratch buffers: a = mean of squares, b = mean.
  for (let i = 0; i < n; i++) a[i] = norm[i] * norm[i];
  boxBlur(norm, b, c, width, height, SAUVOLA_RADIUS);
  boxBlur(a, a, c, width, height, SAUVOLA_RADIUS);
  const rawInk = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const std = Math.sqrt(Math.max(0, a[i] - b[i] * b[i]));
    rawInk[i] = norm[i] < b[i] * (1 + SAUVOLA_K * (std / 128 - 1)) ? 1 : 0;
  }
  const ink = dilate(rawInk, width, height, INK_DILATE_RADIUS);

  // Step 4: paper becomes white, ink keeps its tone.
  const out = new Uint8Array(n);
  const WHITE = GRAY_LEVELS - 1;
  for (let i = 0; i < n; i++) out[i] = ink[i] ? toneLut[Math.round(norm[i])] : WHITE;
  return out;
}
