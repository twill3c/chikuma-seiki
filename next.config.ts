import type { NextConfig } from "next";

// 静的エクスポート。サーバ関数を持たないので Vercel 上で Function 実行は発生しない(SPEC N-01 / N-07)。
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
