/**
 * 種から回す擬似乱数。`Math.random` を使わないための最小の実装(N-03)。
 *
 * 静的書き出しとブラウザでの再描画が必ず一致する必要があるので、
 * 図やデモに使う「ばらつき」はすべてここを通す。
 */

/** 線形合同法 */
export function lcg(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * 標準正規分布(Box–Muller 法)。検査スコアのばらつきに使う。
 * 一様乱数のままだと分布の裾が無く、しきい値を動かしたときの
 * 見逃しと過検出の入れ替わりが階段状になって実感と合わない。
 */
export function gaussian(rnd: () => number): () => number {
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    // u が 0 だと log が発散するので、0 を避けて引き直す
    let u = rnd();
    while (u <= 0) u = rnd();
    const v = rnd();
    const mag = Math.sqrt(-2 * Math.log(u));
    spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  };
}

/** 0–1 に丸める */
export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}
