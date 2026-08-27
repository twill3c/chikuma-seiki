import type { Metadata } from "next";
import { RecruitView } from "@/views/RecruitView";

export const metadata: Metadata = {
  title: "採用",
  description:
    "実装オペレーター、品質管理、生産技術・設計、社内システム・受託開発、調達・営業。部門ごとに、その日の仕事が具体的に何かを書いています。",
  alternates: { canonical: "/recruit" },
};

export default function Page() {
  return <RecruitView />;
}
