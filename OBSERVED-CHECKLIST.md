# Real-star random validation

- [x] Identify a named observed population and published reference categories.
- [x] Fetch source catalogs with hashes; retain provenance and measurement flags.
- [x] Sample 15,000 unique stars proportionally, excluding seismic-training identifiers.
- [x] Verify database against source rows, allocation and missingness.
- [x] Load actual observations through Random without reference labels entering inference.
- [x] Display reference comparison, ties, disagreement and unsupported evidence honestly.
- [x] Test actual-value loading, missing-value handling, selection independence and phone layout.
- [x] Publish and verify the live button.
- [ ] Complete all five requested measurement groups for every star: BLOCKED by available catalog coverage; no compatible magnesium flux-index observations supplied by these catalogs.

Scope: the default population is the published Kepler target catalog, not all Galactic stars. Its three broad categories do not cover every evolutionary stage. Unknown/absent measurements are never synthesized or set to zero. Catalog classifications are references, not independent ground truth. Sampling proportions are not classifier priors.
