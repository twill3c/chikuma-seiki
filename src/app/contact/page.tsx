import type { Metadata } from "next";
import { ContactView } from "@/views/ContactView";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "架空の企業のため、お問い合わせは受け付けていません。フォームは送信できない状態にしてあります。",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <ContactView />;
}
