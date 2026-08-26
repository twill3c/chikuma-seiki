import type { Metadata } from "next";
import { FacilityView } from "@/views/FacilityView";

export const metadata: Metadata = {
  title: "設備・工程",
  description:
    "はんだ印刷から組立・最終検査までの六工程を、押せるライン図で。表面実装機、自動光学検査装置、クリーンルーム(クラス 10000 対応)。",
  alternates: { canonical: "/facility" },
};

export default function Page() {
  return <FacilityView />;
}
