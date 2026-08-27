import { COMPANY, HEADCOUNT, headcountTotal } from "@/data/company";
import { HISTORY } from "@/data/history";
import { DONUT, donutSlices } from "@/lib/chart";
import { AreaMap } from "@/components/AreaMap";

/**
 * 会社案内(F-06)。
 *
 * 架空である旨の明示 4 箇所のうちの 1 箇所(F-13)。
 * 会社概要の表は、番地・電話番号・資本金の欄を**そもそも持たない**(SPEC §6)。
 */

const SLICE_COLOR = [
  "var(--color-do)",
  "var(--color-hanare)",
  "var(--color-seiji)",
  "var(--color-hakuro)",
  "var(--color-usu)",
] as const;

export function CompanyView() {
  const total = headcountTotal();
  const slices = donutSlices(HEADCOUNT);

  return (
    <>
      <section className="border-b border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.3em] text-do">会社案内</p>
          <h1 className="mt-4 max-w-3xl text-3xl leading-snug">
            {COMPANY.name}
          </h1>
          <p className="mt-3 text-xs tracking-[0.28em] text-usu">
            {COMPANY.nameEn.toUpperCase()}
          </p>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-usu">
            {COMPANY.address.region}
            {COMPANY.address.locality}、{COMPANY.address.detail}。
            {COMPANY.founded} 年の創業から {2026 - COMPANY.founded} 年、
            同じ土地で少量多品種の受託製造を続けています。
          </p>
        </div>
      </section>

      {/* 会社概要 */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xs tracking-[0.3em] text-do">会社概要</h2>
            <dl className="mt-6 divide-y divide-suji/60 text-sm">
              <Row label="商号">
                {COMPANY.name}
                <span className="ml-2 text-xs text-usu">
                  ({COMPANY.nameKana})
                </span>
              </Row>
              <Row label="英文表記">{COMPANY.nameEn}</Row>
              <Row label="創業">{COMPANY.founded} 年</Row>
              <Row label="所在地">
                {COMPANY.address.region}
                {COMPANY.address.locality}
                <br />
                <span className="text-usu">{COMPANY.address.detail}</span>
              </Row>
              <Row label="従業員数">
                <span className="tabular">{COMPANY.employees}</span> 名
              </Row>
              <Row label="事業内容">
                電子機器受託製造(EMS)
                <br />
                自動化・データ分析システムの受託開発
              </Row>
              <Row label="主要設備">
                表面実装機、自動光学検査装置、
                <br />
                クリーンルーム(クラス 10000 対応)
              </Row>
            </dl>
            <p className="mt-6 text-xs leading-relaxed text-usu/80">
              番地・電話番号・資本金は掲載していません。架空の企業であり、
              実在の連絡先として使われることを避けるためです。
            </p>
          </div>

          {/* 内訳 */}
          <div>
            <h2 className="text-xs tracking-[0.3em] text-do">陣容</h2>
            <div className="mt-6 flex flex-wrap items-center gap-8">
              <svg
                viewBox={`0 0 ${DONUT.size} ${DONUT.size}`}
                className="w-56 shrink-0"
                role="img"
                aria-label={`従業員 ${total} 名の部門別内訳`}
              >
                {slices.map((s, i) => (
                  <path
                    key={s.id}
                    d={s.d}
                    fill={SLICE_COLOR[i % SLICE_COLOR.length]}
                    fillOpacity="0.85"
                    stroke="var(--color-tetsu)"
                    strokeWidth="1.5"
                  >
                    <title>{`${s.name} ${s.count} 名(${Math.round((s.count / total) * 100)}%)`}</title>
                  </path>
                ))}
                <text
                  x={DONUT.size / 2}
                  y={DONUT.size / 2 - 4}
                  fontSize="30"
                  fill="var(--color-hakuro)"
                  textAnchor="middle"
                  className="tabular"
                >
                  {total}
                </text>
                <text
                  x={DONUT.size / 2}
                  y={DONUT.size / 2 + 18}
                  fontSize="12"
                  fill="var(--color-usu)"
                  textAnchor="middle"
                >
                  名
                </text>
              </svg>

              <ul className="min-w-52 flex-1 space-y-2 text-sm">
                {slices.map((s, i) => (
                  <li key={s.id} className="flex items-baseline gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs"
                      style={{
                        backgroundColor: SLICE_COLOR[i % SLICE_COLOR.length],
                      }}
                    />
                    <span className="text-hakuro">{s.name}</span>
                    <span className="tabular ml-auto text-usu">
                      {s.count} 名
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="mt-8 space-y-3 text-sm">
              {HEADCOUNT.map((d) => (
                <li key={d.id}>
                  <span className="text-hanare">{d.name}</span>
                  <span className="ml-2 text-usu">{d.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 沿革 */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-xs tracking-[0.3em] text-do">沿革</h2>
        <ol className="mt-8 border-l border-suji">
          {HISTORY.map((h) => (
            <li key={`${h.year}-${h.title}`} className="relative py-5 pl-8">
              <span className="absolute -left-[5px] top-8 h-2.5 w-2.5 rounded-full border border-do bg-tetsu" />
              <div className="flex flex-wrap items-baseline gap-x-4">
                <span className="tabular text-sm text-do">{h.year}</span>
                <h3 className="text-base text-hakuro">{h.title}</h3>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-usu">
                {h.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 所在地 */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-xs tracking-[0.3em] text-do">所在地</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <AreaMap className="w-full rounded-sm border border-suji" />
          <div>
            <p className="text-sm leading-relaxed text-usu">
              浅間山を背にして、千曲川に向かって落ちる河岸段丘のうえに佐久平があります。
              上信越自動車道と北陸新幹線がその中を走り、
              当社は佐久インターチェンジ付近の工業団地内にあります。
            </p>
            <p className="mt-4 text-sm leading-relaxed text-usu">
              この略図に縮尺はありません。番地も地図のピンも持っていません。
              実在の区画を指さないための設計です。
            </p>
          </div>
        </div>
      </section>

      {/* 架空明示(4 箇所のうちの 1 箇所) */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <p
          role="note"
          className="rounded border border-suji bg-ban/60 px-5 py-4 text-sm leading-relaxed text-usu"
        >
          {COMPANY.fictionNotice}
        </p>
      </section>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-4 py-3">
      <dt className="text-xs tracking-wider text-do">{label}</dt>
      <dd className="text-hakuro">{children}</dd>
    </div>
  );
}
