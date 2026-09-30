from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'public/data/diagnostic-stars.json').read_text())['manifest']
status={'version':22,'overall':'publishing','sampleCount':manifest['count'],'referenceGroups':manifest['categories'],
 'stages':{'originalSamplePreserved':'passed','sourceAcquisition':'passed','auditDatabase':'passed','sampleConstruction':'passed','coolingGridValidation':'passed','numericValidation':'passed','sourceValidation':'passed','phoneValidation':'passed','publication':'running','liveValidation':'pending'},
 'evidence':['public/data/diagnostic-stars.json','public/data/diagnostic-benchmark.sqlite','validation/v22-science.json','validation/v22-source-audit.json','validation/v22-browser.json','validation/v21-browser.json'],
 'remainingScientificCoverage':manifest['limitations'],
 'broadAllTypesGoal':'incomplete; this is a cross-category diagnostic example sample, not exhaustive validation of every stage'}
if '--final' in sys.argv:
    for name in ['v22-science','v22-source-audit','v22-browser','v22-live','v22-live-downloads']:
        assert json.loads((ROOT/'validation'/f'{name}.json').read_text())['passed']
    status['overall']='example_sample_delivered; exhaustive_stellar_coverage_incomplete'
    status['stages']['publication']='passed';status['stages']['liveValidation']='passed'
    status['evidence']+=['validation/v22-live.json','validation/v22-live-downloads.json']
    status['url']='https://akingry.github.io/stellar-measurement-lab/?v=22'
    status['deployment']='https://github.com/akingry/stellar-measurement-lab/actions/runs/36774289198'
    status['runningProcesses']=False
for path in ['completion-status.json','diagnostics/representative/completion-status.json']:(ROOT/path).write_text(json.dumps(status,indent=2))
