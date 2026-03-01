'use client';

import { useState } from 'react';
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
  Group,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { SCHOOLS, SCHOOL_SELECT_DATA } from '@/data/schools';

export default function SelectPage() {
  const router = useRouter();
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const departmentOptions =
    SCHOOLS.find((s) => s.value === selectedSchool)?.departments ?? [];

  const handleSchoolChange = (value: string | null) => {
    setSelectedSchool(value);
    setSelectedDepartment(null);
  };

  const handleStart = () => {
    router.push('/dashboard');
  };

  const isReady = selectedSchool !== null && selectedDepartment !== null;

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
              <Select
                label="학교 선택"
                placeholder="학교를 선택하세요"
                data={SCHOOL_SELECT_DATA}
                value={selectedSchool}
                onChange={handleSchoolChange}
                size="md"
                radius="md"
                searchable
                clearable
                styles={{
                  label: { fontWeight: 600, marginBottom: 6 },
                  input: { borderColor: selectedSchool ? '#339af0' : undefined },
                }}
              />
              <Select
                label="학과 선택"
                placeholder={
                  selectedSchool ? '학과를 선택하세요' : '먼저 학교를 선택해주세요'
                }
                data={departmentOptions}
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                disabled={!selectedSchool}
                size="md"
                radius="md"
                styles={{
                  label: { fontWeight: 600, marginBottom: 6 },
                  input: {
                    borderColor: selectedDepartment ? '#339af0' : undefined,
                    cursor: !selectedSchool ? 'not-allowed' : undefined,
                  },
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
                  {SCHOOLS.find((s) => s.value === selectedSchool)?.label}
                  {' · '}
                  {departmentOptions.find((d) => d.value === selectedDepartment)?.label}
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
