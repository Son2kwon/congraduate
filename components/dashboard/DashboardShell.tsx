'use client';

import {
  AppShell,
  Group,
  Title,
  Text,
  NavLink,
  ActionIcon,
  Badge,
  Burger,
  Tooltip,
  Stack,
  Divider,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconDeviceLaptop,
  IconFlask,
  IconBooks,
  IconSun,
  IconMoon,
  IconSchool,
} from '@tabler/icons-react';

const NAV_ITEMS = [
  { href: '#overview', label: '대시보드', icon: <IconLayoutDashboard size={17} /> },
  { href: '#major1', label: '전공 1 (소프트웨어)', icon: <IconDeviceLaptop size={17} /> },
  { href: '#major2', label: '전공 2 (시스템생명)', icon: <IconFlask size={17} /> },
  { href: '#liberal', label: '교양/기타', icon: <IconBooks size={17} /> },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  const isDark = computedColorScheme === 'dark';

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="xl"
    >
      {/* ── Header ── */}
      <AppShell.Header
        style={{
          borderBottom: '1px solid var(--mantine-color-blue-1)',
          background: isDark
            ? 'var(--mantine-color-dark-7)'
            : 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Group h="100%" px="md" justify="space-between">
          {/* 왼쪽: 버거 + 로고 */}
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap={8}>
              <IconSchool
                size={28}
                color="var(--mantine-color-blue-6)"
                stroke={1.8}
              />
              <Title
                order={3}
                style={{
                  background: 'linear-gradient(135deg, #1971c2 0%, #339af0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                }}
              >
                Con-graduate
              </Title>
            </Group>
          </Group>

          {/* 오른쪽: 사용자 정보 + 다크모드 */}
          <Group gap="sm">
            <Group gap={6} visibleFrom="sm">
              <Badge size="sm" variant="light" color="blue">
                중앙대학교
              </Badge>
              <Text size="sm" c="dimmed">
                소프트웨어 / 시스템생명공학
              </Text>
            </Group>
            <Tooltip label={isDark ? '라이트 모드' : '다크 모드'} position="bottom">
              <ActionIcon
                variant="light"
                color={isDark ? 'yellow' : 'blue'}
                size="lg"
                radius="md"
                onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
                aria-label="다크모드 토글"
              >
                {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </AppShell.Header>

      {/* ── Navbar ── */}
      <AppShell.Navbar
        p="md"
        style={{
          borderRight: '1px solid var(--mantine-color-blue-1)',
          background: isDark
            ? 'var(--mantine-color-dark-7)'
            : 'rgba(248,250,255,0.98)',
        }}
      >
        <Stack gap="xs">
          <Text size="xs" fw={600} c="dimmed" px={10} tt="uppercase" mb={4}>
            메뉴
          </Text>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              label={item.label}
              leftSection={item.icon}
              component="a"
              href={item.href}
              styles={{
                root: {
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  borderRadius: 'var(--mantine-radius-md)',
                },
              }}
            />
          ))}

          <Divider my="sm" />

          <Text size="xs" fw={600} c="dimmed" px={10} tt="uppercase" mb={4}>
            이수 현황
          </Text>
          <Stack gap={4} px={10}>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                전체 달성도
              </Text>
              <Badge size="xs" color="blue" variant="light">
                75%
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                총 이수 학점
              </Text>
              <Text size="xs" fw={600}>
                105 / 140
              </Text>
            </Group>
          </Stack>
        </Stack>
      </AppShell.Navbar>

      {/* ── Main ── */}
      <AppShell.Main
        style={{
          background: isDark
            ? 'var(--mantine-color-dark-8)'
            : 'linear-gradient(160deg, #f8faff 0%, #f0f4ff 100%)',
          minHeight: '100vh',
        }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
