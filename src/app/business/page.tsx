import type { Metadata } from "next";
import { BusinessView } from "@/views/BusinessView";

export const metadata: Metadata = {
  title: "事業内容",
  description:
    "産業用ロボット向け制御基板と医療機器向けセンサモジュールの受託製造(EMS)、および自動化・データ分析システムの受託開発。受注から出荷までの流れを段階ごとの日数で示します。",
  alternates: { canonical: "/business" },
};

export default function Page() {
  return <BusinessView />;
}
