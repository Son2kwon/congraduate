'use client';

import {
  Card,
  Grid,
  Group,
  Stack,
  Text,
  Title,
  Badge,
  Progress,
  RingProgress,
  Divider,
  ThemeIcon,
} from '@mantine/core';
import { IconBook, IconBookmark } from '@tabler/icons-react';
import type { MajorStats } from '@/types/dashboard';

interface MajorCardProps {
  stats: MajorStats;
  color: string;
  sectionId: string;
}

function MajorCard({ stats, color, sectionId }: MajorCardProps) {
  const percentage = Math.round((stats.completed / stats.required) * 100);

  return (
    <Card
      id={sectionId}
      shadow="sm"
      padding="lg"
      radius="lg"
      withBorder
      h="100%"
      style={{ borderColor: `var(--mantine-color-${color}-2)` }}
    >
      <Stack gap="lg">
        {/* 헤더 */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Badge
              size="sm"
              variant="filled"
              color={color}
              leftSection={
                stats.type === '주전공' ? (
                  <IconBook size={11} />
                ) : (
                  <IconBookmark size={11} />
                )
              }
            >
              {stats.type}
            </Badge>
            <Title order={4} fw={700}>
              {stats.name}
            </Title>
          </Stack>
          <RingProgress
            size={72}
            thickness={7}
            roundCaps
            label={
              <Text size="xs" fw={700} ta="center" c={color}>
                {percentage}%
              </Text>
            }
            sections={[{ value: percentage, color }]}
          />
        </Group>

        {/* 총 학점 */}
        <Card
          padding="sm"
          radius="md"
          style={{
            background: `var(--mantine-color-${color}-0)`,
            border: `1px solid var(--mantine-color-${color}-2)`,
          }}
        >
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              총 이수 학점
            </Text>
            <Group gap={4}>
              <Text fw={800} size="lg" c={color}>
                {stats.completed}
              </Text>
              <Text c="dimmed">/ {stats.required}학점</Text>
            </Group>
          </Group>
        </Card>

        <Divider />

        {/* 카테고리별 현황 */}
        <Stack gap="md">
          {stats.categories.map((cat) => {
            const catPct = Math.round((cat.completed / cat.required) * 100);
            const isDone = cat.completed >= cat.required;
            return (
              <Stack gap={8} key={cat.name}>
                <Group justify="space-between">
                  <Group gap={8}>
                    <ThemeIcon
                      size="xs"
                      radius="xl"
                      color={isDone ? 'green' : color}
                      variant="light"
                    >
                      {isDone ? '✓' : '·'}
                    </ThemeIcon>
                    <Text size="sm" fw={600}>
                      {cat.name}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {cat.completed}/{cat.required}학점
                    {isDone && (
                      <Text span c="green" fw={600}>
                        {' '}
                        완료
                      </Text>
                    )}
                  </Text>
                </Group>
                <Progress
                  value={catPct}
                  color={isDone ? 'green' : color}
                  radius="xl"
                  size="sm"
                  striped={!isDone}
                  animated={!isDone && catPct > 0}
                />
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}

interface MajorCreditStatsProps {
  majorStats: MajorStats[];
}

export function MajorCreditStats({ majorStats }: MajorCreditStatsProps) {
  const colors = ['blue', 'teal'];

  return (
    <Stack gap="md">
      <Stack gap={2}>
        <Title order={3} fw={700}>
          전공별 이수 현황
        </Title>
        <Text c="dimmed" size="sm">
          주전공과 복수전공의 세부 학점 달성 현황을 비교합니다.
        </Text>
      </Stack>

      <Grid>
        {majorStats.map((stats, idx) => (
          <Grid.Col key={stats.key} span={{ base: 12, md: 6 }}>
            <MajorCard
              stats={stats}
              color={colors[idx] ?? 'blue'}
              sectionId={idx === 0 ? 'major1' : 'major2'}
            />
          </Grid.Col>
        ))}
      </Grid>
    </Stack>
  );
}
