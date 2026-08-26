import { BUSINESSES, COMPANY, HEADCOUNT } from "@/data/company";
import { Hero } from "@/components/Hero";
import { ProcessStrip } from "@/components/ProcessStrip";

/**
 * トップページ(F-01)。
 *
 * 「高品質・高信頼」と書くだけのページにしない。この会社が何を引き受けていて、
 * どこが難しいのかを、数字と工程の側から出す。
 */

const FIGURES = [
  { value: "120", unit: "名", label: "従業員" },
  { value: "20", unit: "数機種", label: "常時流れている機種" },
  { value: "1978", unit: "年", label: "創業" },
  { value: "10000", unit: "クラス", label: "クリーンルーム" },
] as const;

export function HomeView() {
  const it = HEADCOUNT.find((d) => d.id === "it")!;

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-suji">
        <Hero className="absolute inset-0 h-full w-full opacity-90" />
        {/*
          文字が乗る左半分だけを落とす。図全体を暗くすると配線が沈むので、
          読ませたいところにだけ幕を掛ける。
        */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-tetsu via-tetsu/75 to-transparent sm:to-60%"
        />
        <div className="relative mx-auto max-w-6xl px-5 py-28 sm:py-36">
          <p className="text-xs tracking-[0.3em] text-do">
            {COMPANY.address.region}
            {COMPANY.address.locality}
          </p>
          {/*
            読点で折り返させる。日本語は語中で割れると読み負荷が上がるので、
            句のまとまりごとに nowrap を掛け、割れる位置を作者が決める。
          */}
          <h1 className="mt-4 max-w-3xl text-3xl leading-snug sm:text-4xl">
            {COMPANY.tagline.split("、").map((phrase, i, all) => (
              <span key={phrase} className="whitespace-nowrap">
                {phrase}
                {i < all.length - 1 && "、"}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-usu">
            産業用ロボットの制御基板と、医療機器のセンサモジュール。
            数は出ませんが、止まると困るものを作っています。
            多品種少量の受託製造(EMS)と、その現場で先に使った
            自動化・データ分析システムの受託開発が事業の二本柱です。
          </p>
        </div>
      </section>

      {/* 数字 */}
      <section className="border-b border-suji bg-ban/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-suji sm:grid-cols-4">
          {FIGURES.map((f) => (
            <div key={f.label} className="bg-tetsu px-5 py-8">
              <p className="tabular text-2xl text-hakuro">
                {f.value}
                <span className="ml-1 text-xs text-usu">{f.unit}</span>
              </p>
              <p className="mt-1 text-xs tracking-wider text-usu">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 事業 */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="text-xs tracking-[0.3em] text-do">事業</h2>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {BUSINESSES.map((b) => (
            <article key={b.id} className="panel p-6">
              <h3 className="text-lg text-hakuro">{b.name}</h3>
              <p className="mt-2 text-sm text-hanare">{b.lead}</p>
              <p className="mt-4 text-sm leading-relaxed text-usu">{b.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 工程 */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <h2 className="text-xs tracking-[0.3em] text-do">工程</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-usu">
          基板は六つの工程を通ります。多品種少量では、どの工程も
          「速く流す」より「切り替えても崩れない」ことが問われます。
        </p>
        <div className="mt-8">
          <ProcessStrip />
        </div>
      </section>

      {/* 情シス 7 名という設定を、この会社の性格として出す */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="panel p-8">
          <h2 className="text-xs tracking-[0.3em] text-do">
            作る側が、作る道具も作る
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-usu">
            従業員 {COMPANY.employees} 名のうち {it.count} 名が
            {it.name}です。{it.role}
            検査の判定、生産計画の組み替え、部品の欠品予測。
            どれも自社のラインで先に回し、効いたものだけを受託の形にしています。
          </p>
        </div>
      </section>
    </>
  );
}
