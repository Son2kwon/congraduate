import {
  Box,
  Container,
  Stack,
  Title,
  Text,
  Badge,
  Button,
  Group,
  SimpleGrid,
  Card,
  ThemeIcon,
  Skeleton,
  Anchor,
} from '@mantine/core';
import {
  IconDatabase,
  IconBrain,
  IconShare,
  IconArrowRight,
  IconChartBar,
  IconUsers,
  IconAlertCircle,
} from '@tabler/icons-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

// ── Feature Card ─────────────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, color, title, description }: FeatureCardProps) {
  return (
    <Card
      shadow="sm"
      padding="xl"
      radius="xl"
      withBorder
      style={{ borderColor: `var(--mantine-color-${color}-2)` }}
    >
      <Stack gap="md">
        <ThemeIcon size={52} radius="xl" color={color} variant="light">
          {icon}
        </ThemeIcon>
        <Stack gap={6}>
          <Title order={4} fw={700}>
            {title}
          </Title>
          <Text size="sm" c="dimmed" lh={1.6}>
            {description}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}

// ── Stat Item ─────────────────────────────────────────────────────────────────
function StatItem({
  value,
  label,
  sublabel,
}: {
  value: string;
  label: string;
  sublabel?: string;
}) {
  return (
    <Stack gap={4} align="center">
      <Text
        fw={900}
        style={{
          fontSize: '2.5rem',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #1971c2 0%, #4dabf7 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        {value}
      </Text>
      <Text fw={600} size="sm">
        {label}
      </Text>
      {sublabel && (
        <Text size="xs" c="dimmed">
          {sublabel}
        </Text>
      )}
    </Stack>
  );
}

// ── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <LandingHeader />

      <main>
        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <Box
          component="section"
          id="hero"
          style={{
            background:
              'linear-gradient(160deg, #0f1f40 0%, #1a3a7c 40%, #1971c2 75%, #339af0 100%)',
            paddingTop: 100,
            paddingBottom: 100,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              position: 'absolute',
              top: -120,
              right: -120,
              width: 480,
              height: 480,
              borderRadius: '50%',
              background: 'rgba(51, 154, 240, 0.12)',
              pointerEvents: 'none',
            }}
          />
          <Box
            style={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 320,
              height: 320,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.04)',
              pointerEvents: 'none',
            }}
          />

          <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
            <Stack align="center" gap="xl">
              <Badge
                size="lg"
                variant="outline"
                radius="xl"
                px="lg"
                style={{ borderColor: 'rgba(144, 202, 249, 0.5)', color: '#a5d8ff' }}
              >
                🎓 졸업 요건 시뮬레이션 서비스
              </Badge>

              <Title
                order={1}
                ta="center"
                c="white"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 3.6rem)',
                  lineHeight: 1.2,
                  maxWidth: 760,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                }}
              >
                복잡한 졸업 요건,
                <br />
                한 눈에 관리하세요.{' '}
                <Text
                  span
                  inherit
                  style={{
                    background: 'linear-gradient(135deg, #74c0fc 0%, #a5d8ff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Con-graduate
                </Text>
              </Title>

              <Text ta="center" c="blue.1" size="lg" maw={600} lh={1.7}>
                중앙대학교를 시작으로 전국의 대학생들을 위한 맞춤형 졸업 시뮬레이션
                서비스를 제공합니다. 복수전공, 이중학위, 교양까지 하나의 플랫폼에서
                확인하세요.
              </Text>

              <Group gap="md">
                <Button
                  component="a"
                  href="/select"
                  size="xl"
                  radius="xl"
                  variant="white"
                  color="blue"
                  fw={700}
                  rightSection={<IconArrowRight size={18} />}
                >
                  서비스 시작하기
                </Button>
                <Button
                  component="a"
                  href="/dashboard"
                  size="xl"
                  radius="xl"
                  variant="outline"
                  color="white"
                  fw={600}
                  style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
                >
                  데모 보기
                </Button>
              </Group>

              <Group gap="sm" mt="xs">
                {['커리어넷 API 연동', '전국 대학교 지원', '복수전공 완벽 지원'].map(
                  (item) => (
                    <Badge
                      key={item}
                      size="sm"
                      radius="xl"
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        color: '#a5d8ff',
                        border: '1px solid rgba(165, 216, 255, 0.2)',
                      }}
                    >
                      ✓ {item}
                    </Badge>
                  )
                )}
              </Group>
            </Stack>
          </Container>
        </Box>

        {/* ── Stats Section ─────────────────────────────────────────────── */}
        <Box
          component="section"
          style={{
            background: 'white',
            borderBottom: '1px solid var(--mantine-color-gray-1)',
            paddingTop: 56,
            paddingBottom: 56,
          }}
        >
          <Container size="lg">
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xl">
              <StatItem value="200+" label="지원 학과 (예정)" sublabel="커리어넷 API 기준" />
              <StatItem value="40+" label="연동 대학교 (예정)" sublabel="전국 주요 대학" />
              <StatItem value="3가지" label="이수 구분 분석" sublabel="전공·교양·선택" />
              <StatItem value="100%" label="복수전공 지원" sublabel="이중학위 포함" />
            </SimpleGrid>
          </Container>
        </Box>

        {/* ── Features Section ──────────────────────────────────────────── */}
        <Box
          component="section"
          id="features"
          style={{
            background: 'linear-gradient(180deg, #f8faff 0%, #ffffff 100%)',
            paddingTop: 80,
            paddingBottom: 80,
          }}
        >
          <Container size="lg">
            <Stack align="center" gap="sm" mb={56}>
              <Badge size="md" variant="light" color="blue" radius="xl" px="lg">
                주요 기능
              </Badge>
              <Title
                order={2}
                ta="center"
                fw={800}
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}
              >
                Con-graduate가 특별한 이유
              </Title>
              <Text c="dimmed" ta="center" maw={500} size="md">
                학생들이 진정으로 필요한 기능에만 집중했습니다.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
              <FeatureCard
                icon={<IconDatabase size={26} />}
                color="blue"
                title="정확한 학과 데이터 기반"
                description="전국 대학교 API 연동을 통해 최신 학과 정보를 반영합니다. 커리어넷 공식 데이터를 활용하여 신뢰할 수 있는 졸업 요건을 제공합니다."
              />
              <FeatureCard
                icon={<IconBrain size={26} />}
                color="violet"
                title="맞춤형 졸업 판별"
                description="학번과 학과별로 다른 복잡한 이수 기준을 AI가 분석합니다. 입학년도별 커리큘럼 변경도 정확하게 추적합니다."
              />
              <FeatureCard
                icon={<IconShare size={26} />}
                color="teal"
                title="복수전공 완벽 지원"
                description="다양한 전공 이수 체계도 한 곳에서 관리할 수 있습니다. 주전공, 복수전공, 부전공, 이중학위까지 통합 분석합니다."
              />
              <FeatureCard
                icon={<IconChartBar size={26} />}
                color="orange"
                title="직관적인 대시보드"
                description="Ring Progress와 상세 카드를 통해 졸업 달성도를 시각화합니다. 남은 과목과 학점을 한눈에 파악하세요."
              />
              <FeatureCard
                icon={<IconUsers size={26} />}
                color="pink"
                title="과목 이수 체크리스트"
                description="전공기초·전공필수·전공선택·교양을 탭으로 구분하여 확인합니다. 과목별 성적도 함께 관리할 수 있습니다."
              />
              <FeatureCard
                icon={<IconAlertCircle size={26} />}
                color="green"
                title="졸업 위험 과목 알림"
                description="미이수 필수 과목과 학점 부족 현황을 즉시 알려드립니다. 졸업에 필요한 행동 지침을 제공합니다."
              />
            </SimpleGrid>
          </Container>
        </Box>

        {/* ── API Mockup Section ────────────────────────────────────────── */}
        <Box
          component="section"
          id="start"
          style={{
            background: 'linear-gradient(160deg, #f0f4ff 0%, #e8f0fe 100%)',
            paddingTop: 80,
            paddingBottom: 80,
          }}
        >
          <Container size="md">
            <Stack align="center" gap="sm" mb={48}>
              <Badge size="md" variant="filled" color="green" radius="xl" px="lg">
                API 연동 완료
              </Badge>
              <Title
                order={2}
                ta="center"
                fw={800}
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
              >
                학교 및 학과 선택
              </Title>
              <Text c="dimmed" ta="center" maw={520} size="md" lh={1.7}>
                <Text span fw={600} c="blue">
                  커리어넷(CareerNet) API
                </Text>{' '}
                연동을 통해 전국 대학교 및 학과 정보를 실시간으로 제공합니다.
                학교명을 입력하면 자동으로 대학교와 학과 목록이 검색됩니다.
              </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" maw={860} mx="auto">
              {/* 준비 중 상태 카드 */}
              <Card
                shadow="md"
                padding="xl"
                radius="xl"
                withBorder
                style={{
                  borderColor: 'rgba(144, 179, 255, 0.4)',
                  background: 'rgba(255,255,255,0.9)',
                }}
              >
                <Stack gap="lg">
                  <Group justify="space-between" align="center">
                    <Title order={5} fw={700}>
                      학교/학과 선택
                    </Title>
                    <Badge color="green" variant="light" size="sm" radius="sm">
                      실시간 데이터 연동
                    </Badge>
                  </Group>

                  <Stack gap="sm">
                    <Text size="xs" fw={600} c="dimmed">
                      학교 선택
                    </Text>
                    <Skeleton height={42} radius="md" animate />

                    <Text size="xs" fw={600} c="dimmed" mt={4}>
                      학과 선택
                    </Text>
                    <Skeleton height={42} radius="md" animate />
                  </Stack>

                  <Skeleton height={48} radius="md" animate />

                  <Box
                    style={{
                      background: '#ebfbee',
                      border: '1px solid #8ce99a',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}
                  >
                    <Text size="xs" c="green.8" lh={1.6}>
                      ✓ 커리어넷 API가 연동되어 전국 대학교 학과 정보를 실시간으로
                      검색할 수 있습니다.
                    </Text>
                  </Box>
                </Stack>
              </Card>

              {/* 데모 버전 안내 카드 */}
              <Card
                shadow="md"
                padding="xl"
                radius="xl"
                withBorder
                style={{
                  borderColor: 'var(--mantine-color-blue-2)',
                  background: 'linear-gradient(160deg, #e8f4fd 0%, #f0f8ff 100%)',
                }}
              >
                <Stack gap="lg" justify="space-between" h="100%">
                  <Stack gap="md">
                    <Badge color="blue" variant="light" size="sm" radius="sm">
                      데모 버전 체험 가능
                    </Badge>
                    <Stack gap={6}>
                      <Title order={4} fw={700} c="blue.8">
                        지금 바로 체험해보세요
                      </Title>
                      <Text size="sm" c="blue.7" lh={1.6}>
                        API 승인 전에도 더미 데이터로 실제와 동일한 UX를 경험할 수
                        있습니다.
                      </Text>
                    </Stack>

                    <Stack gap={8}>
                      {[
                        '중앙대학교 소프트웨어학부',
                        '시스템생명공학 복수전공',
                        '복수전공 이수 현황 대시보드',
                        '과목별 체크리스트',
                      ].map((item) => (
                        <Group key={item} gap={8}>
                          <Text c="blue.5" size="sm">
                            ✓
                          </Text>
                          <Text size="sm" c="blue.8">
                            {item}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </Stack>

                  <Stack gap="sm">
                    <Button
                      component="a"
                      href="/select"
                      size="md"
                      radius="md"
                      fullWidth
                      style={{
                        background:
                          'linear-gradient(135deg, #1971c2 0%, #339af0 100%)',
                        fontWeight: 700,
                      }}
                    >
                      학과 선택 화면으로
                    </Button>
                    <Button
                      component="a"
                      href="/dashboard"
                      size="md"
                      radius="md"
                      variant="light"
                      color="blue"
                      fullWidth
                    >
                      대시보드 데모 바로 보기
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            </SimpleGrid>

            <Stack align="center" mt={40} gap={6}>
              <Text size="xs" c="dimmed">
                데이터 제공 출처
              </Text>
              <Group gap={6}>
                <Badge variant="outline" color="blue" size="sm" radius="sm">
                  커리어넷 (CareerNet)
                </Badge>
                <Text size="xs" c="dimmed">
                  한국직업능력연구원 운영 공식 대학교 정보 API
                </Text>
              </Group>
            </Stack>
          </Container>
        </Box>

        {/* ── How It Works Section ──────────────────────────────────────── */}
        <Box
          component="section"
          style={{
            background: 'white',
            paddingTop: 80,
            paddingBottom: 80,
            borderTop: '1px solid var(--mantine-color-gray-1)',
          }}
        >
          <Container size="lg">
            <Stack align="center" gap="sm" mb={56}>
              <Badge size="md" variant="light" color="teal" radius="xl" px="lg">
                사용 방법
              </Badge>
              <Title
                order={2}
                ta="center"
                fw={800}
                style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}
              >
                3단계로 졸업 요건 확인 완료
              </Title>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
              {[
                {
                  step: '01',
                  color: 'blue',
                  title: '학교 & 학과 선택',
                  description:
                    '커리어넷 API로 연동된 전국 대학교/학과 목록에서 본인의 학교와 학과를 선택합니다.',
                },
                {
                  step: '02',
                  color: 'violet',
                  title: '이수 과목 입력',
                  description:
                    '수강한 과목에 체크하면 AI가 자동으로 졸업 요건 달성 여부를 계산합니다.',
                },
                {
                  step: '03',
                  color: 'teal',
                  title: '졸업 시뮬레이션 확인',
                  description:
                    '대시보드에서 잔여 학점, 미이수 과목, 졸업 가능 여부를 한 눈에 확인합니다.',
                },
              ].map((item) => (
                <Card
                  key={item.step}
                  padding="xl"
                  radius="xl"
                  style={{
                    background: `var(--mantine-color-${item.color}-0)`,
                    border: `1px solid var(--mantine-color-${item.color}-2)`,
                  }}
                >
                  <Stack gap="md">
                    <Text
                      fw={900}
                      style={{
                        fontSize: '3rem',
                        lineHeight: 1,
                        color: `var(--mantine-color-${item.color}-3)`,
                      }}
                    >
                      {item.step}
                    </Text>
                    <Stack gap={6}>
                      <Title order={4} fw={700} c={`${item.color}.8`}>
                        {item.title}
                      </Title>
                      <Text size="sm" c={`${item.color}.7`} lh={1.6}>
                        {item.description}
                      </Text>
                    </Stack>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Container>
        </Box>

        {/* ── CTA Section ───────────────────────────────────────────────── */}
        <Box
          component="section"
          style={{
            background: 'linear-gradient(135deg, #1a2f5e 0%, #1971c2 100%)',
            paddingTop: 72,
            paddingBottom: 72,
          }}
        >
          <Container size="md">
            <Stack align="center" gap="xl">
              <Stack gap="sm" align="center">
                <Title
                  order={2}
                  c="white"
                  ta="center"
                  fw={800}
                  style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}
                >
                  지금 바로 졸업 요건을 확인해보세요
                </Title>
                <Text c="blue.2" ta="center" maw={460} size="md">
                  복잡하게 계산하던 졸업 요건, Con-graduate가 한 번에 정리해드립니다.
                </Text>
              </Stack>
              <Group gap="md">
                <Button
                  component="a"
                  href="/select"
                  size="xl"
                  radius="xl"
                  variant="white"
                  color="blue"
                  fw={700}
                  rightSection={<IconArrowRight size={18} />}
                >
                  서비스 시작하기
                </Button>
                <Button
                  component="a"
                  href="/dashboard"
                  size="xl"
                  radius="xl"
                  variant="outline"
                  color="white"
                  fw={600}
                  style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
                >
                  데모 대시보드
                </Button>
              </Group>
              <Text size="xs" c="blue.4">
                개인정보는 수집되지 않으며, 별도의 회원가입이 필요없습니다.{' '}
                <Anchor href="/privacy" c="blue.3" size="xs">
                  개인정보처리방침
                </Anchor>
              </Text>
            </Stack>
          </Container>
        </Box>
      </main>

      <LandingFooter />
    </>
  );
}
