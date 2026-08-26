import type { Metadata } from "next";
import { TechnologyView } from "@/views/TechnologyView";

export const metadata: Metadata = {
  title: "技術",
  description:
    "自動光学検査(AOI)の判定を AI で補うと何が変わるのか。しきい値・混同行列・ROC 曲線と、目視再検査の工数への換算を、模擬データで実際に動かせます。",
  alternates: { canonical: "/technology" },
};

export default function Page() {
  return <TechnologyView />;
}
