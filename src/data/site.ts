import { COMPANY } from "./company";

export const SITE = {
  title: COMPANY.name,
  description:
    "長野県佐久市の架空の EMS 企業。産業用ロボット向け制御基板と医療機器向けセンサモジュールの受託製造、自動化・データ分析システムの受託開発。AI による外観検査と生産計画最適化のデモを掲載しています。",
} as const;

/**
 * ナビゲーション。
 *
 * `ready: false` のページはまだ存在しない(ループごとに追加される)。
 * 静的書き出しでは存在しないルートへのリンクがそのまま 404 になるので、
 * 「予定はあるが未実装」を型として持ち、出さないことで防ぐ。
 */
export type NavItem = {
  href: string;
  label: string;
  ready: boolean;
};

export const NAV: readonly NavItem[] = [
  { href: "/business", label: "事業内容", ready: true },
  { href: "/facility", label: "設備・工程", ready: true },
  { href: "/technology", label: "技術", ready: true },
  { href: "/quality", label: "品質保証", ready: true },
  { href: "/company", label: "会社案内", ready: true },
  { href: "/recruit", label: "採用", ready: false },
  { href: "/contact", label: "お問い合わせ", ready: false },
] as const;

export function readyNav(): NavItem[] {
  return NAV.filter((n) => n.ready);
}

/**
 * フリート共通フッタの 5 項目(N-06)。並びと項目数は規約で固定されている。
 * `href` が null のものは公開待ち(F-16)。リンクにせず、印だけ出す。
 */
export type FooterLink = { label: string; href: string | null };

export const FLEET_FOOTER: readonly FooterLink[] = [
  { label: "MIT License © 2026 坂田哲朗", href: null },
  { label: "GitHub", href: null },
  { label: "千曲精機の見方", href: null },
  { label: "設計図", href: null },
  { label: "App Menu", href: "https://app-menu-amber.vercel.app/" },
] as const;
