# 사용법: python3 scripts/01_normalize_cse_curriculum.py <입력> [<출력>]  (경로는 프로젝트 루트 기준)
import json, re, sys, unicodedata
raw = json.load(open(sys.argv[1], encoding='utf-8'))
key = lambda s: re.sub(r'\s+', '', unicodedata.normalize('NFC', s))
cat = {}
for c in raw['courses']:
    k = key(c['name'])
    if k in cat: print('DUP main', c['name'])
    cat[k] = {**c, 'key': k, 'aliases': sorted({c['name']}), 'tracks': [], 'source': 'main_table'}
only_track = {}
for t in raw['tracks']:
    for c in t['courses']:
        k = key(c['name'])
        tgt = cat.get(k) or only_track.setdefault(k, {'key': k, 'name': c['name'], 'category': None, 'credits': None,
                                                       'year': c['year'], 'semester': c['semester'], 'aliases': [], 'tracks': [], 'source': 'track_only'})
        if c['name'] not in tgt['aliases']: tgt['aliases'] = sorted(set(tgt['aliases']) | {c['name']})
        if t['track'] not in tgt['tracks']: tgt['tracks'].append(t['track'])
        if k in cat and (c['year'], c['semester']) != (tgt['year'], tgt['semester']):
            print(f"학기불일치 {tgt['name']}: 본표 {tgt['year']}-{tgt['semester']} / {t['track']} 트랙 {c['year']}-{c['semester']}")
print('\n[본표에 없고 트랙표에만 있는 과목]', [v['name'] for v in only_track.values()])
print('\n[표기 흔들림(공백 차이)]', [v['aliases'] for v in list(cat.values())+list(only_track.values()) if len(v['aliases'])>1])
out = {'source': raw['source'], 'fetched': raw['fetched'], 'curriculum_year': None,
       'note': '과목코드 없음. key=공백 제거 과목명. track_only 과목은 학점·이수구분 미상',
       'courses': list(cat.values()) + list(only_track.values()), 'dual_listing': raw['dual_listing'], 'notes': raw['notes']}
json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('\n총', len(out['courses']), '과목 (본표', len(cat), '+ 트랙전용', len(only_track), ')',
      '| 본표 학점합', sum(c['credits'] for c in cat.values()))
