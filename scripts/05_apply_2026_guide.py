import json, re
from pathlib import Path
CATALOG = Path(__file__).resolve().parents[1] / 'data' / 'catalog' / 'courses_cau_sw.json'
k = lambda s: re.sub(r'\s+', '', s)
SRC26 = '2026 공학교육인증 안내서 p.77-80 (컴퓨터공학전문 교과과정표·선수과목)'
D26 = {'창의적설계': 3, '논리회로': 1, '프로그래밍': 1, '소프트웨어프로젝트': 1, '객체지향프로그래밍': 2, '프로그래밍언어론': 1,
       '데이터베이스': 1, '소프트웨어공학': 1, '인공지능': 1, '캡스톤디자인(1)': 3, 'IoT프로젝트': 1, '네트워크응용설계': 1,
       '데이터베이스시스템': 1, '캡스톤디자인(2)': 3, '내장형시스템설계': 1}
PRE26 = {'캡스톤디자인(1)': [['창의적설계']], '캡스톤디자인(2)': [['창의적설계']], '자료구조': [['기초컴퓨터프로그래밍', '프로그래밍']],
         '내장형시스템설계': [['운영체제', '컴퓨터구조']], '데이터베이스시스템': [['데이터베이스', '알고리즘']], '수치해석': [['선형대수학', '이산수학']],
         '설계패턴': [['소프트웨어공학', '객체지향프로그래밍']], '알고리즘': [['자료구조', '수치해석', '확률및통계']],
         '네트워크응용설계': [['운영체제', '컴퓨터통신']], '거대언어모델': [['알고리즘', '인공지능']], '생성AI개론': [['자료구조']]}
d = json.load(open(CATALOG, encoding='utf-8'))
by = {c['key']: c for c in d['courses']}
for c in d['courses']:
    a = c['abeek']
    old = a.get('design_credits')
    a['design_credits_history'] = [{"as_of": "2020 안내서", "design_credits": old}] if old is not None else []
    if c['key'] == '내장형시스템설계':
        a['design_credits_history'] = [{"as_of": "2020 안내서", "name": "내장형시스템설계", "design_credits": 0}]
    new = D26.get(c['key'])
    a['design_credits'] = new if new is not None else (0 if a['design'] is False else a.get('design_credits'))
    a['design'] = 'required' if a['design'] == 'required' else bool(new)
    a['design_credits_source'] = SRC26
    a.pop('design_credits_note', None)
    if c['key'] in PRE26:
        c['prerequisites_any'] = PRE26[c['key']]; c['prerequisites_source'] = SRC26
    elif 'prerequisites_any' in c:
        c['prerequisites_history'] = [{"as_of": "2020 안내서", "prerequisites_any": c.pop('prerequisites_any')}]
        c.pop('prerequisites_source', None)
by['캡스톤디자인(1)']['abeek']['design_credits_rule'] = by['캡스톤디자인(2)']['abeek']['design_credits_rule'] = \
    '수강 당시 학점과 같음 (2학점 개설 시 설계2, 3학점 개설 시 설계3)'
by['내장형시스템설계']['abeek']['design_credits_rule'] = "수강 당시 과목명 '임베디드시스템설계'면 설계1, '내장형시스템설계'(2020)면 0"
if '임베디드시스템설계' not in by['내장형시스템설계']['aliases']: by['내장형시스템설계']['aliases'].append('임베디드시스템설계')
for n in ['수치해석', '확률및통계']:
    by[n]['general'].setdefault('history', [])
d['classification_sources']['design_credits'] = SRC26 + ' (이전 값은 design_credits_history)'
json.dump(d, open(CATALOG, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
ds = [c for c in d['courses'] if c['abeek']['design_credits']]
print('설계과목', len(ds), '합계', sum(c['abeek']['design_credits'] for c in ds), '| 설계필수', sum(by[x]['abeek']['design_credits'] for x in ['창의적설계','캡스톤디자인(1)','캡스톤디자인(2)']))
