# 사용법: python3 scripts/03_parse_liberal_arts.py <입력> [<출력>]  (경로는 프로젝트 루트 기준)
import pdfplumber, sys, json, re
out = {'source': '2026학년도 제1학기 수강 및 학사 안내 — 10. 교양교육과정 교과목 일람 (p.32-39)', 'common': [], 'courses': []}
cur, unresolved = None, []
with pdfplumber.open(sys.argv[1]) as pdf:
    for p in pdf.pages:
        tables = sorted(p.find_tables(), key=lambda t: (round(t.bbox[0] / 300), t.bbox[1]))
        for tb in tables:
            t = tb.extract()
            hdr = t[0]
            if len(hdr) == 13 and hdr[4] == '입학년도':
                for r in t[2:]:
                    if r[0] and re.fullmatch(r'\d{5}', r[0]):
                        out['common'].append({'code': r[0], 'name': r[1].replace('\n', ''), 'credits': int(r[2]),
                                              'by_entry_year': {'2019~': r[4], '2016~2018': r[5], '2012~2015': r[6], '2011': r[7], '2003~2010': (r[8] or '').replace('\n', ' ')}})
                continue
            if not (len(hdr) == 9 and hdr[0] == '영역\n/역량'):
                continue
            for r in t[2:]:
                lab = (r[0] or '').replace('\n', '')
                if lab:
                    if lab == '선택':
                        cur = '선택-?'
                    elif lab.startswith('-'):
                        new = (cur.split('-')[0] if cur else '?') + lab
                        for c in unresolved: c['area'] = new
                        unresolved = []; cur = new
                    else:
                        cur = lab
                if not (r[1] and re.fullmatch(r'\d{5}', r[1])):
                    continue
                c = {'code': r[1], 'name': re.sub(r'\s*\n\s*', ' ', r[2]).strip(), 'credits': int(r[3]) if r[3] else None,
                     'area': cur, 'seoul': [bool(r[5] and '●' in r[5]), bool(r[6] and '●' in r[6])]}
                if cur == '선택-?': unresolved.append(c)
                out['courses'].append(c)
from collections import Counter
print('공통교양', len(out['common']), [ (c['name'], c['by_entry_year']['2019~']) for c in out['common']])
print('핵심/선택', len(out['courses']), Counter(c['area'] for c in out['courses']))
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
