import { NextRequest, NextResponse } from 'next/server';
import type {
  DepartmentsApiResponse,
  MajorViewApiResponse,
  MajorViewUniversity,
  SchoolDepartment,
} from '@/types/careernet';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 전체 학교 학과 스캔 시 처리 시간 확보 (Vercel Pro+)

const CAREER_NET_BASE = 'https://www.career.go.kr/cnet/openapi/getOpenApi.json';

// ── 서버 수명 동안 MAJOR_VIEW 결과를 캐시 ─────────────────────────────────
const majorViewCache = new Map<string, MajorViewUniversity[]>();

// MAJOR_VIEW 구조 파악용: 서버 재시작 후 첫 번째 캐시미스에만 로그 출력
let majorViewDebugLogged = false;

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

    // 서버 재시작 후 첫 번째 MAJOR_VIEW 응답만 구조 파악용으로 출력
    if (!majorViewDebugLogged) {
      majorViewDebugLogged = true;
      console.log('[DEBUG] MAJOR_VIEW 원시 응답 (majorSeq:', majorSeq, '):\n', JSON.stringify(data, null, 2));
      console.log('[DEBUG] MAJOR_VIEW → contentItem:\n', JSON.stringify(contentItem, null, 2));
      console.log('[DEBUG] MAJOR_VIEW → university (raw, Array.isArray:', Array.isArray(raw), '):\n', JSON.stringify(raw, null, 2));
      console.log('[DEBUG] MAJOR_VIEW → 최종 추출 unis:\n', JSON.stringify(unis, null, 2));
    }

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

  // ── 모드 1: 학교 필터 (schoolName 필수, title 선택) ─────────────────────
  // title 없으면 전체 학과 목록 조회, title 있으면 사전 필터 후 조회
  if (schoolName) {
    const listUrl = new URL(CAREER_NET_BASE);
    listUrl.searchParams.set('apiKey', apiKey);
    listUrl.searchParams.set('svcType', 'api');
    listUrl.searchParams.set('svcCode', 'MAJOR');
    listUrl.searchParams.set('gubun', 'univ_list');
    listUrl.searchParams.set('thisPage', '1');
    // title이 없으면 전체 카테고리(~600) 조회, 있으면 사전 필터
    listUrl.searchParams.set('perPage', title ? '50' : '600');
    listUrl.searchParams.set('contentType', 'json');
    if (title) listUrl.searchParams.set('searchTitle', title);

    try {
      const listRes = await fetch(listUrl.toString(), {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8_000),
      });
      if (!listRes.ok) throw new Error(`MAJOR list HTTP ${listRes.status}`);

      const listData: DepartmentsApiResponse = await listRes.json();
      console.log('[DEBUG] MAJOR 목록 원시 응답:\n', JSON.stringify(listData, null, 2));
      const majors = listData?.dataSearch?.content ?? [];

      // 전체 조회 시 동시성을 높여 처리 속도 개선 (캐시 적중 시 즉시 반환)
      const concurrency = title ? 5 : 12;

      // 각 학과 카테고리에 대해 MAJOR_VIEW로 개설 대학 목록 확인
      // filter()로 모든 캠퍼스 매치를 수집 → 캠퍼스별 개별 항목 생성
      const nested = await batchProcess(
        majors,
        async (major): Promise<SchoolDepartment[]> => {
          const unis = await fetchMajorViewUniversities(major.majorSeq, apiKey);

          // 선택한 학교와 일치하는 모든 캠퍼스 수집 (find → filter)
          const matches = unis.filter((u) => u.schoolName === schoolName);
          if (matches.length === 0) return [];

          return matches
            // title이 있을 때만 학과명 포함 여부 확인
            .filter((match) => !title || match.majorName.includes(title))
            .map((match) => ({
              majorSeq: major.majorSeq,
              mClass: major.mClass,
              lClass: major.lClass,
              majorName: match.majorName,
              // 빈 값 또는 누락 시 '본교'로 정규화
              campusName: match.campus_nm || '본교',
            }));
        },
        concurrency,
      );

      const filtered = nested.flat();
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
    console.log('[DEBUG] MAJOR 전체목록 원시 응답:\n', JSON.stringify(data, null, 2));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultCode = (data as any)?.dataSearch?.result?.content?.code;
    if (resultCode !== undefined && Number(resultCode) < 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultMsg = (data as any)?.dataSearch?.result?.content?.message ?? 'API 오류';
      console.error('[/api/departments] API 오류 코드:', resultCode, resultMsg);
      return NextResponse.json({ error: resultMsg }, { status: 400 });
    }

    const departments = data?.dataSearch?.content ?? [];
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
