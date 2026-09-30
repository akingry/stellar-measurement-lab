from pathlib import Path
import json,csv,sqlite3,hashlib
root=Path(__file__).resolve().parents[2]
data=json.loads((root/'public/data/sample-audit.json').read_text())
rows=data['records']
folder=root/'diagnostics/mismatch-audit'
report='''# Diagnostic-example mismatch audit

## Scope and result

All 133 diagnostic examples were run through the unchanged production inference and ranking code. The separate 15,000-star population sample was preserved, not included in this diagnostic-example audit.

**101 catalog-consistent leading fits; 31 differing leading fits; one tied result.** These are descriptive counts, not an independent accuracy estimate. 116 comparisons contain untested model solutions. Broad-class or stage-group consistency is not proof of a precise evolutionary stage.

The previous comparator incorrectly called nine pre-main-sequence predictions against main-sequence/subgiant/giant catalog labels "not comparable." These are differing top choices, and the comparison bug is corrected. This increases the displayed mismatch count from 22 to 31 without changing a single prediction. The nine cases are 5876824, 8295509, 7732770, 8350630, 4814262, 8022670, 5878001, 7445809, and 6521917.

## Verified mismatch mechanisms

### Twenty-four subgiants: the relevant candidate receives no score

All 24 have a compatible phase-2 model at their original temperature and luminosity. The lithium likelihood only supports pre-main-sequence and main-sequence solutions. It therefore leaves the evolved candidate unscored and normalizes percentages over other stages. The code has not demonstrated that these stars are not subgiants. Expanding lithium beyond its published training domain or assigning missing likelihoods zero would be scientifically invalid.

Improvement: calibrate an evolved-star spectral likelihood (pressure-sensitive profiles plus composition and temperature) against independently validated subgiants and dwarfs. Compare all covered stages on the same measured spectral features, propagate uncertainties, and retain an untested status when coverage is missing. The current grid also needs a physically defined, validated subgiant/red-giant distinction; copying catalog labels into a phase mapping would not solve this.

### Kepler Input Catalog 4840662: an exact-position exclusion plus disabled evidence

The recorded inputs are 4,408 kelvin, radius 5.832 solar radii, and derived luminosity 11.569007 solar luminosities. The exact-position mesh returns only a contracting young-star solution. The example loader consequently disables its recorded oscillations (10.55 microhertz frequency spacing, 126 microhertz peak frequency, 79.7 seconds period spacing).

At the same temperature and radius 6.126 (one quoted upper radius error larger), a shell-burning-compatible phase is present at luminosity 12.764830. This is a sensitivity test, not a replacement observation. The independent-of-label oscillation classifier favors its hydrogen-shell/asymptotic-giant group. A fixed 25-position, Gaussian-penalized profile experiment using recorded diagnostics gives a compatible phase-2 leader. Young-star alternatives still have no applicable oscillation likelihood, so this remains provisional.

Improvement: evaluate recorded uncertainties and applicable diagnostic sets rather than assuming that a single exact-position candidate resolves the star. The production replacement must use the temperature/radius/flux covariance and a validated treatment of interpolation gaps and model discrepancy. A coarse audit scan does not establish that full likelihood.

### Kepler Input Catalog 8022670: another exact-position exclusion

The catalog giant has temperature 4,508 kelvin and luminosity 5.352985 solar luminosities; the exact mesh returns a young-star phase only. A compatible evolved phase appears within the quoted-error sensitivity scan, but lithium cannot score it. Radial frequency spacing and peak frequency are recorded, but dipole period spacing is missing, so the current three-input oscillation calibration cannot evaluate it. This is not corrected by switching on an incomplete diagnostic. It needs an uncertainty-aware candidate model and a calibrated diagnostic that can use the available observations, or an additional period-spacing measurement.

### Five main-sequence references: overlapping lithium likelihoods

Stars 5876824, 8295509, 7732770, 8350630, and 4814262 have both young and main-sequence likelihoods. The young branch leads with approximately 51–66 percent of the tested relative fit, not decisive posterior probabilities. Each audit record includes the actual predicted lithium strength, intrinsic scatter, residual, best-fit age/metallicity, and log likelihood for both branches. Parameter uncertainties and best-solution profiling matter; these are not proven mislabels in the catalog. Test uncertainty propagation, consistent spectral temperature scales, justified age/metallicity priors and marginalization, plus independent youth diagnostics. Do not tune a prior to these labels.

## Experiments, including regressions

1. **Diagnostic ablations:** position only, each recorded diagnostic individually, and their combination for every example. Stored observations and reference labels never change. The audit records cases where combining disjoint calibrations produces no complete score.
2. **Uncertainty plus all recorded diagnostics:** a fixed 25-point scan in temperature/radius for all 120 records with those errors, recomputing luminosity consistently. Relative to production: 88 matches remain matches, three disagreements become provisional matches, 27 disagreements remain, one disagreement becomes non-comparable, and one tie remains. This is an audit-only approximate profile likelihood; it does not include available but unrecorded covariance, full model systematics, or calibrated posterior probabilities.
3. **Additional spectrum-derived surface gravity:** 62 cross-matched published measurements tested at the unchanged temperature/luminosity, replacing the restricted lithium score. None of the covered subgiant disagreements becomes a match. Across all 62, three disagreements become matches, but 12 previously consistent results become disagreements and one tied result becomes a disagreement; two previously consistent results become non-comparable. Therefore this simple substitute was rejected as a production fix. Surface gravity is an atmosphere-model inference from light, not a raw line-width measurement. Mixing parameter scales without covariance or systematic-error treatment is not justified.

**No prediction, reference label, recorded measurement, or sample membership was changed.** The experiments are not independent validation or a promise that every catalog label is correct. Computational mechanisms are demonstrated; physical causes such as binarity, blending, metallicity, or catalog error are not assigned without evidence.

## Verification and next implementation gates

- Source audit checked all 133 selected records and database integrity; seismic training-object overlap is zero.
- Reference-label mutation leaves observation inputs and predictions unchanged.
- SHA-256 snapshots preserve both original databases and identify the inference code used.
- Every row records its measurements, production fit, comparison, reasons, tested variants, and improvement requirements.
- No magnesium measurement exists in this sample. It cannot validate the magnesium calibration.
- Before replacing production ranking: build the missing subgiant likelihood and covariance-aware observed-star mode; test holdouts and source-quality flags; quantify regressions; keep manual exact-position exploration separate.

## Sources

- [Lithium calibration domain: Jeffries and colleagues](https://arxiv.org/abs/2304.12197), [neural-network extension](https://arxiv.org/abs/2409.07523).
- [Kepler temperatures, radii, and broad reference classes](https://cdsarc.cds.unistra.fr/ftp/J/ApJ/866/99/ReadMe).
- [Published spectroscopic parameters and lithium measurements](https://cdsarc.cds.unistra.fr/ftp/J/A+A/664/A78/ReadMe).
- [Oscillation reference groups and known limitations](https://arxiv.org/abs/2411.03101).

## All examples

| Star | Reference | Leading model | Fit | Comparison | Verified reason |
|---|---|---|---|---|---|
'''
for r in rows:
    top=r['prediction']['rows'][0]
    pct='unscored' if top['percent'] is None else f"{top['percent']:.3f}%"
    report+=f"| {r['name']} | {r['referenceStage'] or r['reference']} | {top['name']} | {pct} | {r['status']} | {'; '.join(x['code'] for x in r['reasons'])} |\n"
(folder/'REPORT.md').write_text(report,encoding='utf-8')
(root/'public/data/sample-audit-report.md').write_text(report,encoding='utf-8')
with (root/'public/data/sample-audit.csv').open('w',newline='',encoding='utf-8-sig') as f:
    writer=csv.writer(f);writer.writerow(['id','name','reference_class','reference_stage','leading_model','relative_fit_percent','status','comparison','verified_causes','proposed_improvements','gravity_experiment','uncertainty_experiment'])
    for r in rows:
        top=r['prediction']['rows'][0]
        writer.writerow([r['id'],r['name'],r['reference'],r['referenceStage'],top['name'],top['percent'],r['status'],r['comparison'],' | '.join(x['text'] for x in r['reasons']),' | '.join(x['action'] for x in r['improvements']),r['gravityExperiment']['comparison'] if r['gravityExperiment'] else '',r['uncertaintyExperiment']['comparison'] if r['uncertaintyExperiment'] else ''])
db=sqlite3.connect(root/'public/data/sample-audit.sqlite')
db.execute('CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY,value TEXT)')
db.execute('CREATE TABLE IF NOT EXISTS sample_results(star_id TEXT PRIMARY KEY,status TEXT,reference_class TEXT,leading_phase INTEGER,leading_percent REAL,detail_json TEXT)')
with db:
    for k,v in data.items():
        if k!='records':db.execute('INSERT OR REPLACE INTO metadata VALUES (?,?)',(k,json.dumps(v)))
    for r in rows:
        top=r['prediction']['rows'][0]
        db.execute('INSERT OR REPLACE INTO sample_results VALUES (?,?,?,?,?,?)',(str(r['id']),r['status'],r['reference'],top['phase'],top['percent'],json.dumps(r)))
assert db.execute('SELECT count(*) FROM sample_results').fetchone()[0]==133
assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
db.close()
print('Wrote per-star report, CSV, and SQLite audit database.')
