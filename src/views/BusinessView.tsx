import { BUSINESSES, HEADCOUNT } from "@/data/company";
import { FLOW, flowShare, leadTimeRange } from "@/data/flow";

/**
 * 事業内容(F-03)。
 *
 * 二本柱の説明で終わらせず、受注から出荷までを段階の日数で出す。
 * EMS のリードタイムは実装ではなく調達で決まる、という実態が
 * 帯の長さとしてそのまま見えるようにしてある。
 */
export function BusinessView() {
  const lead = leadTimeRange();
  const dept = (id: string) => HEADCOUNT.find((d) => d.id === id)!.name;
  const longest = [...FLOW].sort((a, b) => b.maxDays - a.maxDays)[0];

  return (
    <>
      <section className="border-b border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.3em] text-do">事業内容</p>
          <h1 className="mt-4 max-w-3xl text-3xl leading-snug">
            作れるかどうかを、作る前に答える。
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-usu">
            受託製造(EMS)と、自動化・データ分析システムの受託開発。
            前者で困った工程が、後者の題材になっています。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {BUSINESSES.map((b) => (
            <article key={b.id} className="panel p-7">
              <h2 className="text-lg text-hakuro">{b.name}</h2>
              <p className="mt-2 text-sm text-hanare">{b.lead}</p>
              <p className="mt-4 text-sm leading-relaxed text-usu">{b.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 受注から出荷まで */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-xs tracking-[0.3em] text-do">受注から出荷まで</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-usu">
          最短で <span className="tabular text-hakuro">{lead.min}</span> 日、
          長ければ <span className="tabular text-hakuro">{lead.max}</span> 日。
          幅がこれだけ開くのは、時間の大半を握っているのが実装ではなく
          <span className="text-hanare">{longest.name}</span>だからです。
          帯の長さは、その段階が最長でどれだけ占めるかを表しています。
        </p>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-usu/80">
          各段階の日数を単純に足した値です。実際には調達と治具の手配は並行して進むので、
          初回でない機種はこれより短くなります。
        </p>

        <ol className="mt-10 space-y-4">
          {FLOW.map((f, i) => (
            <li key={f.id} className="panel px-5 py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="tabular text-[0.65rem] tracking-widest text-do">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-base text-hakuro">{f.name}</h3>
                <span className="text-xs text-usu">{dept(f.dept)}</span>
                <span className="tabular ml-auto text-xs text-hanare">
                  {f.minDays}–{f.maxDays} 日
                </span>
              </div>

              {/* 最長日数を全体で正規化した帯 */}
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-tetsu"
                role="img"
                aria-label={`全体の最長リードタイムに占める割合 ${Math.round(flowShare(f) * 100)} パーセント`}
              >
                <div
                  className="h-full rounded-full bg-do"
                  style={{ width: `${Math.max(flowShare(f) * 100, 1.5)}%` }}
                />
              </div>

              <p className="mt-3 text-sm leading-relaxed text-usu">{f.body}</p>

              {f.containsProcesses && (
                <p className="mt-3 text-xs text-hanare">
                  この段階が、設備・工程ページの六工程にあたります。
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
