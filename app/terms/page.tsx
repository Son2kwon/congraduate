import {
  Box,
  Container,
  Stack,
  Title,
  Text,
  Badge,
  Divider,
  Card,
  Anchor,
  Group,
} from '@mantine/core';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

const EFFECTIVE_DATE = '2026년 3월 1일';
const CONTACT_EMAIL = 'congraduate@example.com';

export const metadata = {
  title: '이용약관 · Con-graduate',
  description: 'Con-graduate 서비스 이용약관',
};

interface SectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

function TermsSection({ id, title, children }: SectionProps) {
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

export default function TermsPage() {
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
            <Badge
              variant="light"
              color="blue.2"
              radius="xl"
              size="sm"
              style={{ color: '#a5d8ff' }}
            >
              법적 고지
            </Badge>
            <Title
              order={1}
              c="white"
              fw={800}
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}
            >
              서비스 이용약관
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
          <Stack gap="xl">
            {/* 안내 박스 */}
            <Card
              padding="lg"
              radius="lg"
              style={{ background: '#e8f4fd', border: '1px solid #a5d8ff' }}
            >
              <Text size="sm" c="blue.8" lh={1.7}>
                본 약관은 Con-graduate(이하 &quot;서비스&quot;)의 이용에 관한 조건 및 절차,
                서비스 운영자와 이용자 간의 권리, 의무 및 책임사항을 규정합니다. 서비스를
                이용하시면 본 약관에 동의하신 것으로 간주됩니다.
              </Text>
            </Card>

            <TermsSection id="article1" title="제1조 (목적)">
              <Text size="sm">
                이 약관은 Con-graduate 서비스(이하 &quot;서비스&quot;)를 이용함에 있어 서비스
                운영자와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을 규정함을
                목적으로 합니다.
              </Text>
            </TermsSection>

            <TermsSection id="article2" title="제2조 (약관의 효력 및 변경)">
              <Stack gap="sm">
                <Text size="sm">
                  ① 이 약관은 서비스 화면에 게시하거나 이메일로 이용자에게 공지함으로써 효력을
                  발생합니다.
                </Text>
                <Text size="sm">
                  ② 운영자는 관계 법령을 위반하지 않는 범위에서 이 약관을 개정할 수 있습니다.
                </Text>
                <Text size="sm">
                  ③ 약관이 변경되는 경우 시행 7일 전부터 서비스 내 공지사항을 통해 안내하며,
                  변경 후에도 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 봅니다.
                </Text>
              </Stack>
            </TermsSection>

            <TermsSection id="article3" title="제3조 (서비스의 제공)">
              <Stack gap="sm">
                <Text size="sm">Con-graduate는 다음과 같은 서비스를 제공합니다:</Text>
                <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                  {[
                    '대학교/학과별 졸업 요건 정보 조회',
                    '이수 과목 체크리스트 및 학점 계산',
                    '복수전공·부전공·이중학위 통합 관리',
                    '졸업 달성도 시각화 대시보드',
                    '커리어넷(CareerNet) API 기반 대학교/학과 정보 제공 (예정)',
                  ].map((item) => (
                    <Box component="li" key={item} style={{ marginBottom: 6 }}>
                      <Text size="sm">{item}</Text>
                    </Box>
                  ))}
                </Box>
                <Text size="sm">
                  ② 운영자는 서비스 개선, 정책 변경 등의 이유로 서비스 내용을 변경할 수 있으며,
                  이 경우 사전 공지를 원칙으로 합니다.
                </Text>
                <Text size="sm">
                  ③ 커리어넷 API 서비스는 한국직업능력연구원의 정책에 따라 서비스 내용이
                  변경되거나 중단될 수 있습니다.
                </Text>
              </Stack>
            </TermsSection>

            <TermsSection id="article4" title="제4조 (이용자의 의무)">
              <Stack gap="sm">
                <Text size="sm">이용자는 다음 행위를 하여서는 안 됩니다:</Text>
                <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                  {[
                    '타인의 정보 도용 또는 허위 정보 입력',
                    '서비스 운영을 방해하는 행위 (크롤링, 무단 API 호출 등)',
                    '서비스에서 제공하는 정보를 상업적 목적으로 무단 사용',
                    '관련 법령 또는 이 약관이 금지하는 행위',
                  ].map((item) => (
                    <Box component="li" key={item} style={{ marginBottom: 6 }}>
                      <Text size="sm">{item}</Text>
                    </Box>
                  ))}
                </Box>
              </Stack>
            </TermsSection>

            <TermsSection id="article5" title="제5조 (서비스 이용 제한)">
              <Stack gap="sm">
                <Text size="sm">
                  운영자는 이용자가 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을
                  방해한 경우, 서비스 이용을 제한하거나 서비스 접속을 차단할 수 있습니다.
                </Text>
                <Text size="sm">
                  ② 운영자는 다음의 경우 사전 통지 없이 서비스를 일시 중단하거나 종료할 수
                  있습니다:
                </Text>
                <Box component="ul" style={{ paddingLeft: 20, margin: 0 }}>
                  {[
                    '시스템 점검, 유지보수 작업이 필요한 경우',
                    '천재지변, 국가 비상사태 등 불가항력적인 경우',
                    '연동 API(커리어넷 등) 서비스가 중단된 경우',
                  ].map((item) => (
                    <Box component="li" key={item} style={{ marginBottom: 6 }}>
                      <Text size="sm">{item}</Text>
                    </Box>
                  ))}
                </Box>
              </Stack>
            </TermsSection>

            <TermsSection id="article6" title="제6조 (지식재산권)">
              <Stack gap="sm">
                <Text size="sm">
                  ① 서비스에서 제공하는 콘텐츠(디자인, 텍스트, 소프트웨어 코드 등)의 지식재산권은
                  Con-graduate 운영팀에 있습니다.
                </Text>
                <Text size="sm">
                  ② 이용자는 서비스를 이용함으로써 얻은 정보를 운영자의 사전 서면 동의 없이
                  복제, 송신, 출판, 배포, 방송 등의 방법으로 영리 목적으로 이용하거나 제3자에게
                  제공해서는 안 됩니다.
                </Text>
                <Text size="sm">
                  ③ 커리어넷 API를 통해 제공되는 대학교/학과 정보의 저작권은 한국직업능력연구원에
                  있으며, 해당 데이터의 무단 수집·재배포를 금합니다.
                </Text>
              </Stack>
            </TermsSection>

            <TermsSection id="article7" title="제7조 (면책조항)">
              <Stack gap="sm">
                <Text size="sm">
                  ① Con-graduate는 교육 정보 제공을 목적으로 하며, 졸업 요건의 최종 판단은
                  반드시 소속 대학교 학사처 또는 지도교수를 통해 공식 확인하시기 바랍니다.
                </Text>
                <Text size="sm">
                  ② 서비스에 제공되는 졸업 요건 정보는 참고용이며, 실제 졸업 가능 여부와
                  다를 수 있습니다. 이에 따른 불이익에 대해 운영자는 법적 책임을 지지
                  않습니다.
                </Text>
                <Text size="sm">
                  ③ 커리어넷 API 정책 변경, 서버 오류 등 외부 요인으로 인한 서비스 장애에
                  대해 운영자의 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.
                </Text>
                <Card
                  padding="sm"
                  radius="md"
                  style={{ background: '#fff8e1', border: '1px solid #ffe082' }}
                >
                  <Text size="xs" c="orange.8" lh={1.6}>
                    ⚠ 중요: 본 서비스의 졸업 요건 데이터는 공식 학사 시스템을 대체하지
                    않습니다. 졸업 확정은 반드시 학교 공식 채널을 통해 확인하세요.
                  </Text>
                </Card>
              </Stack>
            </TermsSection>

            <TermsSection id="article8" title="제8조 (분쟁 해결)">
              <Stack gap="sm">
                <Text size="sm">
                  ① 서비스 이용과 관련하여 운영자와 이용자 간에 분쟁이 발생한 경우, 이를
                  원만하게 해결하기 위해 상호 협의합니다.
                </Text>
                <Text size="sm">
                  ② 협의가 이루어지지 않을 경우, 「콘텐츠산업진흥법」 제29조의 규정에 따른
                  콘텐츠분쟁조정위원회에 분쟁조정을 신청할 수 있습니다.
                </Text>
                <Text size="sm">
                  ③ 이용자는 개인정보 침해 관련 분쟁에 대해 개인정보보호위원회 또는
                  한국인터넷진흥원(KISA) 개인정보 침해신고센터에 신고할 수 있습니다.
                </Text>
              </Stack>
            </TermsSection>

            <TermsSection id="article9" title="제9조 (준거법 및 관할법원)">
              <Stack gap="sm">
                <Text size="sm">
                  ① 이 약관의 해석 및 운영자와 이용자 간의 분쟁에 대해서는 대한민국 법을
                  준거법으로 합니다.
                </Text>
                <Text size="sm">
                  ② 서비스 이용과 관련한 소송은 민사소송법 상의 관할법원에 제기합니다.
                </Text>
              </Stack>
            </TermsSection>

            {/* 문의 */}
            <Card padding="xl" radius="xl" withBorder>
              <Stack gap="sm">
                <Title order={4} fw={700}>
                  약관 관련 문의
                </Title>
                <Text size="sm" c="dimmed" lh={1.7}>
                  이 약관에 대한 문의사항이 있으시면 아래 이메일로 연락해주세요.
                </Text>
                <Group gap={8}>
                  <Text size="sm" fw={600}>
                    이메일:
                  </Text>
                  <Anchor href={`mailto:${CONTACT_EMAIL}`} size="sm">
                    {CONTACT_EMAIL}
                  </Anchor>
                </Group>
              </Stack>
            </Card>

            <Card
              padding="md"
              radius="lg"
              style={{ background: '#f8faff', border: '1px solid #d0e4ff' }}
            >
              <Text size="xs" c="dimmed" ta="center">
                본 약관은 {EFFECTIVE_DATE}부터 적용됩니다. &nbsp;|&nbsp;{' '}
                <Anchor href="/privacy" size="xs">
                  개인정보처리방침
                </Anchor>
              </Text>
            </Card>
          </Stack>
        </Container>
      </Box>

      <LandingFooter />
    </>
  );
}
