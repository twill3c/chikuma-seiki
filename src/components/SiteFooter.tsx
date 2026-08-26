import { COMPANY, HEADCOUNT } from "@/data/company";
import { readyNav } from "@/data/site";
import Link from "next/link";

/**
 * ページ末尾のフッタ。架空である旨の明示 4 箇所のうちの 1 箇所(F-13)。
 * 装飾より先に出す — 実在企業と誤認されないことを優先する(SPEC §6)。
 */
export function SiteFooter() {
  const nav = readyNav();

  return (
    <footer className="mt-24 border-t border-suji bg-ban/50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="text-base tracking-[0.14em] text-hakuro">
              {COMPANY.name}
            </p>
            <p className="mt-2 text-sm text-usu">
              {COMPANY.address.region}
              {COMPANY.address.locality}
              <br />
              {COMPANY.address.detail}
            </p>
          </div>

          <div>
            <h2 className="text-xs tracking-[0.2em] text-do">陣容</h2>
            <ul className="tabular mt-2 space-y-1 text-sm text-usu">
              {HEADCOUNT.map((d) => (
                <li key={d.id}>
                  {d.name}
                  <span className="mx-2 opacity-40">—</span>
                  <span className="text-hakuro">{d.count}</span> 名
                </li>
              ))}
            </ul>
          </div>

          {nav.length > 0 && (
            <div>
              <h2 className="text-xs tracking-[0.2em] text-do">案内</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {nav.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      className="text-usu no-underline hover:text-do"
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p
          role="note"
          className="mt-10 rounded border border-suji bg-tetsu/70 px-4 py-3 text-xs leading-relaxed text-usu"
        >
          {COMPANY.fictionNotice}
        </p>
      </div>
    </footer>
  );
}
