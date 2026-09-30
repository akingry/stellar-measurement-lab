"""Extract measured spectral features, not evolutionary-stage labels.

Input: author preprint v1 HTML, retained with a SHA256 provenance record.
No classifier is trained and no split is called independent validation.
"""
import csv
import hashlib
import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent
BASE = ROOT / 'catalogs' / 'shetye2025'
raw = (BASE / 'article.html').read_bytes()
soup = BeautifulSoup(raw, 'html.parser')
# ArXiv MathML includes a duplicate TeX annotation. Keep rendered values only.
for annotation in soup.select('annotation'):
    annotation.decompose()

rows = []
for table_id, family in [('A2.T4', 'M'), ('A2.T5', 'S')]:
    table = soup.find(id=table_id)
    assert table is not None, table_id
    label = None
    for tr in table.select('tr'):
        cells = [''.join(td.get_text('', strip=True).split())
                 for td in tr.find_all(['td', 'th'], recursive=False)]
        joined = ' '.join(cells)
        if 'Tc-rich' in joined:
            label = 'technetium-rich'
            continue
        if 'Tc-poor' in joined:
            label = 'technetium-poor'
            continue
        if len(cells) != 5 or cells[0] == 'Star':
            continue
        assert label is not None, cells
        values = [float(v.replace('−', '-')) for v in cells[1:]]
        assert 4237 < values[0] < 4239 and 4261 < values[1] < 4263
        rows.append(dict(star=cells[0], spectral_family=family,
                         reference_feature_label=label,
                         blend_center_4238_angstrom=values[0],
                         blend_center_4262_angstrom=values[1],
                         titanium_oxide_index=values[2],
                         zirconium_oxide_index=values[3]))

assert rows and len({(r['star'], r['spectral_family']) for r in rows}) == len(rows)
with (BASE / 'measured-features.csv').open('w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=list(rows[0]))
    writer.writeheader()
    writer.writerows(rows)

groups = {}
for family in ['M', 'S']:
    for label in ['technetium-rich', 'technetium-poor']:
        subset = [r for r in rows if r['spectral_family'] == family
                  and r['reference_feature_label'] == label]
        if subset:
            groups[f'{family}/{label}'] = {
                'count': len(subset),
                'ranges': {k: [min(r[k] for r in subset), max(r[k] for r in subset)]
                           for k in list(rows[0])[3:]}}
report = {
    'source': 'https://arxiv.org/html/2507.20812v1',
    'version': 'Author preprint v1; not silently equated to final journal tables',
    'sha256': hashlib.sha256(raw).hexdigest(),
    'tables': ['A2.T4', 'A2.T5'], 'rows': len(rows), 'groups': groups,
    'interpretation': 'Reference labels are technetium detection categories, not independent evolutionary-stage ground truth.',
    'uncertainties': 'Per-feature uncertainties are not supplied in these extracted tables; ranges are descriptive, not confidence intervals.',
    'deployment': 'Not a deployed rule. Blend centers require wavelength/rest-frame calibration; molecular indices require the paper definitions.',
}
(BASE / 'extraction-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report, indent=2))
