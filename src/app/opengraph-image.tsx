import { OG_CONTENT, OG_SIZE } from "@/lib/og-content";
import { ogImage } from "@/lib/og-image";

export const alt = OG_CONTENT["/"].title.join("");
export const size = OG_SIZE;
export const contentType = "image/png";

// 静的書き出しではビルド時に一度だけ焼く(これが無いと build が落ちる)
export const dynamic = "force-static";

export default function Image() {
  return ogImage("/");
}
