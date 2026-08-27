import { DEMOS } from "@/data/demos";
import { HEADCOUNT } from "@/data/company";
import { AoiDemo } from "@/components/AoiDemo";
import { ScheduleDemo } from "@/components/ScheduleDemo";

/**
 * 技術(F-09 / F-10 / F-11 / F-12)。この作品の主役のページ。
 *
 * 「AI で精度を上げています」と書く代わりに、その判定を動かす。
 * 各デモには (1) 何が難しいのか (2) 模擬である旨 (3) 正しさを何で担保しているか
 * の三つを必ず添える。三つ目が無いと、動くだけの飾りになる。
 */
export function TechnologyView() {
  const it = HEADCOUNT.find((d) => d.id === "it")!;
  const aoi = DEMOS.find((d) => d.id === "aoi")!;
  const schedule = DEMOS.find((d) => d.id === "schedule")!;
  const upcoming = DEMOS.filter((d) => !d.ready);

  return (
    <>
      <section className="border-b border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.3em] text-do">技術</p>
          <h1 className="mt-4 max-w-3xl text-3xl leading-snug">
            言う代わりに、動かします。
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-usu">
            検査の判定、生産計画の組み替え、部品の欠品予測。どれも
            {it.name} {it.count} 名が自社のラインで先に回し、
            効いたものだけを受託の形にしています。
            ここではその中身を、読むのではなく触れる形で置いています。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex flex-wrap items-baseline gap-x-4">
          <h2 className="text-xs tracking-[0.3em] text-do">デモ 01</h2>
          <p className="text-lg text-hakuro">{aoi.name}</p>
        </div>
        <p className="mt-4 max-w-3xl text-base text-hanare">{aoi.lead}</p>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-usu">
          {aoi.problem}
        </p>

        <div className="mt-10">
          <AoiDemo />
        </div>

        {/* 模擬である旨と、正しさの担保 */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <p
            role="note"
            className="rounded border border-suji bg-ban/60 px-4 py-3 text-xs leading-relaxed text-usu"
          >
            {aoi.simulationNotice}
          </p>
          <p className="rounded border border-suji bg-ban/60 px-4 py-3 text-xs leading-relaxed text-usu">
            <span className="text-do">この計算の確かめ方 — </span>
            {aoi.oracle}
          </p>
        </div>
      </section>

      {/* デモ 02 */}
      <section className="border-t border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-baseline gap-x-4">
            <h2 className="text-xs tracking-[0.3em] text-do">デモ 02</h2>
            <p className="text-lg text-hakuro">{schedule.name}</p>
          </div>
          <p className="mt-4 max-w-3xl text-base text-hanare">
            {schedule.lead}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-usu">
            {schedule.problem}
          </p>

          <div className="mt-10">
            <ScheduleDemo />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <p
              role="note"
              className="rounded border border-suji bg-ban/60 px-4 py-3 text-xs leading-relaxed text-usu"
            >
              {schedule.simulationNotice}
            </p>
            <p className="rounded border border-suji bg-ban/60 px-4 py-3 text-xs leading-relaxed text-usu">
              <span className="text-do">この計算の確かめ方 — </span>
              {schedule.oracle}
            </p>
          </div>
        </div>
      </section>

      {/* 開発の進め方(F-12 の予告を兼ねる) */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="panel p-8">
          <h2 className="text-xs tracking-[0.3em] text-do">
            動くものより先に、確かめ方を決める
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-usu">
            上のデモの ROC 曲線は、二つの独立した経路で同じ値に着くことを
            確かめてあります。曲線を台形で積分して求めた AUC と、曲線を一切
            経由せずに順位の対を総当たりして求めた AUC。この二つは数学的に
            等しいはずのもので、実装が曲線の作り方を間違えていれば合いません。
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-usu">
            同じ関数をもう一度呼んで比べても、それは検算になりません。
            受託開発でも同じ姿勢を取っています。何をもって正しいとするかを先に
            決め、それが決められない要件は、決められないと申し上げます。
          </p>
        </div>
      </section>

      {/* これから載せるもの */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-xs tracking-[0.3em] text-do">このあと載せるもの</h2>
        <ul className="mt-8 grid gap-6 lg:grid-cols-2">
          {upcoming.map((d, i) => (
            <li key={d.id} className="panel p-6">
              <p className="text-xs tracking-[0.25em] text-do">
                デモ {String(i + 3).padStart(2, "0")}
              </p>
              <h3 className="mt-2 text-lg text-hakuro">{d.name}</h3>
              <p className="mt-2 text-sm text-hanare">{d.lead}</p>
              <p className="mt-3 text-sm leading-relaxed text-usu">
                {d.problem}
              </p>
              <p className="mt-4 border-t border-suji pt-3 text-xs leading-relaxed text-usu">
                <span className="text-do">確かめ方 — </span>
                {d.oracle}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
