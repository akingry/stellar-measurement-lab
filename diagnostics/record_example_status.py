from pathlib import Path
import json
ROOT=Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'public/data/diagnostic-stars.json').read_text())['manifest']
status={'version':22,'overall':'publishing','sampleCount':manifest['count'],'referenceGroups':manifest['categories'],
 'stages':{'originalSamplePreserved':'passed','sourceAcquisition':'passed','auditDatabase':'passed','sampleConstruction':'passed','coolingGridValidation':'passed','numericValidation':'passed','sourceValidation':'passed','phoneValidation':'passed','publication':'running','liveValidation':'pending'},
 'evidence':['public/data/diagnostic-stars.json','public/data/diagnostic-benchmark.sqlite','validation/v22-science.json','validation/v22-source-audit.json','validation/v22-browser.json','validation/v21-browser.json'],
 'remainingScientificCoverage':manifest['limitations'],
 'broadAllTypesGoal':'incomplete; this is a cross-category diagnostic example sample, not exhaustive validation of every stage'}
for path in ['completion-status.json','diagnostics/representative/completion-status.json']:(ROOT/path).write_text(json.dumps(status,indent=2))
