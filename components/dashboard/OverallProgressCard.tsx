'use client';

import {
  Card,
  Group,
  RingProgress,
  Stack,
  Text,
  Title,
  Badge,
  SimpleGrid,
  Progress,
  Divider,
} from '@mantine/core';
import {
  IconSchool,
  IconTrophy,
  IconTargetArrow,
} from '@tabler/icons-react';

interface OverallProgressCardProps {
  completed: number;
  required: number;
  liberal: { completed: number; required: number };
  majorStats: Array<{ name: string; completed: number; required: number; type: string }>;
}

export function OverallProgressCard({
  completed,
  required,
  liberal,
  majorStats,
}: OverallProgressCardProps) {
  const percentage = Math.round((completed / required) * 100);

  const summaryItems = [
    ...majorStats.map((m) => ({
      label: m.name,
      type: m.type,
      completed: m.completed,
      required: m.required,
      color: m.type === '주전공' ? 'blue' : 'teal',
    })),
    {
      label: '교양',
      type: '교양',
      completed: liberal.completed,
      required: liberal.required,
      color: 'orange',
    },
  ];

  return (
    <Card
      id="overview"
      shadow="sm"
      padding="xl"
      radius="lg"
      withBorder
      style={{ borderColor: 'var(--mantine-color-blue-2)' }}
    >
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="xl">
        {/* 왼쪽: 타이틀 + 세부 요약 */}
        <Stack gap="md" style={{ flex: 1, minWidth: 260 }}>
          <Stack gap={4}>
            <Badge
              size="sm"
              variant="light"
              color="blue"
              leftSection={<IconSchool size={12} />}
            >
              중앙대학교 · 복수전공
            </Badge>
            <Title order={2} fw={800}>
              졸업 요건 달성 현황
            </Title>
            <Text c="dimmed" size="sm">
              소프트웨어학부 + 시스템생명공학 복수전공 기준
            </Text>
          </Stack>

          <Divider />

          <Stack gap="sm">
            {summaryItems.map((item) => {
              const pct = Math.round((item.completed / item.required) * 100);
              return (
                <Stack gap={6} key={item.label}>
                  <Group justify="space-between">
                    <Group gap={6}>
                      <Badge size="xs" variant="light" color={item.color}>
                        {item.type}
                      </Badge>
                      <Text size="sm" fw={600}>
                        {item.label}
                      </Text>
                    </Group>
                    <Text size="sm" c="dimmed">
                      {item.completed}
                      <Text span c="dimmed">
                        /{item.required}학점
                      </Text>
                    </Text>
                  </Group>
                  <Progress
                    value={pct}
                    color={pct >= 100 ? 'green' : item.color}
                    radius="xl"
                    size="md"
                  />
                </Stack>
              );
            })}
          </Stack>
        </Stack>

        {/* 오른쪽: Ring Progress */}
        <Stack align="center" gap="md">
          <RingProgress
            size={200}
            thickness={18}
            roundCaps
            label={
              <Stack gap={2} align="center">
                <Text
                  fw={800}
                  size="xl"
                  style={{ lineHeight: 1 }}
                >
                  {percentage}%
                </Text>
                <Text size="xs" c="dimmed">
                  달성
                </Text>
              </Stack>
            }
            sections={[
              { value: percentage, color: 'blue', tooltip: `이수 완료: ${completed}학점` },
            ]}
          />
          <Stack gap={4} align="center">
            <Group gap={6}>
              <IconTrophy size={16} color="var(--mantine-color-yellow-6)" />
              <Text fw={700} size="xl">
                {completed}
                <Text span size="md" c="dimmed" fw={400}>
                  {' '}/ {required}학점
                </Text>
              </Text>
            </Group>
            <SimpleGrid cols={2} spacing="xs">
              <Card
                padding="xs"
                radius="md"
                style={{
                  background: 'var(--mantine-color-blue-0)',
                  border: '1px solid var(--mantine-color-blue-2)',
                  textAlign: 'center',
                }}
              >
                <Text size="xs" c="dimmed">
                  이수 완료
                </Text>
                <Text fw={700} c="blue">
                  {completed}학점
                </Text>
              </Card>
              <Card
                padding="xs"
                radius="md"
                style={{
                  background: 'var(--mantine-color-gray-0)',
                  border: '1px solid var(--mantine-color-gray-2)',
                  textAlign: 'center',
                }}
              >
                <Text size="xs" c="dimmed">
                  잔여
                </Text>
                <Text fw={700} c="dimmed">
                  {required - completed}학점
                </Text>
              </Card>
            </SimpleGrid>
          </Stack>
        </Stack>
      </Group>
    </Card>
  );
}
