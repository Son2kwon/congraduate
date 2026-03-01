import {
  Box,
  Container,
  Group,
  Stack,
  Text,
  Anchor,
  Title,
  Divider,
  SimpleGrid,
} from '@mantine/core';
import {
  IconSchool,
  IconMail,
  IconBrandGithub,
  IconExternalLink,
} from '@tabler/icons-react';

export function LandingFooter() {
  return (
    <Box
      component="footer"
      style={{
        background: 'linear-gradient(180deg, #1a2f5e 0%, #0f1f40 100%)',
        paddingTop: 60,
        paddingBottom: 32,
      }}
    >
      <Container size="lg">
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" mb="xl">
          {/* 브랜드 */}
          <Stack gap="sm">
            <Group gap={8}>
              <IconSchool size={22} color="#74b9ff" stroke={1.8} />
              <Title order={4} c="white">
                Con-graduate
              </Title>
            </Group>
            <Text size="sm" c="blue.2" lh={1.6}>
              대학생들의 복잡한 졸업 요건 관리를 돕는 교육 서비스입니다.
            </Text>
            <Text size="xs" c="blue.4">
              커리어넷(CareerNet) API 기반 대학교/학과 정보 연동
            </Text>
          </Stack>

          {/* 바로가기 */}
          <Stack gap="xs">
            <Text fw={600} c="gray.4" size="xs" tt="uppercase" mb={4}>
              바로가기
            </Text>
            {[
              { label: '홈', href: '/' },
              { label: '주요 기능', href: '/#features' },
              { label: '서비스 시작', href: '/select' },
              { label: '데모 대시보드', href: '/dashboard' },
            ].map((item) => (
              <Anchor
                key={item.href}
                component="a"
                href={item.href}
                c="blue.2"
                size="sm"
                style={{ textDecoration: 'none' }}
              >
                {item.label}
              </Anchor>
            ))}
          </Stack>

          {/* 정책 & 연락처 */}
          <Stack gap="xs">
            <Text fw={600} c="gray.4" size="xs" tt="uppercase" mb={4}>
              정보
            </Text>
            <Anchor
              href="/privacy"
              component="a"
              c="blue.2"
              size="sm"
              style={{ textDecoration: 'none' }}
            >
              개인정보처리방침
            </Anchor>
            <Anchor
              href="/terms"
              component="a"
              c="blue.2"
              size="sm"
              style={{ textDecoration: 'none' }}
            >
              이용약관
            </Anchor>

            <Stack gap={6} mt="sm">
              <Group gap={6}>
                <IconMail size={14} color="var(--mantine-color-blue-3)" />
                <Anchor
                  href="mailto:congraduate@example.com"
                  c="blue.2"
                  size="sm"
                  style={{ textDecoration: 'none' }}
                >
                  congraduate@example.com
                </Anchor>
              </Group>
              <Group gap={6}>
                <IconBrandGithub size={14} color="var(--mantine-color-blue-3)" />
                <Anchor
                  href="https://github.com/congraduate"
                  target="_blank"
                  rel="noopener noreferrer"
                  c="blue.2"
                  size="sm"
                  style={{ textDecoration: 'none' }}
                >
                  github.com/congraduate
                  <IconExternalLink size={11} style={{ marginLeft: 3, verticalAlign: 'middle' }} />
                </Anchor>
              </Group>
            </Stack>
          </Stack>
        </SimpleGrid>

        <Divider color="blue.9" mb="lg" />

        <Group justify="space-between" wrap="wrap" gap="xs">
          <Text size="xs" c="blue.4">
            Copyright © 2026 Con-graduate. All rights reserved.
          </Text>
          <Text size="xs" c="blue.5">
            Built with Next.js 14 · Mantine UI v7 · CareerNet API
          </Text>
        </Group>
      </Container>
    </Box>
  );
}
