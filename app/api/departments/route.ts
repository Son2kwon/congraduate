import { NextRequest, NextResponse } from 'next/server';
import type {
  DepartmentsApiResponse,
  MajorViewApiResponse,
  MajorViewUniversity,
  SchoolDepartment,
} from '@/types/careernet';

export const dynamic = 'force-dynamic';

const CAREER_NET_BASE = 'https://www.career.go.kr/cnet/openapi/getOpenApi.json';

// ── 서버 수명 동안 MAJOR_VIEW 결과를 캐시 ─────────────────────────────────
const majorViewCache = new Map<string, MajorViewUniversity[]>();

async function fetchMajorViewUniversities(
  majorSeq: string,
  apiKey: string,
): Promise<MajorViewUniversity[]> {
  if (majorViewCache.has(majorSeq)) {
    return majorViewCache.get(majorSeq)!;
  }

  const url = new URL(CAREER_NET_BASE);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('svcType', 'api');
  url.searchParams.set('svcCode', 'MAJOR_VIEW');
  url.searchParams.set('gubun', 'univ_list');
  url.searchParams.set('majorSeq', majorSeq);
  url.searchParams.set('contentType', 'json');

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // MAJOR_VIEW는 자주 바뀌지 않으므로 1시간 캐시
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];

    const data: MajorViewApiResponse = await res.json();
    // content는 배열로 반환됨 (단일 학과 상세이므로 [0] 접근)
    const contentItem = Array.isArray(data?.dataSearch?.content)
      ? data.dataSearch.content[0]
      : data?.dataSearch?.content;
    const raw = contentItem?.university;
    if (!raw) return [];

    // XML→JSON 변환 시 단일 항목은 배열이 아닐 수 있음
    const unis: MajorViewUniversity[] = Array.isArray(raw) ? raw : [raw];
    majorViewCache.set(majorSeq, unis);
    return unis;
  } catch {
    return [];
  }
}

// 동시성 제한 병렬 처리 (CareerNet 과부하 방지)
async function batchProcess<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 5,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') ?? '';
  const subject = searchParams.get('subject') ?? '';
  const schoolName = searchParams.get('schoolName') ?? '';

  const apiKey = process.env.CAREER_NET_API_KEY;
  if (!apiKey) {
    console.error('[/api/departments] API key not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // ── 모드 1: 학교 필터 (schoolName + title 필수) ─────────────────────────
  if (schoolName && title) {
    const listUrl = new URL(CAREER_NET_BASE);
    listUrl.searchParams.set('apiKey', apiKey);
    listUrl.searchParams.set('svcType', 'api');
    listUrl.searchParams.set('svcCode', 'MAJOR');
    listUrl.searchParams.set('gubun', 'univ_list');
    listUrl.searchParams.set('thisPage', '1');
    listUrl.searchParams.set('perPage', '50');
    listUrl.searchParams.set('contentType', 'json');
    listUrl.searchParams.set('searchTitle', title);

    const logUrl = new URL(listUrl.toString());
    logUrl.searchParams.set('apiKey', '***');
    console.log(
      `[/api/departments] 학교필터 모드 | 학교: ${schoolName} | 검색어: ${title}`,
      '\n  →', logUrl.toString(),
    );

    try {
      const listRes = await fetch(listUrl.toString(), {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8_000),
      });
      if (!listRes.ok) throw new Error(`MAJOR list HTTP ${listRes.status}`);

      const listData: DepartmentsApiResponse = await listRes.json();
      const majors = listData?.dataSearch?.content ?? [];
      console.log(`[/api/departments] ${majors.length}개 카테고리 → MAJOR_VIEW 병렬 조회 시작`);

      // 각 학과 카테고리에 대해 MAJOR_VIEW로 개설 대학 목록 확인
      const filtered = (
        await batchProcess(
          majors,
          async (major): Promise<SchoolDepartment | null> => {
            const unis = await fetchMajorViewUniversities(major.majorSeq, apiKey);

            // 선택한 학교와 일치하는 항목 찾기
            const match = unis.find((u) => u.schoolName === schoolName);
            if (!match) return null;

            // 학교 고유 학과명에 검색어가 포함되어야 함
            // (API가 facilName 등 부가 필드에서도 검색하므로 무관한 카테고리 제거)
            if (!match.majorName.includes(title)) return null;

            return {
              majorSeq: major.majorSeq,
              mClass: major.mClass,
              lClass: major.lClass,
              majorName: match.majorName,   // 해당 학교의 실제 학과명
              campusName: match.campus_nm,
            };
          },
          5,
        )
      ).filter((r): r is SchoolDepartment => r !== null);

      console.log(
        `[/api/departments] ← ${filtered.length}개 학과 확인됨 (캐시 크기: ${majorViewCache.size})`,
      );
      return NextResponse.json(filtered);
    } catch (err) {
      console.error('[/api/departments] 학교필터 오류:', err);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }
  }

  // ── 모드 2: 전체 목록 (학교 미선택 시 프리로드용) ──────────────────────
  const url = new URL(CAREER_NET_BASE);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('svcType', 'api');
  url.searchParams.set('svcCode', 'MAJOR');
  url.searchParams.set('gubun', 'univ_list');
  url.searchParams.set('thisPage', '1');
  url.searchParams.set('perPage', '600');
  url.searchParams.set('contentType', 'json');
  if (title) url.searchParams.set('searchTitle', title);
  if (subject) url.searchParams.set('subject', subject);

  const logUrl = new URL(url.toString());
  logUrl.searchParams.set('apiKey', '***');
  console.log('[/api/departments] 전체목록 모드 →', logUrl.toString());

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultCode = (data as any)?.dataSearch?.result?.content?.code;
    if (resultCode !== undefined && Number(resultCode) < 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultMsg = (data as any)?.dataSearch?.result?.content?.message ?? 'API 오류';
      console.error('[/api/departments] API 오류 코드:', resultCode, resultMsg);
      return NextResponse.json({ error: resultMsg }, { status: 400 });
    }

    const departments = data?.dataSearch?.content ?? [];
    console.log('[/api/departments] ← 결과 수:', departments.length);
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
