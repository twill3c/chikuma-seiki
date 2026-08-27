import { OG_CONTENT, OG_SIZE } from "@/lib/og-content";
import { ogImage } from "@/lib/og-image";

export const alt = OG_CONTENT["/technology"].title.join("");
export const size = OG_SIZE;
export const contentType = "image/png";

export const dynamic = "force-static";

export default function Image() {
  return ogImage("/technology");
}
