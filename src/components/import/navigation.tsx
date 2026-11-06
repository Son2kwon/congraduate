"use client";

import Link from "next/link";
import { useImport } from "./import-provider";

export function Navigation({ active }: { active: "setup" | "import" }) {
  const { workspace } = useImport();
  return <header className="app-header">
    <Link href="/" className="brand">졸업요건</Link>
    <nav aria-label="주 메뉴">
      <span className="nav-item unavailable" aria-disabled="true" title="6단계에서 제공 예정">대시보드</span>
      <Link href="/import/" className={`nav-item ${active === "import" ? "active" : ""}`} aria-current={active === "import" ? "page" : undefined}>이력 가져오기</Link>
      <span className="nav-item unavailable" aria-disabled="true" title="8단계에서 제공 예정">수강 계획</span>
      <Link href="/" className={`nav-item ${active === "setup" ? "active" : ""}`} aria-current={active === "setup" ? "page" : undefined}>설정</Link>
    </nav>
    <span className="profile">중앙대 소프트웨어학부 · {workspace.student ? `${String(workspace.student.entry_year).slice(-2)}학번` : "학번 미설정"} · 공학인증</span>
  </header>;
}
