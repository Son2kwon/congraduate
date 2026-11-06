"use client";

import Link from "next/link";
import { useImport } from "./import-provider";

export function Navigation({ active }: { active: "setup" | "import" | "dashboard" | "plan" }) {
  const { workspace } = useImport();
  return <header className="app-header">
    <Link href="/" className="brand">졸업요건</Link>
    <nav aria-label="주 메뉴">
      <Link href="/dashboard/" className={`nav-item ${active === "dashboard" ? "active" : ""}`} aria-current={active === "dashboard" ? "page" : undefined}>대시보드</Link>
      <Link href="/import/" className={`nav-item ${active === "import" ? "active" : ""}`} aria-current={active === "import" ? "page" : undefined}>이력 가져오기</Link>
      <Link href="/plan/" className={`nav-item ${active === "plan" ? "active" : ""}`} aria-current={active === "plan" ? "page" : undefined}>수강 계획</Link>
      <Link href="/" className={`nav-item ${active === "setup" ? "active" : ""}`} aria-current={active === "setup" ? "page" : undefined}>설정</Link>
    </nav>
    <span className="profile">중앙대 소프트웨어학부 · {workspace.student ? `${String(workspace.student.entry_year).slice(-2)}학번` : "학번 미설정"} · 공학인증</span>
  </header>;
}
