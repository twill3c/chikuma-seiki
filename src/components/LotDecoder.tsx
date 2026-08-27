"use client";

import { useState } from "react";
import { formatLot, parseLot } from "@/lib/lot";

/**
 * ロット番号の分解(F-05)。
 *
 * トレーサビリティは言葉で書くと抽象的になるので、
 * 実際に番号を打ち込んで分解できるようにした。
 * 不正な番号は理由つきで弾く——**弾けることが仕様の一部**である
 * (往復するだけの実装は、間違った番号も往復してしまう)。
 */

const EXAMPLES = ["CTL-2635-128", "SNS-0407-003", "CTL-2654-128"];

export function LotDecoder() {
  const [text, setText] = useState(EXAMPLES[0]);
  const lot = parseLot(text.trim());

  return (
    <div className="panel p-6">
      <label className="block">
        <span className="text-xs tracking-[0.25em] text-do">
          ロット番号を分解する
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          aria-label="ロット番号"
          className="tabular mt-3 w-full rounded-sm border border-suji bg-tetsu px-3 py-2 text-base text-hakuro outline-none focus:border-do"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setText(e)}
            className="tabular rounded-sm border border-suji px-2 py-1 text-xs text-usu hover:border-do hover:text-hakuro"
          >
            {e}
          </button>
        ))}
      </div>

      {lot ? (
        <dl className="mt-6 grid gap-px overflow-hidden rounded-sm border border-suji bg-suji sm:grid-cols-4">
          <Field label="機種" value={lot.product} note="設計の系統" />
          <Field label="製造年" value={`20${String(lot.year).padStart(2, "0")}`} note="西暦" />
          <Field label="製造週" value={`第 ${lot.week} 週`} note="1〜53" />
          <Field label="通番" value={String(lot.serial)} note="その週の何本目か" />
        </dl>
      ) : (
        <p className="mt-6 rounded-sm border border-akane/50 bg-tetsu px-4 py-3 text-sm text-akane">
          この番号は受け付けられません。
          <span className="ml-2 text-usu">
            形式は{" "}
            <span className="tabular text-hakuro">機種3文字-年2桁週2桁-通番3桁</span>
            、週は 1〜53、通番は 001 以上です。
          </span>
        </p>
      )}

      {lot && (
        <p className="mt-4 text-xs leading-relaxed text-usu">
          この番号から、下の鎖をたどって部品のリールまで戻れます。組み立て直すと{" "}
          <span className="tabular text-hanare">{formatLot(lot)}</span> になり、
          打ち込んだ番号と一致します。
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-ban px-4 py-3">
      <dt className="text-[0.7rem] tracking-wider text-do">{label}</dt>
      <dd className="tabular mt-1 text-lg text-hakuro">{value}</dd>
      <dd className="mt-0.5 text-[0.7rem] text-usu">{note}</dd>
    </div>
  );
}
