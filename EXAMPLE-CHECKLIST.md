# Diagnostic-specific real-star examples

- [x] Preserve the original 15,000-star JSON and database.
- [x] Expand the measured-star pool beyond the original draw.
- [x] Retain young-star, giant, dwarf, and remnant reference records with provenance.
- [x] Use measurements appropriate to each example; no requirement for every diagnostic.
- [x] Separate reference labels from model inputs and verify label-mutation invariance.
- [x] Retain disagreements, untested model solutions, and non-comparable labels.
- [x] Save full audit SQLite database (3,628 records) and 133-example JSON.
- [x] Add separate Random diagnostic example button; retain original Random.
- [x] Add bounded published cooling-grid coverage; check against observed compact-star benchmarks.
- [x] Test all sample records numerically and against source tables.
- [x] Test eight reference groups in phone-sized browser; inspect screenshot.
- [ ] Publish and verify live interactions and database downloads.

## Scope remaining incomplete

This sample spans eight reference groups, not all stellar types or every nuclear-burning stage. Early versus thermally pulsing asymptotic giants are not separately validated; the post-asymptotic-giant benchmark remains unsupported. A carbon-rich asymptotic giant is present. Subgiants and red-giant branch share a model phase flag. Some likelihood-supported examples still contain untested alternatives. No observed magnesium index is admitted yet.

These are explicit coverage gaps, not missing-values-to-zero substitutions. The downloadable audit retains unsuccessful records. Diagnostic-selected examples are not an unbiased estimate of classification accuracy. Twenty-two leading results disagree with references, and nine comparisons have non-equivalent category definitions; no aggregate accuracy is claimed.

## Reproduction

`python diagnostics/build_observed.py --diagnostic-pool` creates a separate full-catalog cross-match; it does not overwrite the original 15,000-star sample.

`python diagnostics/extend_young_examples.py`, `python diagnostics/extend_remnant_examples.py`, and `python diagnostics/extend_late_examples.py` append sourced observations. Downloaded paper tables and source hashes are retained locally under `diagnostics/catalogs`.

`python diagnostics/prepare_cooling.py` fetches the official Montreal grids. `node diagnostics/qualify_examples.mjs diagnostics/representative/expanded-all.json` audits records without passing references into inference. `python diagnostics/build_example_sample.py` creates the balanced sample and full audit database.

`node validate-examples.mjs`, `python diagnostics/validate_example_sources.py`, `node v22-browser.cjs`, and `node v21-browser.cjs` validate the new examples and preserve old Random behavior. Screenshots and validation reports are in `validation/`.
