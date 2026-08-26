import { EQUIPMENT } from "@/data/company";
import { PROCESSES, totalChangeoverMin } from "@/data/process";
import { LineDiagram } from "@/components/LineDiagram";

/**
 * 設備・工程(F-04)。
 *
 * 設備の型番を並べる代わりに、工程を一本の流れとして押せるようにした。
 * 多品種少量の会社なので、「何を持っているか」より
 * 「切り替えるときに何が起きるか」を前に出している。
 */
export function FacilityView() {
  const changeover = totalChangeoverMin();

  return (
    <>
      <section className="border-b border-suji">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <p className="text-xs tracking-[0.3em] text-do">設備・工程</p>
          <h1 className="mt-4 max-w-3xl text-3xl leading-snug">
            速く流すより、切り替えても崩れないこと。
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-usu">
            基板は六つの工程を通ります。一機種あたり数十枚から数百枚なので、
            機械が動いている時間より、次の機種に切り替えている時間の方が
            長い日があります。六工程の段取り替えを全部足すと
            <span className="tabular text-hakuro"> {changeover} </span>
            分。ここを削るのが設計・生産技術の仕事です。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-xs tracking-[0.3em] text-do">
          実装ライン — 駅を押すと中身が出ます
        </h2>
        <div className="mt-8">
          <LineDiagram />
        </div>
      </section>

      {/* 設備の一覧 */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="text-xs tracking-[0.3em] text-do">主要設備</h2>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-sm border border-suji bg-suji sm:grid-cols-2 lg:grid-cols-3">
          {EQUIPMENT.map((e) => {
            const users = PROCESSES.filter((p) => p.equipment.includes(e.id));
            return (
              <li key={e.id} className="bg-ban p-5">
                <h3 className="text-sm text-hakuro">{e.name}</h3>
                <p className="mt-2 text-xs leading-relaxed text-usu">{e.note}</p>
                <p className="mt-3 text-[0.7rem] tracking-wider text-do">
                  {users.map((u) => u.name).join(" / ")}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
