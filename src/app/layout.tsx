import type { ReactNode } from "react";
import { ImportProvider } from "../components/import/import-provider";
import "./globals.css";

export const metadata = {
  title: "congraduate",
  description: "중앙대 소프트웨어학부(공학인증) 졸업요건 판정",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body><ImportProvider>{children}</ImportProvider></body>
    </html>
  );
}
