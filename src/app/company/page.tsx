import type { Metadata } from "next";
import { CompanyView } from "@/views/CompanyView";

export const metadata: Metadata = {
  title: "会社案内",
  description:
    "長野県佐久市の架空の EMS 企業「株式会社 千曲精機」。1978 年創業、従業員 120 名。沿革・部門別の陣容・所在地の略図。",
  alternates: { canonical: "/company" },
};

export default function Page() {
  return <CompanyView />;
}
