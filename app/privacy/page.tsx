import {
  Box,
  Container,
  Group,
  Stack,
  Title,
  Text,
  Badge,
  Divider,
  Card,
  Anchor,
} from '@mantine/core';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

const EFFECTIVE_DATE = '2026년 3월 1일';
const CONTACT_EMAIL = 'congraduate@example.com';

export const metadata = {
  title: '개인정보처리방침 · Con-graduate',
  description: 'Con-graduate 서비스 개인정보처리방침',
};

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

function PolicySection({ id, title, children }: SectionProps) {
  return (
    <Stack gap="md" id={id}>
      <Title order={3} fw={700} c="blue.8">
        {title}
      </Title>
      <Box style={{ color: 'var(--mantine-color-gray-7)', lineHeight: 1.8 }}>
        {children}
      </Box>
      <Divider color="gray.2" mt="xs" />
    </Stack>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <LandingHeader />

      {/* 히어로 배너 */}
      <Box
        style={{
          background: 'linear-gradient(160deg, #1a2f5e 0%, #1971c2 100%)',
          paddingTop: 56,
          paddingBottom: 56,
        }}
      >
        <Container size="lg">
          <Stack gap="sm">
            <Badge variant="light" color="blue.2" radius="xl" size="sm" style={{ color: '#a5d8ff' }}>
              법적 고지
            </Badge>
            <Title order={1} c="white" fw={800} style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>
              개인정보처리방침
            </Title>
            <Text c="blue.2" size="sm">
              시행일: {EFFECTIVE_DATE} &nbsp;·&nbsp; Con-graduate 운영팀
            </Text>
          </Stack>
        </Container>
      </Box>

      {/* 본문 */}
      <Box style={{ background: '#f8faff', paddingTop: 60, paddingBottom: 80 }}>
        <Container size="lg">
          <Stack gap={0} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 40 }}>
            {/* 사이드바 TOC */}
            <Card
              shadow="xs"
              padding="lg"
              radius="lg"
              withBorder
              style={{
                minWidth: 200,
                position: 'sticky',
                top: 80,
                alignSelf: 'flex-start',
                display: 'none',
              }}
              visibleFrom="md"
            >
              <Stack gap="xs">
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>
                  목차
                </Text>
                {[
                  { id: 'article1', label: '제1조 총칙' },
                  { id: 'article2', label: '제2조 수집 항목' },
                  { id: 'article3', label: '제3조 수집 목적' },
                  { id: 'article4', label: '제4조 보유 기간' },
                  { id: 'article5', label: '제5조 제3자 제공' },
                  { id: 'article6', label: '제6조 이용자 권리' },
                  { id: 'article7', label: '제7조 쿠키 정책' },
                  { id: 'article8', label: '제8조 보호책임자' },
                  { id: 'article9', label: '제9조 개정 이력' },
                ].map((item) => (
                  <Anchor
                    key={item.id}
                    component="a"
                    href={`#${item.id}`}
                    size="xs"
                    c="dimmed"
                    style={{ textDecoration: 'none' }}
                  >
                    {item.label}
                  </Anchor>
                ))}
              </Stack>
            </Card>

            {/* 본문 콘텐츠 */}
            <Stack gap="xl" style={{ flex: 1, minWidth: 0 }}>
              {/* 안내 박스 */}
              <Card
                padding="lg"
                radius="lg"
                style={{
                  background: '#e8f4fd',
                  border: '1px solid #a5d8ff',
                }}
              >
                <Text size="sm" c="blue.8" lh={1.7}>
                  Con-graduate(이하 &quot;서비스&quot;)는 「개인정보 보호법」 제30조에 따라 정보
                  주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수
                  있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
                </Text>
              </Card>

              <PolicySection id="article1" title="제1조 (총칙)">
                <Stack gap="sm">
                  <Text size="sm">
                    Con-graduate(이하 &quot;서비스&quot;)는 대학생들의 졸업 요건 관리를 지원하는
                    교육 정보 서비스입니다. 본 방침은 서비스 이용 과정에서 수집되는 개인정보의
                    처리에 관한 기준을 정합니다.
                  </Text>
                  <Text size="sm">
                    본 서비스는 회원가입 없이 이용 가능하며, 원칙적으로 최소한의 정보만을
                    처리합니다.
                  </Text>
                </Stack>
              </PolicySection>

              <PolicySection id="article2" title="제2조 (수집하는 개인정보 항목 및 방법)">
                <Stack gap="md">
                  <Text size="sm" fw={600}>
                    1. 수집 항목
                  </Text>
                  <Box
                    component="ul"
                    style={{ paddingLeft: 20, margin: 0 }}
                  >
                    {[
                      '서비스 이용 기록 (선택한 학교명, 학과명)',
                      '접속 환경 정보 (브라우저 종류, 운영체제, 접속 IP 주소)',
                      '쿠키 및 로컬 스토리지 데이터 (다크모드 설정 등 UI 환경 설정)',
                    ].map((item) => (
                      <Box component="li" key={item} style={{ marginBottom: 6 }}>
                        <Text size="sm">{item}</Text>
                      </Box>
                    ))}
                  </Box>
                  <Text size="sm" fw={600}>
                    2. 수집 방법
                  </Text>
                  <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                    {[
                      '서비스 화면에서 이용자 직접 입력',
                      '서비스 이용 과정에서 자동 생성·수집 (서버 로그, 쿠키)',
                    ].map((item) => (
                      <Box component="li" key={item} style={{ marginBottom: 6 }}>
                        <Text size="sm">{item}</Text>
                      </Box>
                    ))}
                  </Box>
                  <Card
                    padding="sm"
                    radius="md"
                    style={{ background: '#f0fff4', border: '1px solid #b2f2bb' }}
                  >
                    <Text size="xs" c="green.8">
                      ✅ 본 서비스는 이름, 생년월일, 주민등록번호, 이메일, 전화번호 등
                      민감한 개인정보를 수집하지 않습니다.
                    </Text>
                  </Card>
                </Stack>
              </PolicySection>

              <PolicySection id="article3" title="제3조 (개인정보 수집 및 이용 목적)">
                <Stack gap="sm">
                  <Text size="sm">수집된 정보는 다음의 목적으로만 사용됩니다:</Text>
                  <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                    {[
                      '졸업 요건 시뮬레이션 서비스 제공',
                      '서비스 품질 개선 및 오류 분석',
                      '서비스 접속 통계 분석 (비식별 처리)',
                      '이용자 UI 환경 설정 유지 (다크모드 등)',
                    ].map((item) => (
                      <Box component="li" key={item} style={{ marginBottom: 6 }}>
                        <Text size="sm">{item}</Text>
                      </Box>
                    ))}
                  </Box>
                </Stack>
              </PolicySection>

              <PolicySection id="article4" title="제4조 (개인정보 보유 및 이용 기간)">
                <Stack gap="sm">
                  <Text size="sm">
                    서비스는 개인정보 수집 목적이 달성되면 지체 없이 해당 정보를 파기합니다.
                    다만, 관계 법령에 따라 보존이 필요한 경우 아래 기간 동안 보유합니다:
                  </Text>
                  <Card padding="md" radius="md" withBorder>
                    <Stack gap="xs">
                      {[
                        { item: '서비스 이용 기록', period: '세션 종료 시 즉시 삭제 (서버 비저장)' },
                        { item: '접속 로그', period: '3개월 (통신비밀보호법)' },
                        {
                          item: '로컬 스토리지 데이터',
                          period: '브라우저 데이터 삭제 시까지 (이용자 직접 제어)',
                        },
                      ].map((row) => (
                        <Group key={row.item} justify="space-between" wrap="wrap">
                          <Text size="sm" fw={600}>
                            {row.item}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {row.period}
                          </Text>
                        </Group>
                      ))}
                    </Stack>
                  </Card>
                </Stack>
              </PolicySection>

              <PolicySection id="article5" title="제5조 (개인정보의 제3자 제공)">
                <Stack gap="sm">
                  <Text size="sm">
                    Con-graduate는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
                    다만, 아래의 경우에는 예외적으로 제공될 수 있습니다:
                  </Text>
                  <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                    {[
                      '이용자가 사전에 동의한 경우',
                      '법령의 규정에 따른 경우 (수사기관의 적법한 요청)',
                    ].map((item) => (
                      <Box component="li" key={item} style={{ marginBottom: 6 }}>
                        <Text size="sm">{item}</Text>
                      </Box>
                    ))}
                  </Box>
                  <Text size="sm" c="dimmed">
                    커리어넷(CareerNet) API를 통해 수신된 학교/학과 정보는 단방향으로만
                    활용되며, 이용자 데이터는 해당 기관에 전송되지 않습니다.
                  </Text>
                </Stack>
              </PolicySection>

              <PolicySection id="article6" title="제6조 (이용자의 권리 및 행사 방법)">
                <Stack gap="sm">
                  <Text size="sm">이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</Text>
                  <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                    {[
                      '개인정보 열람 요청',
                      '개인정보 정정·삭제 요청',
                      '개인정보 처리 정지 요청',
                      '개인정보 이동권 행사 (해당하는 경우)',
                    ].map((item) => (
                      <Box component="li" key={item} style={{ marginBottom: 6 }}>
                        <Text size="sm">{item}</Text>
                      </Box>
                    ))}
                  </Box>
                  <Text size="sm">
                    권리 행사는 아래 개인정보 보호책임자에게 이메일로 요청하시면 7일 이내에
                    처리해 드립니다.
                  </Text>
                </Stack>
              </PolicySection>

              <PolicySection id="article7" title="제7조 (쿠키 및 자동 수집 장치)">
                <Stack gap="sm">
                  <Text size="sm">
                    서비스는 이용자 경험 개선을 위해 쿠키(Cookie)와 브라우저 로컬 스토리지를
                    사용합니다:
                  </Text>
                  <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                    <Box component="li" style={{ marginBottom: 8 }}>
                      <Text size="sm" fw={600}>
                        필수 쿠키
                      </Text>
                      <Text size="sm" c="dimmed">
                        서비스 정상 작동에 필요 (다크모드 설정 저장)
                      </Text>
                    </Box>
                    <Box component="li" style={{ marginBottom: 8 }}>
                      <Text size="sm" fw={600}>
                        분석 쿠키
                      </Text>
                      <Text size="sm" c="dimmed">
                        접속 통계 수집 (비식별 처리, 선택적)
                      </Text>
                    </Box>
                  </Box>
                  <Text size="sm">
                    이용자는 브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 기능이
                    제한될 수 있습니다.
                  </Text>
                </Stack>
              </PolicySection>

              <PolicySection id="article8" title="제8조 (개인정보 보호책임자)">
                <Card padding="lg" radius="lg" withBorder>
                  <Stack gap="xs">
                    <Text size="sm" fw={600}>개인정보 보호책임자</Text>
                    <Box component="ul" style={{ paddingLeft: 20, margin: 0, listStyle: 'none' }}>
                      <Box component="li"><Text size="sm">• 소속: Con-graduate 운영팀</Text></Box>
                      <Box component="li"><Text size="sm">• 직책: 개인정보 보호책임자</Text></Box>
                      <Box component="li">
                        <Text size="sm">
                          • 이메일:{' '}
                          <Anchor href={`mailto:${CONTACT_EMAIL}`} size="sm">
                            {CONTACT_EMAIL}
                          </Anchor>
                        </Text>
                      </Box>
                    </Box>
                    <Divider my={4} />
                    <Text size="xs" c="dimmed">
                      개인정보 침해 관련 문의는{' '}
                      <Anchor
                        href="https://privacy.go.kr"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="xs"
                      >
                        개인정보보호위원회
                      </Anchor>{' '}
                      또는{' '}
                      <Anchor
                        href="https://privacy.kisa.or.kr"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="xs"
                      >
                        한국인터넷진흥원(KISA)
                      </Anchor>
                      에 신고하실 수 있습니다.
                    </Text>
                  </Stack>
                </Card>
              </PolicySection>

              <PolicySection id="article9" title="제9조 (개인정보처리방침 개정 이력)">
                <Stack gap="sm">
                  <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                    <Box component="li">
                      <Text size="sm">
                        <Text span fw={600}>
                          v1.0 ({EFFECTIVE_DATE})
                        </Text>{' '}
                        — 최초 제정
                      </Text>
                    </Box>
                  </Box>
                  <Text size="sm" c="dimmed">
                    본 방침이 개정될 경우, 시행 7일 전부터 서비스 내 공지사항을 통해 안내합니다.
                  </Text>
                </Stack>
              </PolicySection>

              <Card
                padding="md"
                radius="lg"
                style={{ background: '#f8faff', border: '1px solid #d0e4ff' }}
              >
                <Text size="xs" c="dimmed" ta="center">
                  본 방침은 {EFFECTIVE_DATE}부터 적용됩니다. &nbsp;|&nbsp;{' '}
                  <Anchor href="/terms" size="xs">
                    이용약관
                  </Anchor>
                </Text>
              </Card>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <LandingFooter />
    </>
  );
}
