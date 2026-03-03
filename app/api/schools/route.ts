import { NextRequest, NextResponse } from 'next/server';
import type { SchoolsApiResponse } from '@/types/careernet';

export const dynamic = 'force-dynamic';

const CAREER_NET_BASE = 'https://www.career.go.kr/cnet/openapi/getOpenApi.json';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get('name') ?? '';

  const apiKey = process.env.CAREER_NET_API_KEY;
  if (!apiKey) {
    console.error('[/api/schools] API key not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const url = new URL(CAREER_NET_BASE);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('svcType', 'api');
  url.searchParams.set('svcCode', 'SCHOOL');
  url.searchParams.set('gubun', 'univ_list');
  url.searchParams.set('thisPage', '1');
  url.searchParams.set('perPage', '500');
  url.searchParams.set('contentType', 'json');
  if (name) {
    url.searchParams.set('searchSchulNm', name);
  }

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('[/api/schools] HTTP 오류:', res.status, text.slice(0, 300));
      return NextResponse.json({ error: `CareerNet HTTP ${res.status}` }, { status: res.status });
    }

    const data: SchoolsApiResponse = await res.json();

    // API 레벨 에러 코드 확인 (0 = 성공, 음수 = 실패)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultCode = (data as any)?.dataSearch?.result?.content?.code;
    if (resultCode !== undefined && Number(resultCode) < 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultMsg = (data as any)?.dataSearch?.result?.content?.message ?? 'API 오류';
      console.error('[/api/schools] API 오류 코드:', resultCode, resultMsg);
      return NextResponse.json({ error: resultMsg }, { status: 400 });
    }

    const schools = data?.dataSearch?.content ?? [];
    return NextResponse.json(schools);
  } catch (err) {
    console.error('[/api/schools] fetch 실패:', err);
    const isTimeout = err instanceof Error && err.name === 'TimeoutError';
    return NextResponse.json(
      { error: isTimeout ? 'CareerNet 응답 시간 초과 (8초)' : 'Failed to fetch schools' },
      { status: 500 },
    );
  }
}
