/**
 * OG 画像に使う日本語フォントをビルド時に取ってくる。
 *
 * Satori(next/og)は woff2 を読めないので、Google Fonts に
 * 古いブラウザの User-Agent を送って woff で返させる。
 * さらに text= で必要な字だけに絞るので、落ちてくるのは数 KB で済む。
 */
export async function loadJapaneseFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer | null> {
  const url =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`;

  try {
    const css = await fetch(url, {
      headers: {
        // 古い UA。今どきの UA を送ると woff2 が返り、Satori が読めない
        "User-Agent":
          "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36",
      },
    }).then((r) => (r.ok ? r.text() : null));

    if (!css) return null;

    // Google が返すのは woff。Satori は woff/ttf/otf を読めるが woff2 は読めない
    const src = css.match(/src:\s*url\(([^)]+)\)\s*format\('(truetype|opentype|woff)'\)/);
    if (!src) return null;

    const res = await fetch(src[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    // 取得に失敗してもビルドは通す。呼び出し側が欧文だけの版に落とす
    return null;
  }
}
