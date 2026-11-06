import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// 정적 사이트 모드: 서버·DB 없음, 성적 데이터는 브라우저 안에서만 처리 (decisions.md 2번)
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: basePath ? basePath : undefined,
};

export default nextConfig;
