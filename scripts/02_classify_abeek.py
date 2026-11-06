# 사용법: python3 scripts/02_classify_abeek.py <입력> [<출력>]  (경로는 프로젝트 루트 기준)
import json, sys
p = sys.argv[1]
d = json.load(open(p, encoding='utf-8'))
ABEEK_REQ = {'자료구조','컴퓨터구조','소프트웨어공학','운영체제','프로그래밍언어론','알고리즘'}
CHART_GRAY = ABEEK_REQ | {'인공지능'}
DESIGN_REQ = {'창의적설계','캡스톤디자인(1)','캡스톤디자인(2)'}
DESIGN = {'프로그래밍','논리회로','소프트웨어프로젝트','데이터베이스','객체지향프로그래밍','프로그래밍언어론','소프트웨어공학','인공지능','IoT프로젝트','데이터베이스시스템','내장형시스템설계','네트워크응용설계'}
ALIAS = {'내장형시스템설계': '임베디드시스템설계'}
for c in d['courses']:
    n = c['key']
    g = c.get('category')
    c['general'] = {'category': g}
    c['abeek'] = {
        'category': 'BSM' if g == '전공기초' else ('공학주제' if g in ('전공', '전공필수') else None),
        'required': n in ABEEK_REQ,
        'chart_marked_required': n in CHART_GRAY,
        'design': 'required' if n in DESIGN_REQ else (True if n in DESIGN else False),
        'design_credits': None,
    }
    if n in ALIAS and ALIAS[n] not in c['aliases']: c['aliases'].append(ALIAS[n])
d['abeek_bsm_lab'] = ['일반물리실험(1)']
d['abeek_professional_liberal'] = [
    {'name': '글쓰기', 'credits': 2}, {'name': 'AI시대문제해결을위한디자인사고', 'credits': 2},
    {'name': '앙트레프레너십시대의회계', 'credits': 2}, {'name': '한국사', 'credits': 2}]
d['classification_sources'] = {
    'general': 'cse.cau.ac.kr/sub02/sub0202.php 학부교과과정표',
    'abeek': '컴퓨터공학전문 공학교육인증 규정(2024.02.16) + 2026-1학년도 교과목 이수 체계도',
    'design_credits': '미확보 — 설계과목 여부만 체계도 기준. 판정 시 과목 학점 전체를 설계학점으로 가정'}
json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
s = [c for c in d['courses'] if c['abeek']['design']]
print('설계과목', len(s), [c['name'] for c in s]); print('누락 확인', DESIGN - {c['key'] for c in d['courses']}, ABEEK_REQ - {c['key'] for c in d['courses']})
