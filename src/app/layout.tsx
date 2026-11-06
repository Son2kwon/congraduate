import type { ReactNode } from "react";

export const metadata = {
  title: "congraduate",
  description: "중앙대 소프트웨어학부(공학인증) 졸업요건 판정",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
