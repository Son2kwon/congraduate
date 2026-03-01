'use client';

import {
  Box,
  Container,
  Group,
  Title,
  Anchor,
  ActionIcon,
  Burger,
  Drawer,
  Stack,
  Tooltip,
  useMantineColorScheme,
  useComputedColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMoon, IconSun, IconSchool } from '@tabler/icons-react';
import Link from 'next/link';

const NAV_LINKS = [
  { label: '주요 기능', href: '/#features' },
  { label: '서비스 시작', href: '/#start' },
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '이용약관', href: '/terms' },
];

export function LandingHeader() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';

  return (
    <>
      <Box
        component="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 200,
          borderBottom: '1px solid var(--mantine-color-blue-1)',
          background: isDark
            ? 'rgba(26, 27, 30, 0.96)'
            : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container size="lg">
          <Group h={64} justify="space-between">
            {/* 로고 */}
            <Anchor
              component={Link}
              href="/"
              style={{ textDecoration: 'none' }}
              aria-label="홈으로 이동"
            >
              <Group gap={8}>
                <IconSchool
                  size={26}
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
            </Anchor>

            {/* 데스크탑 네비게이션 */}
            <Group gap="lg" visibleFrom="sm">
              {NAV_LINKS.map((link) => (
                <Anchor
                  key={link.href}
                  component="a"
                  href={link.href}
                  size="sm"
                  fw={500}
                  c={isDark ? 'gray.3' : 'gray.7'}
                  style={{ textDecoration: 'none' }}
                >
                  {link.label}
                </Anchor>
              ))}
              <Tooltip label={isDark ? '라이트 모드' : '다크 모드'} position="bottom">
                <ActionIcon
                  variant="light"
                  color={isDark ? 'yellow' : 'blue'}
                  size="lg"
                  radius="md"
                  onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
                  aria-label="다크모드 토글"
                >
                  {isDark ? <IconSun size={17} /> : <IconMoon size={17} />}
                </ActionIcon>
              </Tooltip>
            </Group>

            {/* 모바일 버거 */}
            <Group hiddenFrom="sm" gap="sm">
              <Tooltip label={isDark ? '라이트 모드' : '다크 모드'}>
                <ActionIcon
                  variant="light"
                  color={isDark ? 'yellow' : 'blue'}
                  size="md"
                  radius="md"
                  onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
                >
                  {isDark ? <IconSun size={15} /> : <IconMoon size={15} />}
                </ActionIcon>
              </Tooltip>
              <Burger opened={opened} onClick={toggle} size="sm" />
            </Group>
          </Group>
        </Container>
      </Box>

      {/* 모바일 드로어 */}
      <Drawer
        opened={opened}
        onClose={close}
        padding="md"
        title={
          <Group gap={6}>
            <IconSchool size={20} color="var(--mantine-color-blue-6)" />
            <Title
              order={4}
              style={{
                background: 'linear-gradient(135deg, #1971c2 0%, #339af0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Con-graduate
            </Title>
          </Group>
        }
        hiddenFrom="sm"
      >
        <Stack gap="sm" pt="md">
          {NAV_LINKS.map((link) => (
            <Anchor
              key={link.href}
              component="a"
              href={link.href}
              fw={500}
              c="inherit"
              style={{ textDecoration: 'none', padding: '8px 0' }}
              onClick={close}
            >
              {link.label}
            </Anchor>
          ))}
        </Stack>
      </Drawer>
    </>
  );
}
