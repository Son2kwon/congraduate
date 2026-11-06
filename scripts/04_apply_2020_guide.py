import json, re
from pathlib import Path
CATALOG = Path(__file__).resolve().parents[1] / 'data' / 'catalog' / 'courses_cau_sw.json'
k = lambda s: re.sub(r'\s+', '', s)
SRC = '2020 공학인증 안내서 p.73-75 (컴퓨터공학전문 교과과정표·선수과목)'
# 2020 교과과정표의 '공학주제(설계N)' → 현재 카탈로그 과목명
DESIGN = {'창의적설계': 3, '논리회로': 1, '프로그래밍': 1, '소프트웨어프로젝트': 1, '객체지향프로그래밍': 2,
          '프로그래밍언어론': 1, '데이터베이스': 1, '소프트웨어공학': 1, '캡스톤디자인(1)': 2, '인공지능': 1,
          'IoT프로젝트': 1, '네트워크응용설계': 1, '데이터베이스시스템': 1, '캡스톤디자인(2)': 2}
RENAMED = {'데이터베이스': '데이타베이스설계', 'IoT프로젝트': '고급IoT프로젝트', '캡스톤디자인(1)': '캡스톤프로젝트(1)', '데이터베이스시스템': '데이타베이스시스템'}
PREREQ = {'캡스톤디자인(1)': [['창의적설계']], '캡스톤디자인(2)': [['창의적설계']],
          '자료구조': [['기초컴퓨터프로그래밍', '프로그래밍']], '내장형시스템설계': [['운영체제', '컴퓨터구조']],
          '데이터베이스시스템': [['데이터베이스', '알고리즘']], '수치해석': [['선형대수학', '이산수학']],
          '설계패턴': [['소프트웨어공학', '객체지향프로그래밍']], '알고리즘': [['자료구조', '객체지향프로그래밍']],
          '인공지능': [['알고리즘']], '네트워크응용설계': [['운영체제', '컴퓨터통신']]}
d = json.load(open(CATALOG, encoding='utf-8'))
by = {c['key']: c for c in d['courses']}
for n, v in DESIGN.items():
    c = by[k(n)]; c['abeek']['design_credits'] = v; c['abeek']['design_credits_source'] = SRC
    if n in RENAMED and RENAMED[n] not in c['aliases']: c['aliases'].append(RENAMED[n])
for n, groups in PREREQ.items():
    by[k(n)]['prerequisites_any'] = groups  # 바깥 리스트 AND, 안쪽 리스트 OR
    by[k(n)]['prerequisites_source'] = SRC
for c in d['courses']:
    if c['abeek']['design'] and c['abeek'].get('design_credits') is None:
        c['abeek']['design_credits_note'] = '2026 체계도는 설계과목, 2020 안내서는 비설계 — 설계학점 미상'
d['classification_sources']['design_credits'] = SRC + ' — 이후 학점 변경 과목(캡스톤 2→3학점)은 재확인 필요'
json.dump(d, open(CATALOG, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
tot = sum(DESIGN.values()); req = DESIGN['창의적설계'] + DESIGN['캡스톤디자인(1)'] + DESIGN['캡스톤디자인(2)']
print('설계학점 합계', tot, '| 설계필수 3과목', req, '| 나머지에서 필요', 12 - req)
print('설계 미상', [c['name'] for c in d['courses'] if c['abeek'].get('design_credits_note')])
