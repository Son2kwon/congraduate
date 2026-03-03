import { NextRequest, NextResponse } from 'next/server';
import type { DepartmentsApiResponse } from '@/types/careernet';

export const dynamic = 'force-dynamic';

const CAREER_NET_BASE = 'https://www.career.go.kr/cnet/openapi/getOpenApi.json';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') ?? '';
  const subject = searchParams.get('subject') ?? '';

  const apiKey = process.env.CAREER_NET_API_KEY;
  if (!apiKey) {
    console.error('[/api/departments] API key not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const url = new URL(CAREER_NET_BASE);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('svcType', 'api');
  url.searchParams.set('svcCode', 'MAJOR');
  url.searchParams.set('gubun', 'univ_list');
  url.searchParams.set('thisPage', '1');
  url.searchParams.set('perPage', '600');
  url.searchParams.set('contentType', 'json');
  if (title) {
    url.searchParams.set('searchTitle', title);
  }
  if (subject) {
    url.searchParams.set('subject', subject);
  }

  // apiKey를 가려서 로그 출력
  const logUrl = new URL(url.toString());
  logUrl.searchParams.set('apiKey', '***');
  console.log('[/api/departments] → CareerNet 요청:', logUrl.toString());

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[/api/departments] HTTP 오류:', res.status, text.slice(0, 300));
      return NextResponse.json({ error: `CareerNet HTTP ${res.status}` }, { status: res.status });
    }

    const data: DepartmentsApiResponse = await res.json();

    // API 레벨 에러 코드 확인 (0 = 성공, 음수 = 실패)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultCode = (data as any)?.dataSearch?.result?.content?.code;
    if (resultCode !== undefined && Number(resultCode) < 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultMsg = (data as any)?.dataSearch?.result?.content?.message ?? 'API 오류';
      console.error('[/api/departments] API 오류 코드:', resultCode, resultMsg);
      return NextResponse.json({ error: resultMsg }, { status: 400 });
    }

    const departments = data?.dataSearch?.content ?? [];
    console.log('[/api/departments] ← 결과 수:', departments.length, '/ 검색어:', title || '(없음)');
    return NextResponse.json(departments);
  } catch (err) {
    console.error('[/api/departments] fetch 실패:', err);
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      { error: isTimeout ? 'CareerNet 응답 시간 초과 (8초)' : 'Failed to fetch departments' },
      { status: 500 },
    );
  }
}
