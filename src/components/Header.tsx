import Link from "next/link";
import { COMPANY } from "@/data/company";
import { readyNav } from "@/data/site";
import { Mark } from "./Mark";

export function Header() {
  const nav = readyNav();

  return (
    <header className="border-b border-suji/70 bg-tetsu/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <Mark className="h-8 w-8 shrink-0" />
          <span>
            <span className="block text-[0.95rem] tracking-[0.14em] text-hakuro">
              {COMPANY.name}
            </span>
            <span className="block text-[0.6rem] tracking-[0.28em] text-usu">
              {COMPANY.nameEn.toUpperCase()}
            </span>
          </span>
        </Link>

        {nav.length > 0 && (
          <nav className="ml-auto hidden gap-5 text-sm md:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-usu no-underline hover:text-do"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
