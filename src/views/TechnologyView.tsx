import { DEMOS } from "@/data/demos";
import { HEADCOUNT } from "@/data/company";
import { AoiDemo } from "@/components/AoiDemo";
import { ScheduleDemo } from "@/components/ScheduleDemo";
import { InventoryDemo } from "@/components/InventoryDemo";
import {
  FAILURE_BREAKDOWN,
  PRACTICE_STATS,
  PRINCIPLES,
} from "@/data/practice";

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
  const inventory = DEMOS.find((d) => d.id === "inventory")!;
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

      {/* デモ 03 */}
      <section className="border-t border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-baseline gap-x-4">
            <h2 className="text-xs tracking-[0.3em] text-do">デモ 03</h2>
            <p className="text-lg text-hakuro">{inventory.name}</p>
          </div>
          <p className="mt-4 max-w-3xl text-base text-hanare">
            {inventory.lead}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-usu">
            {inventory.problem}
          </p>

          <div className="mt-10">
            <InventoryDemo />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <p
              role="note"
              className="rounded border border-suji bg-ban/60 px-4 py-3 text-xs leading-relaxed text-usu"
            >
              {inventory.simulationNotice}
            </p>
            <p className="rounded border border-suji bg-ban/60 px-4 py-3 text-xs leading-relaxed text-usu">
              <span className="text-do">この計算の確かめ方 — </span>
              {inventory.oracle}
            </p>
          </div>
        </div>
      </section>

      {/* 開発の進め方(F-12) */}
      <section className="border-t border-suji bg-ban/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-xs tracking-[0.3em] text-do">
            AI エージェントを使った開発の進め方
          </h2>
          <p className="mt-4 max-w-3xl text-base text-hanare">
            速く書けることより、間違いに早く気づけること。
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-usu">
            エージェントを使うと実装は速くなりますが、間違いも速く増えます。
            当社が受託開発で置いているのは、書く速さを上げる仕組みではなく、
            <span className="text-hanare">間違いが早く表に出る仕組み</span>
            の方です。四つあります。
          </p>

          <ol className="mt-10 grid gap-6 lg:grid-cols-2">
            {PRINCIPLES.map((p, i) => (
              <li key={p.id} className="panel p-6">
                <p className="tabular text-[0.65rem] tracking-widest text-do">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 text-base text-hakuro">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-usu">{p.body}</p>
                <p className="mt-4 border-t border-suji pt-3 text-xs leading-relaxed text-hanare">
                  {p.example}
                </p>
              </li>
            ))}
          </ol>

          {/* 実測値。架空の実績ではなく、この作品そのものの記録 */}
          <div className="mt-10 panel p-6">
            <h3 className="text-xs tracking-[0.25em] text-do">
              このサイト自体の記録
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-usu">
              会社は架空ですが、
              <span className="text-hanare">この作り方は実際のもの</span>
              です。以下はこのサイトを作ったときの実測で、
              リポジトリのループログを数え直した値です。
              架空の実績と混ぜないよう、テストで突き合わせてあります。
            </p>

            <div className="mt-6 grid gap-px overflow-hidden rounded-sm border border-suji bg-suji sm:grid-cols-4">
              <Stat value={PRACTICE_STATS.loops} unit="回" label="ループ" />
              <Stat
                value={PRACTICE_STATS.failures}
                unit="件"
                label="記録した失敗"
              />
              <Stat value={PRACTICE_STATS.tests} unit="件" label="テスト" />
              <Stat
                value={PRACTICE_STATS.harnessEntries}
                unit="件"
                label="仕組みの改訂"
              />
            </div>

            <div className="mt-6">
              <p className="text-xs tracking-[0.2em] text-do">失敗の内訳</p>
              <ul className="mt-3 space-y-2">
                {FAILURE_BREAKDOWN.map((f) => (
                  <li key={f.code} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 text-usu">{f.label}</span>
                    {/* 帯は最大件数で正規化する。総数で割ると全部短くなる */}
                    <span
                      className="h-2 rounded-full bg-do"
                      style={{
                        width: `${(f.count / FAILURE_BREAKDOWN[0].count) * 100}%`,
                      }}
                    />
                    <span className="tabular text-xs text-hanare">
                      {f.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-usu">
              失敗が多いことは隠しません。
              <span className="text-hanare">
                記録していない失敗は、次に同じ形で戻ってきます。
              </span>
              上の内訳で「テストの誤検出」と「テストの穴」が合わせて 8 件ある
              — 検査そのものが間違っていた回数です。実装の誤りと同じくらい、
              検査の誤りを疑う必要があります。
            </p>
          </div>
        </div>
      </section>

      {/* これから載せるもの。全部公開したら消える */}
      {upcoming.length > 0 && (
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
      )}
    </>
  );
}

function Stat({
  value,
  unit,
  label,
}: {
  value: number;
  unit: string;
  label: string;
}) {
  return (
    <div className="bg-ban px-5 py-4">
      <p className="tabular text-2xl text-hakuro">
        {value}
        <span className="ml-1.5 text-xs text-usu">{unit}</span>
      </p>
      <p className="mt-1 text-xs text-usu">{label}</p>
    </div>
  );
}
