import { FLEET_FOOTER } from "@/data/site";

/**
 * フリート共通の固定フッタ(N-06)。5 項目・この並び・下部固定。
 * 未公開のリンクは href を持たないので、リンクに見せずに文字だけ出す。
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
        </span>
      ))}
    </div>
  );
}
