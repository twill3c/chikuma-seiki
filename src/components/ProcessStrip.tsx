import { PROCESSES } from "@/data/process";

/**
 * 工程の帯(F-01)。トップでは読むだけの図として置き、
 * 設備ページ(F-04)で押せるライン図に育てる。
 */
export function ProcessStrip() {
  return (
    <ol className="grid gap-px overflow-hidden rounded-sm border border-suji bg-suji sm:grid-cols-3 lg:grid-cols-6">
      {PROCESSES.map((p, i) => (
        <li key={p.id} className="bg-ban p-4">
          <div className="flex items-baseline gap-2">
            <span className="tabular text-[0.65rem] tracking-widest text-do">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="text-sm text-hakuro">{p.name}</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-usu">{p.stake}</p>
        </li>
      ))}
    </ol>
  );
}
