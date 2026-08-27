import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import path from "node:path";
import { OG_CONTENT, OG_SIZE, ogGlyphs, type OgRoute } from "./og-content";
import { loadJapaneseFont } from "./og-font";

/**
 * OG 画像(F-15)。
 *
 * 写真を持たない(N-02)ので、ここもトップのヒーローと同じ考え方で
 * 配線と等高線を線で描く。ただし Satori は放射グラデーションの
 * 再現が弱いので、光は線形にしてある(sugi-nami の実測)。
 *
 * フォントの取得はビルド時にだけ走る。SPEC N-07 の例外はこの経路だけ。
 */

const FALLBACK_FONT = path.join(
  process.cwd(),
  "src/assets/latin-fallback.woff",
);

const COLOR = {
  bg: "#0f1620",
  panel: "#16202c",
  line: "#24313f",
  copper: "#c98a52",
  bright: "#e6b17e",
  text: "#eef2f6",
  dim: "#94a3b4",
} as const;

export async function ogImage(route: OgRoute) {
  const content = OG_CONTENT[route];

  // 描く字だけに絞って取る。取れなくてもビルドは通す(欧文の部分集合に落ちる)
  const japanese = await loadJapaneseFont(
    "Zen Kaku Gothic New",
    500,
    ogGlyphs(),
  );
  const fallback = readFileSync(FALLBACK_FONT);

  const fonts = japanese
    ? [{ name: "og", data: japanese, weight: 500 as const, style: "normal" as const }]
    : [
        {
          name: "og",
          data: fallback.buffer.slice(
            fallback.byteOffset,
            fallback.byteOffset + fallback.byteLength,
          ) as ArrayBuffer,
          weight: 400 as const,
          style: "normal" as const,
        },
      ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: COLOR.bg,
          // Satori は放射グラデーションが弱いので線形にする
          backgroundImage: `linear-gradient(120deg, ${COLOR.panel} 0%, ${COLOR.bg} 55%, ${COLOR.bg} 100%)`,
          fontFamily: "og",
          padding: "64px 72px",
          position: "relative",
        }}
      >
        {/* 配線。直交と 45 度だけで曲がる(トップのヒーローと同じ約束) */}
        <svg
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          viewBox={`0 0 ${OG_SIZE.width} ${OG_SIZE.height}`}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {TRACES.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={i % 3 === 0 ? COLOR.bright : COLOR.copper}
              strokeOpacity={i % 3 === 0 ? 0.45 : 0.22}
              strokeWidth={i % 3 === 0 ? 3 : 1.6}
            />
          ))}
        </svg>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              color: COLOR.copper,
              letterSpacing: 6,
            }}
          >
            {content.subtitle}
          </div>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              flexDirection: "column",
              fontSize: 66,
              color: COLOR.text,
              lineHeight: 1.35,
            }}
          >
            {content.title.map((line) => (
              <div key={line} style={{ display: "flex" }}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 20,
            color: COLOR.dim,
          }}
        >
          <div style={{ display: "flex" }}>{content.note}</div>
          <div style={{ display: "flex", color: COLOR.copper, letterSpacing: 4 }}>
            CHIKUMA SEIKI
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

/**
 * 背景の配線。式で出すと Satori の中で計算が要るので、
 * ここは書き下しにしてある。直交と 45 度だけで曲がる。
 */
const TRACES = [
  "M0 96 L620 96 L700 176 L1200 176",
  "M0 168 L360 168 L440 248 L1200 248",
  "M0 240 L820 240 L900 320 L1200 320",
  "M0 330 L280 330 L360 410 L1200 410",
  "M0 420 L560 420 L640 500 L1200 500",
  "M0 508 L960 508 L1040 588 L1200 588",
];
