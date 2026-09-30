# Star Lab version nine

Scientific-accuracy correction: independent light-only sliders, no typing or snapping, no forced stage or mass. One illustration and `Stage unresolved`. Magnesium absorption is not currently fitted. Radius follows temperature and bolometric luminosity under the fixed assumptions in public/details.html. See SCIENCE-REVIEW.md for diagnostic limitations and primary-source investigation.

Run node v9-browser.cjs against a public-folder server on port 8767; TEST_URL selects the live target. Previous validation scripts are historical, not evidence of stage-inference accuracy.

## Historical implementation notes

# Star Lab — measurements to meaning

A mobile-first, measurement-driven stellar explorer. The interface exposes only effective temperature and bolometric luminosity. Gravity and composition constraints are disabled in every preset. Evolutionary stages are outputs, never a required user choice.

## Science

- Radius from Stefan–Boltzmann. The displayed mass range spans interpolated model solutions at the selected point, not a direct mass measurement. No main-sequence mass shortcut. The inference engine retains gravity/composition support for scientific validation, but those constraints are not supplied in this two-control interface.
- 1,071,066 MIST 1.2 nonrotating, solar-scaled model points across initial [Fe/H] −2 to +0.5 and log age 5.0–10.10.
- Point interpolation replaces tolerance-box matching. Same-phase triangles connect adjacent log-age/EEP nodes separately at each metallicity. Barycentric interpolation reproduces the chosen log temperature and log luminosity; no nearest-neighbor fallback is used. All overlapping phase solutions survive, with mass ranges separated by phase.
- Source phase 6 remains **post-AGB / white-dwarf cooling**, not a falsely precise white-dwarf label. Phase 2 remains post-main-sequence / RGB.
- Finite piecewise-linear model interpolation, not unique stellar-parameter inference. Triangles spanning more than 0.05 dex in log temperature or 0.25 dex in log luminosity are excluded, as are cells with missing nodes or mixed phases. Missing matches do not prove impossibility. Binaries, rotation, abundance-pattern variations, and asteroseismology are not fitted.
- Composition is **surface bulk [M/H]**, not an unqualified replacement for observed iron [Fe/H]. Surface fractions and reference mixture are documented in-app and in the manifest.
- Gravitational acceleration in the model cache is recomputed from published current mass and the app's Stefan–Boltzmann radius, enforcing GM/R². Validation found the separately tabulated/interpolated MIST log g can imply mass discrepancies up to 32.4% against other columns; it is not silently used as though consistent. The transformation and discrepancy are disclosed.
- Real-time sphere animation is illustrative, not a fluid or time-evolution simulation. Color integrates Planck spectra against analytic CIE fits, mapped to sRGB; not an atmosphere calculation.

## Data provenance and reproduction

Source: https://mist.science/data/tarballs_v1.2/MIST_v1.2_vvcrit0.0_basic_isos.txz

Source archive SHA-256: `4a70f193fe869331a327d2e31efea00798d5dfec4c4832424665cfbbcc1ab3f2`

`download_grid.py` downloads the official source archive into ignored `raw/`. `prepare_grid.py` converts the selected subset without thinning EEPs, recording checksums, transformations, filters, and examples in `public/data/manifest.json`. Requires Python, requests, numpy. `fetch_data.py` also retrieves the source documentation; PDF text extraction optionally uses PyMuPDF.

Scientific sources:

- Choi et al. 2016: https://arxiv.org/abs/1604.08592
- Dotter 2016: https://arxiv.org/abs/1601.05144
- MIST column/phase definitions: https://mist.science/README_tables.pdf
- Wyman et al. 2013 analytic CIE fits: https://jcgt.org/published/0002/02/01/

The browser downloads approximately 23.7 MB of compressed model data, checks file hashes where Web Crypto is available, decompresses in a Web Worker, and performs inference on-device. No accounts or data uploads. Modern browser with module workers and gzip DecompressionStream required. Serve via HTTP(S), not a file-preview application.

## Verify and run

`node validate.mjs` validates every cached row against the mass identity, source example phase recovery, constraint monotonicity, physical scaling, and no-match handling. Maximum float32-cache relative mass-identity error: 0.00000342.

`python -m http.server 8766 --bind 127.0.0.1 --directory public`

`browser-test.cjs` uses the workspace's installed Playwright/Chrome; run from the workspace root. It tests a 390×844 touch viewport and 1440×1000 desktop viewport. `TEST_URL` overrides the local test URL for live verification. Local evidence is in ignored `validation/`.

## Publication

GitHub Pages serves only the `public/` subtree on the `gh-pages` branch. No raw archives, local files, credentials, or unrelated workspace contents are published.

## Point-interpolation validation

Run node validate-point.mjs. It checks published examples, 207 synthetic interior points with known barycentric masses, coordinate residuals below 1e-9 dex, and no-extrapolation behavior. The cache produces 1,864,862 local same-phase triangles. A test at 3,500 K and 100,000 solar luminosities gives an interpolated current mass of approximately 14.9 solar masses in the covered core-helium-burning surface. Interpolation accuracy and model coverage remain limited by the source grid; matching the coordinate precisely does not imply a precisely known physical mass.
