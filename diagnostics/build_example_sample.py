"""Balanced diagnostic examples, selected without comparing predictions to labels."""
from pathlib import Path
from collections import Counter,defaultdict
import hashlib,json,random,sqlite3
ROOT=Path(__file__).resolve().parent.parent
FOLDER=ROOT/'diagnostics/representative'
audit=json.loads((FOLDER/'diagnostic-audit.json').read_text())
groups=defaultdict(list)
for r in audit['records']:
    if not r['qualifiedDiagnostics']:continue
    s=r['star']
    label=s['catalogClass']
    if label=='Red giant (broad catalog class)' and s['stageReference']:
        label=s['stageReference']['label']
    groups[label].append(r)
chosen=[]
for label,records in sorted(groups.items()):
    # Deterministic sampling across reference categories, NOT agreement/performance.
    records=sorted(records,key=lambda r:str(r['star']['id']))
    seed=int.from_bytes(hashlib.sha256(('20260930:'+label).encode()).digest()[:8],'big')
    rng=random.Random(seed);rng.shuffle(records)
    for record in records[:24]:
        s=dict(record['star'])
        qualified=[d for d in record['diagnostics'] if d['differentiates']]
        # Prefer the smallest applicable input set. Do not choose by reference label.
        chosen_diagnostic=next((d for d in qualified if d['name']=='position'),qualified[0])
        active=[] if chosen_diagnostic['name']=='position' else [chosen_diagnostic['name']]
        s['exampleSetup']={'measurements':active,'basis':'Temperature and luminosity already have one grid phase.' if not active else 'This measured diagnostic produces differential support between compatible model stages.',
          'otherRecordedDiagnostics':[n for n in record['availableDiagnostics'] if n not in active],
          'referenceCategory':label,
          'partial':chosen_diagnostic['partial']}
        chosen.append(s)
manifest={'version':22,'count':len(chosen),'population':'Balanced diagnostic examples, not a stellar-population-frequency sample',
 'categories':dict(Counter(s['exampleSetup']['referenceCategory'] for s in chosen)),
 'selection':'Up to 24 per reference category, seeded random sample of records with a usable discriminating diagnostic or a single H-R-grid phase. No selection on agreement with reference.',
 'sourceAuditCount':audit['summary']['audited'],'eligibleCount':audit['summary']['qualified'],
 'coverage':{k:sum(s.get(k) is not None for s in chosen) for k in ['T','luminosity','lithium','wing','Dnu','numax','DPi1']},
 'sources':audit['summary']['sources']+[
    {'url':'https://arxiv.org/abs/2103.12446','description':'Young-star luminosities'},
    {'url':'https://cdsarc.cds.unistra.fr/ftp/J/A+A/709/A144/','description':'Young-star lithium and temperatures'},
    {'url':'https://arxiv.org/abs/1709.00478','description':'Observed white-dwarf parameters'},
    {'url':'https://arxiv.org/abs/1703.10625','description':'Sirius B luminosity and temperature'},
    {'url':'https://arxiv.org/abs/1702.02574','description':'R Sculptoris temperature and luminosity'},
    {'url':'https://arxiv.org/abs/1710.04368','description':'Post-asymptotic-giant benchmark retained in full audit'}],
 'limitations':['Not an unbiased accuracy estimate: selection requires model coverage or differential diagnostic support.',
  'Untested competing model solutions remain visible; differential support is not complete resolution.',
  'No observed magnesium index is included. The early and thermally pulsing asymptotic-giant stages are not separately validated; one carbon-rich asymptotic giant is included. No post-asymptotic-giant example qualifies yet.',
  'Model phase 2 does not distinguish subgiants from red-giant-branch stars; this limitation is retained in comparisons.',
  'References share some evidence with inputs. Young-star formal errors omit correction systematics; compact-star parameters have model-atmosphere systematics.',
  'Temperature/luminosity uncertainties are recorded where available but not propagated by the exact-position fitting interface.',
  'Seismic-training IDs are excluded. Independence from all external calibration data is not established.']}
(ROOT/'public/data/diagnostic-stars.json').write_text(json.dumps({'manifest':manifest,'stars':chosen},separators=(',',':'),allow_nan=False))
# Preserve both eligible examples and unsupported records for a transparent audit.
db=sqlite3.connect(FOLDER/'diagnostic-benchmark.sqlite')
db.executescript('CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT); CREATE TABLE IF NOT EXISTS observations(star_id TEXT PRIMARY KEY,measurements_json TEXT); CREATE TABLE IF NOT EXISTS reference_labels(star_id TEXT PRIMARY KEY,reference_json TEXT); CREATE TABLE IF NOT EXISTS diagnostic_tests(star_id TEXT,diagnostic TEXT,result_json TEXT,PRIMARY KEY(star_id,diagnostic)); CREATE TABLE IF NOT EXISTS selected_examples(star_id TEXT PRIMARY KEY,setup_json TEXT);')
with db:
    for key,value in [('manifest',manifest),('audit',audit['summary'])]:db.execute('INSERT OR REPLACE INTO metadata VALUES (?,?)',(key,json.dumps(value)))
    for r in audit['records']:
        s=r['star'];refkeys={'catalogClass','classCode','spectralType','stageReference'}
        db.execute('INSERT OR REPLACE INTO observations VALUES (?,?)',(str(s['id']),json.dumps({k:v for k,v in s.items() if k not in refkeys})))
        db.execute('INSERT OR REPLACE INTO reference_labels VALUES (?,?)',(str(s['id']),json.dumps({k:s.get(k) for k in refkeys})))
        for test in r['diagnostics']:db.execute('INSERT OR REPLACE INTO diagnostic_tests VALUES (?,?,?)',(str(s['id']),test['name'],json.dumps(test)))
    for s in chosen:db.execute('INSERT OR REPLACE INTO selected_examples VALUES (?,?)',(str(s['id']),json.dumps(s['exampleSetup'])))
assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
assert db.execute('SELECT count(*) FROM selected_examples').fetchone()[0]==len(chosen)
db.close()
assert hashlib.sha256((ROOT/'public/data/observed-stars.json').read_bytes()).hexdigest()=='6303aeef763b9a7820bdbae220ea873efab5860660d9312f44d7d2be35323532'
print(json.dumps(manifest,indent=2))
