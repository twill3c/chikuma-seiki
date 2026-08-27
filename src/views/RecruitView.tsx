import { COMPANY, HEADCOUNT } from "@/data/company";
import { OPENINGS, WORK_STYLE } from "@/data/recruit";

/**
 * 採用(F-07)。
 *
 * 「風通しのよい職場」の類を書かない。その日の仕事が具体的に何で、
 * どういう人と働きたいかを、部門ごとに書く。
 * 全部門がここで説明されることをテストで固定してある(T-161)。
 */
export function RecruitView() {
  const dept = (id: string) => HEADCOUNT.find((d) => d.id === id)!;

  return (
    <>
      <section className="border-b border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.3em] text-do">採用</p>
          <h1 className="mt-4 max-w-3xl text-3xl leading-snug">
            切り替えの多い現場です。
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-usu">
            一機種あたり数十枚から数百枚を、常時二十数機種。
            同じ作業を一日中くり返す職場ではありません。
            そのぶん、手順を自分で組み替える余地があります。
          </p>
        </div>
      </section>

      {/* 数字 */}
      <section className="border-b border-suji bg-ban/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-suji sm:grid-cols-4">
          {WORK_STYLE.map((w) => (
            <div key={w.label} className="bg-tetsu px-5 py-6">
              <p className="text-[0.7rem] tracking-wider text-do">{w.label}</p>
              <p className="mt-2 text-sm text-hakuro">{w.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 職種 */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-xs tracking-[0.3em] text-do">職種</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-usu">
          従業員 {COMPANY.employees} 名の内訳は会社案内にあります。
          ここでは、その部門それぞれが日々何をしているかを書きます。
        </p>

        <div className="mt-10 space-y-6">
          {OPENINGS.map((o) => {
            const d = dept(o.dept);
            return (
              <article key={o.id} className="panel p-7">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="text-lg text-hakuro">{o.title}</h3>
                  <span className="text-xs text-do">{d.name}</span>
                  <span className="tabular ml-auto text-xs text-usu">
                    現在 {d.count} 名
                  </span>
                </div>

                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-usu">
                  {o.work}
                </p>

                <div className="mt-5 border-t border-suji pt-4">
                  <p className="text-xs tracking-[0.2em] text-do">
                    こういう人と働きたい
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-usu">
                    {o.wanted.map((w) => (
                      <li key={w} className="flex gap-2">
                        <span className="text-hanare">—</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 架空明示 */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <p
          role="note"
          className="rounded border border-suji bg-ban/60 px-5 py-4 text-sm leading-relaxed text-usu"
        >
          {COMPANY.fictionNotice}
          <span className="mt-2 block text-hanare">
            実在の求人ではありません。応募を受け付ける窓口もありません。
          </span>
        </p>
      </section>
    </>
  );
}
