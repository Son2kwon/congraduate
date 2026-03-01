'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Tabs,
  Table,
  Checkbox,
  Badge,
  Text,
  Title,
  Stack,
  Group,
  ScrollArea,
  Progress,
} from '@mantine/core';
import {
  IconDeviceLaptop,
  IconFlask,
  IconBooks,
} from '@tabler/icons-react';
import type { Course, CourseCategory, MajorKey } from '@/types/dashboard';

interface CourseChecklistTableProps {
  courses: Course[];
}

const CATEGORY_COLOR: Record<CourseCategory, string> = {
  전공기초: 'blue',
  전공필수: 'red',
  전공선택: 'violet',
  교양필수: 'orange',
  교양선택: 'yellow',
};

const GRADE_COLOR: Record<string, string> = {
  'A+': 'green',
  A0: 'green',
  'B+': 'blue',
  B0: 'blue',
  'C+': 'orange',
  C0: 'orange',
  P: 'teal',
};

const TABS: { value: MajorKey; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'software', label: '소프트웨어', icon: <IconDeviceLaptop size={15} />, color: 'blue' },
  { value: 'biotech', label: '시스템생명', icon: <IconFlask size={15} />, color: 'teal' },
  { value: 'liberal', label: '교양', icon: <IconBooks size={15} />, color: 'orange' },
];

export function CourseChecklistTable({ courses }: CourseChecklistTableProps) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(courses.filter((c) => c.completed).map((c) => c.id))
  );

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completionByTab = useMemo(() => {
    const result: Record<string, { done: number; total: number }> = {};
    for (const tab of TABS) {
      const tabCourses = courses.filter((c) => c.major === tab.value);
      const doneCreds = tabCourses
        .filter((c) => checked.has(c.id))
        .reduce((s, c) => s + c.credits, 0);
      const totalCreds = tabCourses.reduce((s, c) => s + c.credits, 0);
      result[tab.value] = { done: doneCreds, total: totalCreds };
    }
    return result;
  }, [courses, checked]);

  return (
    <Card
      id="liberal"
      shadow="sm"
      padding="xl"
      radius="lg"
      withBorder
      style={{ borderColor: 'var(--mantine-color-gray-2)' }}
    >
      <Stack gap="lg">
        <Stack gap={2}>
          <Title order={3} fw={700}>
            과목 이수 체크리스트
          </Title>
          <Text c="dimmed" size="sm">
            이수한 과목에 체크하세요. 체크 상태는 페이지 내에서 유지됩니다.
          </Text>
        </Stack>

        <Tabs defaultValue="software" keepMounted={false}>
          <Tabs.List>
            {TABS.map((tab) => {
              const stats = completionByTab[tab.value];
              return (
                <Tabs.Tab
                  key={tab.value}
                  value={tab.value}
                  color={tab.color}
                  leftSection={tab.icon}
                  rightSection={
                    <Badge size="xs" variant="light" color={tab.color} ml={4}>
                      {stats?.done}/{stats?.total}학점
                    </Badge>
                  }
                >
                  {tab.label}
                </Tabs.Tab>
              );
            })}
          </Tabs.List>

          {TABS.map((tab) => {
            const tabCourses = courses.filter((c) => c.major === tab.value);
            const stats = completionByTab[tab.value]!;
            const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

            return (
              <Tabs.Panel key={tab.value} value={tab.value} pt="lg">
                <Stack gap="md">
                  {/* 탭 내 진도 바 */}
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">
                      이수 진도
                    </Text>
                    <Text size="sm" fw={600} c={tab.color}>
                      {pct}%
                    </Text>
                  </Group>
                  <Progress
                    value={pct}
                    color={pct >= 100 ? 'green' : tab.color}
                    radius="xl"
                    size="md"
                    mb="xs"
                  />

                  <ScrollArea>
                    <Table
                      striped
                      highlightOnHover
                      withTableBorder
                      withColumnBorders
                      verticalSpacing="sm"
                      style={{ minWidth: 560 }}
                    >
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th w={52} ta="center">
                            이수
                          </Table.Th>
                          <Table.Th>과목명</Table.Th>
                          <Table.Th w={100}>이수구분</Table.Th>
                          <Table.Th w={70} ta="center">
                            학점
                          </Table.Th>
                          <Table.Th w={70} ta="center">
                            성적
                          </Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {tabCourses.map((course) => {
                          const isDone = checked.has(course.id);
                          return (
                            <Table.Tr
                              key={course.id}
                              style={{
                                opacity: isDone ? 1 : 0.55,
                                transition: 'opacity 0.15s ease',
                              }}
                            >
                              <Table.Td ta="center">
                                <Checkbox
                                  checked={isDone}
                                  onChange={() => toggle(course.id)}
                                  color={tab.color}
                                  radius="sm"
                                  size="sm"
                                />
                              </Table.Td>
                              <Table.Td>
                                <Text
                                  size="sm"
                                  fw={isDone ? 500 : 400}
                                  td={isDone ? undefined : undefined}
                                >
                                  {course.name}
                                </Text>
                              </Table.Td>
                              <Table.Td>
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={CATEGORY_COLOR[course.category]}
                                  radius="sm"
                                >
                                  {course.category}
                                </Badge>
                              </Table.Td>
                              <Table.Td ta="center">
                                <Text size="sm" fw={600}>
                                  {course.credits}
                                </Text>
                              </Table.Td>
                              <Table.Td ta="center">
                                {course.grade ? (
                                  <Text
                                    size="sm"
                                    fw={700}
                                    c={GRADE_COLOR[course.grade] ?? 'gray'}
                                  >
                                    {course.grade}
                                  </Text>
                                ) : (
                                  <Text size="xs" c="dimmed">
                                    미이수
                                  </Text>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Stack>
              </Tabs.Panel>
            );
          })}
        </Tabs>
      </Stack>
    </Card>
  );
}
