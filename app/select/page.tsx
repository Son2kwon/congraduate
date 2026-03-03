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
  ComboboxItem,
} from '@mantine/core';
import { IconArrowLeft, IconAlertCircle } from '@tabler/icons-react';
import type { CareerNetSchool, CareerNetDepartment } from '@/types/careernet';

export default function SelectPage() {
  const router = useRouter();

  // ── 학교 ────────────────────────────────────────────────────────────────
  const [schools, setSchools] = useState<CareerNetSchool[]>([]);
  const [schoolsLoading, setSchoolsLoading] = useState(true);
  const [schoolsError, setSchoolsError] = useState<string | null>(null);
  const [selectedSchoolSeq, setSelectedSchoolSeq] = useState<string | null>(null);

  // ── 학과 ────────────────────────────────────────────────────────────────
  const [departments, setDepartments] = useState<CareerNetDepartment[]>([]);
  const [deptsLoading, setDeptsLoading] = useState(true);
  const [deptsError, setDeptsError] = useState<string | null>(null);
  const [selectedDeptSeq, setSelectedDeptSeq] = useState<string | null>(null);

  // 마운트 시 전체 목록을 한 번만 가져옴
  useEffect(() => {
    fetch('/api/schools')
      .then((r) => {
        if (!r.ok) throw new Error('학교 목록을 불러오지 못했습니다.');
        return r.json() as Promise<CareerNetSchool[] | { error: string }>;
      })
      .then((data) => {
        if ('error' in data) throw new Error(data.error);
        setSchools(data as CareerNetSchool[]);
      })
      .catch((e: Error) => setSchoolsError(e.message))
      .finally(() => setSchoolsLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/departments')
      .then((r) => {
        if (!r.ok) throw new Error('학과 목록을 불러오지 못했습니다.');
        return r.json() as Promise<CareerNetDepartment[] | { error: string }>;
      })
      .then((data) => {
        if ('error' in data) throw new Error((data as { error: string }).error);
        setDepartments(data as CareerNetDepartment[]);
      })
      .catch((e: Error) => setDeptsError(e.message))
      .finally(() => setDeptsLoading(false));
  }, []);

  const schoolSelectData: ComboboxItem[] = schools.map((s) => ({
    value: s.seq,
    label: s.campusName ? `${s.schoolName} (${s.campusName})` : s.schoolName,
  }));

  const deptSelectData: ComboboxItem[] = departments.map((d) => ({
    value: d.majorSeq,
    label: d.mClass,
  }));

  const selectedSchool = schools.find((s) => s.seq === selectedSchoolSeq) ?? null;
  const selectedDept = departments.find((d) => d.majorSeq === selectedDeptSeq) ?? null;
  const isReady = selectedSchool !== null && selectedDept !== null;

  const handleStart = () => {
    router.push('/dashboard');
  };

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

              <Select
                label="학교 선택"
                placeholder={schoolsLoading ? '목록 불러오는 중...' : '학교명을 입력하여 검색하세요'}
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
                  color="red"
                  radius="md"
                  variant="light"
                >
                  {deptsError}
                </Alert>
              )}

              <Select
                label="학과 선택"
                placeholder={deptsLoading ? '목록 불러오는 중...' : '학과명을 입력하여 검색하세요'}
                data={deptSelectData}
                value={selectedDeptSeq}
                onChange={setSelectedDeptSeq}
                searchable
                clearable
                disabled={deptsLoading}
                size="md"
                radius="md"
                rightSection={deptsLoading ? <Loader size="xs" /> : undefined}
                nothingFoundMessage="검색 결과가 없습니다"
                maxDropdownHeight={260}
                styles={{
                  label: { fontWeight: 600, marginBottom: 6 },
                  input: { borderColor: selectedDeptSeq ? '#339af0' : undefined },
                }}
              />
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
                  {selectedSchool.campusName
                    ? `${selectedSchool.schoolName} (${selectedSchool.campusName})`
                    : selectedSchool.schoolName}
                  {' · '}
                  {selectedDept.mClass}
                </Text>
              </Card>
            )}

            {/* 시작 버튼 */}
            <Button
              size="lg"
              radius="md"
              fullWidth
              disabled={!isReady}
              onClick={handleStart}
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
