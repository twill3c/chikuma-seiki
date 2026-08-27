import { PROCESSES } from "@/data/process";
import { QUALITY_STANCE, RECORDS, TRACE_CHAIN } from "@/data/quality";
import { CLEANROOM_CLASSES } from "@/lib/airflow";
import { CleanroomSection } from "@/components/CleanroomSection";
import { LotDecoder } from "@/components/LotDecoder";

/**
 * 品質保証(F-05)。
 *
 * 「品質第一」と書く代わりに、**何を残しているか**を出す。
 * 見ていることと残していることは別で、後から問われたときに効くのは後者である。
 */
export function QualityView() {
  const processName = (id: string) =>
    PROCESSES.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <section className="border-b border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.3em] text-do">品質保証</p>
          <h1 className="mt-4 max-w-3xl text-3xl leading-snug">
            見ることと、残すことは別の話です。
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-usu">
            工程で何を見ているかは、設備・工程のページに書きました。
            ここに書くのは、そのうち何を残しているかです。
            出荷したあとで問われたときに答えられるかどうかは、こちらで決まります。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          {QUALITY_STANCE.map((s) => (
            <article key={s.title} className="panel p-6">
              <h2 className="text-base text-hakuro">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-usu">{s.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 工程ごとに残すもの */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-xs tracking-[0.3em] text-do">工程ごとに残すもの</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-suji text-left text-xs tracking-wider text-do">
                <th className="w-40 py-2 pr-4 font-normal">工程</th>
                <th className="py-2 pr-4 font-normal">残す記録</th>
                <th className="w-24 py-2 text-right font-normal">保存年数</th>
              </tr>
            </thead>
            <tbody>
              {RECORDS.map((r) => (
                <tr key={r.processId} className="border-b border-suji/60 align-top">
                  <td className="py-3 pr-4 text-hakuro">
                    {processName(r.processId)}
                  </td>
                  <td className="py-3 pr-4">
                    <ul className="flex flex-wrap gap-1.5">
                      {r.items.map((i) => (
                        <li
                          key={i}
                          className="rounded-sm border border-suji px-2 py-0.5 text-xs text-usu"
                        >
                          {i}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="tabular py-3 text-right text-usu">
                    {r.retentionYears} 年
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 辿る鎖 */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-xs tracking-[0.3em] text-do">辿る鎖</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-usu">
          出荷した製品から、そこに載った部品のリールまで五つの記録で繋がっています。
          どこか一つが欠けると鎖は切れ、そこから先は辿れません。
        </p>

        <ol className="mt-8 space-y-3">
          {TRACE_CHAIN.map((link, i) => (
            <li key={link.from} className="panel flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3">
              <span className="tabular text-[0.65rem] tracking-widest text-do">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm text-hakuro">{link.from}</span>
              <span className="text-do">→</span>
              <span className="text-sm text-hakuro">{link.to}</span>
              <span className="text-xs text-usu">{link.label}</span>
              <span className="ml-auto text-xs text-hanare">{link.via}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <LotDecoder />
        </div>
      </section>

      {/* クリーンルーム */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-xs tracking-[0.3em] text-do">クリーンルーム</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-usu">
          医療機器向けのセンサモジュールは、クラス 10000 対応の区画で組みます。
          天井から吹き出した空気が床へ抜ける一方向の流れがあり、
          人や作業から出た粒子は下へ運ばれて戻ってきません。
          清浄度を保っているのは壁ではなく、この流れの向きです。
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <CleanroomSection className="w-full rounded-sm border border-suji" />

          <div>
            <h3 className="text-xs tracking-[0.25em] text-do">
              清浄度クラスの対照
            </h3>
            <table className="mt-4 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-suji text-left text-xs tracking-wider text-usu">
                  <th className="py-2 pr-3 font-normal">規格 209E</th>
                  <th className="py-2 pr-3 font-normal">ISO 14644</th>
                  <th className="py-2 text-right font-normal">粒子数 / ft³</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {CLEANROOM_CLASSES.map((c) => (
                  <tr
                    key={c.label}
                    className={
                      c.usClass === 10000
                        ? "border-b border-suji/60 text-hanare"
                        : "border-b border-suji/60 text-usu"
                    }
                  >
                    <td className="py-2 pr-3">{c.label}</td>
                    <td className="py-2 pr-3">クラス {c.isoClass}</td>
                    <td className="py-2 text-right">
                      {c.particlesPerCubicFoot.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs leading-relaxed text-usu">
              規格 209E のクラス番号は、1 立方フィートあたりの 0.5μm 以上の粒子数
              そのものです。クラス 10000 なら 10,000 個以下。
              当社が対応するのはこの区画で、
              {CLEANROOM_CLASSES.find((c) => c.usClass === 10000)?.use}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-usu/80">
              上記は制度の説明です。当社は架空の企業であり、
              いかなる認証も取得していません。
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
