'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Center,
  Stack,
  Title,
  Text,
  Select,
  Button,
  Card,
  Badge,
  Divider,
  Anchor,
  Loader,
  Alert,
  Skeleton,
  Group,
  ComboboxItem,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import type { CareerNetSchool, SchoolDepartment } from '@/types/careernet';

export default function SelectPage() {
  const router = useRouter();

  // ── 학교: 마운트 시 전체 목록 프리로드 ──────────────────────────────────
  const [schools, setSchools] = useState<CareerNetSchool[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [selectedSchoolSeq, setSelectedSchoolSeq] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/schools')
      .then((r) => {
        if (!r.ok) throw new Error('학교 목록을 불러오지 못했습니다.');
        return r.json() as Promise<CareerNetSchool[] | { error: string }>;
      })
      .then((data) => {
        console.log('Client Received - 학교 목록:', data);
        if ('error' in data) throw new Error(data.error);
        setSchools(data as CareerNetSchool[]);
      })
      .catch((e: Error) => setSchoolsError(e.message))
      .finally(() => setSchoolsLoading(false));
  }, []);

  // ── 학과: 학교 선택 시 전체 목록 프리로드, 이후 클라이언트 필터 ─────────
  const [departments, setDepartments] = useState<SchoolDepartment[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(false);
  const [deptsError, setDeptsError] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<SchoolDepartment | null>(null);
  const [deptRetryKey, setDeptRetryKey] = useState(0);

  const selectedSchool = schools.find((s) => s.seq === selectedSchoolSeq) ?? null;

  // 학교가 바뀌거나 재시도 시 해당 학교의 전체 학과 목록 로드
  useEffect(() => {
    setDepartments([]);
    setSelectedDept(null);
    setDeptsError(null);

    if (!selectedSchool) {
      setDeptsLoading(false);
      return;
    }

    let cancelled = false;
    setDeptsLoading(true);

    const params = new URLSearchParams({ schoolName: selectedSchool.schoolName });

    fetch(`/api/departments?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error('학과 정보를 불러오지 못했습니다.');
        return r.json() as Promise<SchoolDepartment[] | { error: string }>;
      })
      .then((data) => {
        console.log('Client Received - 학과 목록:', data);
        if (!cancelled) {
          if ('error' in data) throw new Error((data as { error: string }).error);
          setDepartments(data as SchoolDepartment[]);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setDeptsError(e.message);
      })
      .finally(() => {
        if (!cancelled) setDeptsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSchool, deptRetryKey]);

  const handleDeptChange = (value: string | null) => {
    if (!value) {
      setSelectedDept(null);
      return;
    }
    const found = departments.find((d) => d.majorSeq === value) ?? null;
    setSelectedDept(found);
  };

  // ── Select 데이터 ─────────────────────────────────────────────────────
  // CareerNet API는 모든 캠퍼스를 "제N캠퍼스"로만 제공하므로
  // 멀티캠퍼스 학교는 주소(adres)에서 도시명을 추출해 표시
  const schoolNameCount = new Map<string, number>();
  for (const s of schools) {
    schoolNameCount.set(s.schoolName, (schoolNameCount.get(s.schoolName) ?? 0) + 1);
  }

  const extractCity = (region: string, adres: string): string => {
    // 특별시·광역시·특별자치시 → 도시명 ("서울특별시" → "서울")
    const specialCity = region.match(/^([가-힣]+?)(?:특별시|광역시|특별자치시)$/);
    if (specialCity) return specialCity[1];
    // 전체 형식: "경기도 안성시..." → "안성"
    const fullForm = adres.match(/[가-힣]+도\s+([가-힣]+?)(?:시|군)/);
    if (fullForm) return fullForm[1];
    // 약칭 형식: "경기 용인시...", "경남 창원시..." → "용인", "창원"
    const shortForm = adres.match(/^[가-힣]{2}\s+([가-힣]+?)(?:시|군)/);
    if (shortForm) return shortForm[1];
    return region;
  };

  const schoolSelectData: ComboboxItem[] = schools.map((s) => {
    const isMulti = (schoolNameCount.get(s.schoolName) ?? 1) > 1;
    const label = isMulti
      ? `${s.schoolName} (${extractCity(s.region, s.adres)})`
      : s.schoolName;
    return { value: s.seq, label };
  });

  const deptSelectData: ComboboxItem[] = departments.map((d) => ({
    value: d.majorSeq,
    // 학교 고유 학과명 표시, 캠퍼스명이 있으면 괄호로 보조 표시
    label: d.campusName ? `${d.majorName} (${d.campusName})` : d.majorName,
  }));

  const isReady = selectedSchool !== null && selectedDept !== null;

  const deptPlaceholder = !selectedSchool ? '먼저 학교를 선택해주세요' : '학과명을 입력하여 검색하세요';
  const deptNothingFound = '검색 결과가 없습니다';

  return (
    <Center
      mih="100vh"
      px="md"
      style={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f7ff 100%)',
      }}
    >
      <Stack w="100%" maw={480} gap="md">
        <Anchor
          component="a"
          href="/"
          size="sm"
          c="blue"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <IconArrowLeft size={14} />
          홈으로 돌아가기
        </Anchor>

        <Card
          shadow="xl"
          padding="xl"
          radius="xl"
          withBorder
          w="100%"
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(144, 179, 255, 0.3)',
          }}
        >
          <Stack gap="xl">
            {/* 헤더 */}
            <Stack gap="xs" align="center">
              <Badge size="sm" variant="light" color="blue" radius="xl" px="md">
                졸업 요건 확인 서비스
              </Badge>
              <Title
                order={1}
                ta="center"
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #1971c2 0%, #4dabf7 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Con-graduate
              </Title>
              <Text c="dimmed" size="sm" ta="center">
                학교와 학과를 선택하면 졸업 요건을 확인할 수 있어요.
              </Text>
            </Stack>

            <Divider color="blue.1" />

            {/* 선택 영역 */}
            <Stack gap="md">
              {schoolsError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="red"
                  radius="md"
                  variant="light"
                >
                  {schoolsError}
                </Alert>
              )}

              {/* ① 학교 선택 (전체 목록 프리로드 + 클라이언트 필터) */}
              <Select
                label="학교 선택"
                placeholder={
                  schoolsLoading ? '목록 불러오는 중...' : '학교명을 입력하여 검색하세요'
                }
                data={schoolSelectData}
                value={selectedSchoolSeq}
                onChange={setSelectedSchoolSeq}
                searchable
                clearable
                disabled={schoolsLoading}
                size="md"
                radius="md"
                rightSection={schoolsLoading ? <Loader size="xs" /> : undefined}
                nothingFoundMessage="검색 결과가 없습니다"
                maxDropdownHeight={260}
                styles={{
                  label: { fontWeight: 600, marginBottom: 6 },
                  input: { borderColor: selectedSchoolSeq ? '#339af0' : undefined },
                }}
              />

              {deptsError && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  color="orange"
                  radius="md"
                  variant="light"
                >
                  <Group justify="space-between" align="center" gap="xs">
                    <Text size="sm" style={{ flex: 1 }}>{deptsError}</Text>
                    <Button
                      size="xs"
                      variant="light"
                      color="orange"
                      onClick={() => setDeptRetryKey((k) => k + 1)}
                    >
                      재시도
                    </Button>
                  </Group>
                </Alert>
              )}

              {/* ② 학과 선택: 로딩 중 Skeleton, 완료 후 Select */}
              {selectedSchool && deptsLoading ? (
                <Stack gap={6}>
                  <Text size="sm" fw={600}>
                    학과 선택 — {selectedSchool.schoolName} 개설 학과
                  </Text>
                  <Skeleton height={42} radius="md" />
                  <Group gap="xs" justify="center">
                    <Loader size="xs" color="blue" />
                    <Text size="xs" c="dimmed">학과 정보를 불러오는 중입니다...</Text>
                  </Group>
                </Stack>
              ) : (
                <Select
                  label={
                    selectedSchool
                      ? `학과 선택 — ${selectedSchool.schoolName} 개설 학과`
                      : '학과 선택'
                  }
                  placeholder={deptPlaceholder}
                  data={deptSelectData}
                  value={selectedDept?.majorSeq ?? null}
                  onChange={handleDeptChange}
                  searchable
                  clearable
                  disabled={!selectedSchool}
                  size="md"
                  radius="md"
                  nothingFoundMessage={deptNothingFound}
                  maxDropdownHeight={260}
                  styles={{
                    label: { fontWeight: 600, marginBottom: 6 },
                    input: { borderColor: selectedDept ? '#339af0' : undefined },
                  }}
                />
              )}

              {/* 학교 선택 안내 */}
              {!selectedSchool && !schoolsLoading && (
                <Text size="xs" c="dimmed" ta="center">
                  학교를 먼저 선택해야 해당 학교의 개설 학과를 확인할 수 있어요.
                </Text>
              )}
            </Stack>

            {/* 선택 요약 */}
            {isReady && (
              <Card
                padding="sm"
                radius="md"
                style={{
                  background: 'linear-gradient(135deg, #e8f4fd 0%, #f0f8ff 100%)',
                  border: '1px solid #a5d8ff',
                }}
              >
                <Text size="xs" c="blue.7" fw={600} mb={4}>
                  선택 확인
                </Text>
                <Text size="sm" c="blue.9">
                  {(schoolNameCount.get(selectedSchool.schoolName) ?? 1) > 1
                    ? `${selectedSchool.schoolName} (${extractCity(selectedSchool.region, selectedSchool.adres)})`
                    : selectedSchool.schoolName}
                  {' · '}
                  {selectedDept.majorName}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {selectedDept.lClass} &gt; {selectedDept.mClass}
                </Text>
              </Card>
            )}

            {/* 시작 버튼 */}
            <Button
              size="lg"
              radius="md"
              fullWidth
              disabled={!isReady}
              onClick={() => router.push('/dashboard')}
              style={{
                background: isReady
                  ? 'linear-gradient(135deg, #1971c2 0%, #339af0 100%)'
                  : undefined,
                fontWeight: 700,
                letterSpacing: '0.03em',
                height: 52,
                transition: 'all 0.2s ease',
              }}
            >
              시작하기
            </Button>
          </Stack>
        </Card>
      </Stack>
    </Center>
  );
}
