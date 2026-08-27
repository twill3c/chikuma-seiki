import type { Metadata } from "next";
import { QualityView } from "@/views/QualityView";

export const metadata: Metadata = {
  title: "品質保証",
  description:
    "工程ごとに何を残しているか、出荷した製品から部品のリールまでどう辿るか。クリーンルーム(クラス 10000 対応)の気流と清浄度クラスの対照。",
  alternates: { canonical: "/quality" },
};

export default function Page() {
  return <QualityView />;
}
