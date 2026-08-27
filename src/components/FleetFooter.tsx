import { COMPANY } from "@/data/company";
import { COPYRIGHT, FLEET_FOOTER } from "@/data/site";

/**
 * フリート共通の固定フッタ(N-06)。5 項目・この並び・下部固定。
 * 未公開のリンクは href を持たないので、リンクに見せずに文字だけ出す。
 *
 * 架空の企業・施設を題材にした作品(senoto-mori / hoshihata / sugi-nami / 本作)は、
 * 規約の 5 項目の**下に一行**、架空である旨を置く型に揃えてある。
 * 画面幅によらず自分の行を占め、リンクより控えめな濃さにする
 * —— 規約の並びを読むのが先で、断りはその補足、という順序。
 */
export function FleetFooter() {
  return (
    <div className="fleet-footer">
      {FLEET_FOOTER.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span className="sep">・</span>}
          {item.href ? (
            <a href={item.href} target="_blank" rel="noreferrer">
              {item.label}
            </a>
          ) : (
            <span className="opacity-60">{item.label}</span>
          )}
          {/* 著作権表示はリンクの外に置く(規約) */}
          {i === 0 && ` ${COPYRIGHT}`}
        </span>
      ))}
      <p className="fleet-footer__fiction">{COMPANY.fictionNotice}</p>
    </div>
  );
}
