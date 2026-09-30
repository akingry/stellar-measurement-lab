# Diagnostic-example mismatch audit

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
| R Sculptoris | Carbon-rich asymptotic giant branch | Thermally pulsing asymptotic giant branch | 100.000% | match | consistent-with-reference |
| Kepler Input Catalog 11414438 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 10549650 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 4570120 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 3647918 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 2309469 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 4930269 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6774769 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 8957543 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 9094309 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 10793277 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 9270087 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6371141 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6508544 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 4862332 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6449576 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6956335 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 4545532 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 3860550 | Core helium burning | Core helium burning | 100.000% | match | consistent-with-reference |
| Kepler Input Catalog 2016676 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 7692850 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 7739916 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 7532093 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 7301518 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 11135286 | Core helium burning | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 2996738 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 3338252 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 11554718 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 9286266 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 10722067 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 5543573 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 3937067 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 4840662 | Hydrogen-shell / asymptotic-giant group | Pre-main sequence | 100.000% | mismatch | reference-stage-absent-at-exact-position; recorded-diagnostic-not-enabled |
| Kepler Input Catalog 6590359 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 9946213 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 50.000% | neutral | incomplete-model-comparison; tied-leaders |
| Kepler Input Catalog 7622649 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 11805217 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 2831815 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 9075225 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 99.956% | match | incomplete-model-comparison |
| Kepler Input Catalog 12314595 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 7337694 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 2709230 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 99.999% | match | incomplete-model-comparison |
| Kepler Input Catalog 8561202 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 5380775 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 99.999% | match | incomplete-model-comparison |
| Kepler Input Catalog 9529734 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6118479 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 8350645 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 99.700% | match | incomplete-model-comparison |
| Kepler Input Catalog 3449907 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 4457331 | Hydrogen-shell / asymptotic-giant group | Post-main sequence / red giant branch | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 8019753 | Main sequence | Main sequence | 69.888% | match | incomplete-model-comparison |
| Kepler Input Catalog 8683442 | Main sequence | Main sequence | 71.115% | match | incomplete-model-comparison |
| Kepler Input Catalog 5876824 | Main sequence | Pre-main sequence | 51.398% | mismatch | overlapping-lithium-likelihoods; incomplete-model-comparison |
| Kepler Input Catalog 8552124 | Main sequence | Main sequence | 69.727% | match | incomplete-model-comparison |
| Kepler Input Catalog 5171752 | Main sequence | Main sequence | 63.529% | match | incomplete-model-comparison |
| Kepler Input Catalog 11098004 | Main sequence | Main sequence | 66.737% | match | incomplete-model-comparison |
| Kepler Input Catalog 4995418 | Main sequence | Main sequence | 63.330% | match | incomplete-model-comparison |
| Kepler Input Catalog 5697225 | Main sequence | Main sequence | 67.986% | match | incomplete-model-comparison |
| Kepler Input Catalog 9943581 | Main sequence | Main sequence | 60.197% | match | incomplete-model-comparison |
| Kepler Input Catalog 9533168 | Main sequence | Main sequence | 53.133% | match | incomplete-model-comparison |
| Kepler Input Catalog 9654342 | Main sequence | Main sequence | 58.754% | match | incomplete-model-comparison |
| Kepler Input Catalog 8487271 | Main sequence | Main sequence | 68.331% | match | incomplete-model-comparison |
| Kepler Input Catalog 5083272 | Main sequence | Main sequence | 52.111% | match | incomplete-model-comparison |
| Kepler Input Catalog 7105818 | Main sequence | Main sequence | 75.313% | match | incomplete-model-comparison |
| Kepler Input Catalog 8295509 | Main sequence | Pre-main sequence | 52.968% | mismatch | overlapping-lithium-likelihoods; incomplete-model-comparison |
| Kepler Input Catalog 7732770 | Main sequence | Pre-main sequence | 58.387% | mismatch | overlapping-lithium-likelihoods; incomplete-model-comparison |
| Kepler Input Catalog 5861082 | Main sequence | Main sequence | 71.844% | match | incomplete-model-comparison |
| Kepler Input Catalog 8350630 | Main sequence | Pre-main sequence | 66.095% | mismatch | overlapping-lithium-likelihoods; incomplete-model-comparison |
| Kepler Input Catalog 6272252 | Main sequence | Main sequence | 78.469% | match | incomplete-model-comparison |
| Kepler Input Catalog 6436856 | Main sequence | Main sequence | 57.804% | match | incomplete-model-comparison |
| Kepler Input Catalog 9761459 | Main sequence | Main sequence | 71.250% | match | incomplete-model-comparison |
| Kepler Input Catalog 4814262 | Main sequence | Pre-main sequence | 63.128% | mismatch | overlapping-lithium-likelihoods; incomplete-model-comparison |
| Kepler Input Catalog 9887784 | Main sequence | Main sequence | 76.777% | match | incomplete-model-comparison |
| Kepler Input Catalog 7120961 | Main sequence | Main sequence | 68.649% | match | incomplete-model-comparison |
| CVSO17 | Pre-main sequence (young-star survey) | Pre-main sequence | 100.000% | match | recorded-diagnostic-not-enabled |
| SO518 | Pre-main sequence (young-star survey) | Pre-main sequence | 100.000% | match | recorded-diagnostic-not-enabled |
| CVSO58 | Pre-main sequence (young-star survey) | Pre-main sequence | 100.000% | match | recorded-diagnostic-not-enabled |
| CVSO146 | Pre-main sequence (young-star survey) | Pre-main sequence | 100.000% | match | recorded-diagnostic-not-enabled |
| CVSO107 | Pre-main sequence (young-star survey) | Pre-main sequence | 100.000% | match | recorded-diagnostic-not-enabled |
| SO1153 | Pre-main sequence (young-star survey) | Pre-main sequence | 100.000% | match | recorded-diagnostic-not-enabled |
| CVSO176 | Pre-main sequence (young-star survey) | Pre-main sequence | 100.000% | match | recorded-diagnostic-not-enabled |
| CVSO36 | Pre-main sequence (young-star survey) | Pre-main sequence | 100.000% | match | recorded-diagnostic-not-enabled |
| Kepler Input Catalog 5976238 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6263410 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 3963653 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6058403 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6276948 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 5184199 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 9471796 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 4902641 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 8022670 | Red giant (broad catalog class) | Pre-main sequence | 100.000% | mismatch | reference-stage-absent-at-exact-position; recorded-diagnostic-not-enabled |
| Kepler Input Catalog 2988988 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 2438368 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 1575886 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6304081 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6851401 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 6620367 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 2975717 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | consistent-with-reference |
| Kepler Input Catalog 6778122 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 11072334 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 1725190 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 5300269 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 10029821 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 3222680 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 11302988 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 8247851 | Red giant (broad catalog class) | Core helium burning | 100.000% | match | incomplete-model-comparison |
| Kepler Input Catalog 7022298 | Subgiant | Main sequence | 71.154% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 7188873 | Subgiant | Main sequence | 77.651% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 6605691 | Subgiant | Main sequence | 63.832% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 5878001 | Subgiant | Pre-main sequence | 59.469% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 8096156 | Subgiant | Main sequence | 81.965% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 8367302 | Subgiant | Main sequence | 56.334% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 4543734 | Subgiant | Main sequence | 82.644% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 5430849 | Subgiant | Main sequence | 82.391% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 6605673 | Subgiant | Main sequence | 78.280% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 5953275 | Subgiant | Main sequence | 75.136% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 7445809 | Subgiant | Pre-main sequence | 72.059% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 8695721 | Subgiant | Main sequence | 69.799% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 8540530 | Subgiant | Main sequence | 78.054% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 6035466 | Subgiant | Main sequence | 64.052% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 6521917 | Subgiant | Pre-main sequence | 97.312% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 10024897 | Subgiant | Main sequence | 78.372% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 7202882 | Subgiant | Main sequence | 82.848% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 9351601 | Subgiant | Main sequence | 78.316% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 11253558 | Subgiant | Main sequence | 67.799% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 8687088 | Subgiant | Main sequence | 80.369% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 6934818 | Subgiant | Main sequence | 56.961% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 11414369 | Subgiant | Main sequence | 63.528% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 6268867 | Subgiant | Main sequence | 73.960% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| Kepler Input Catalog 6105540 | Subgiant | Main sequence | 70.705% | mismatch | reference-stage-not-calibrated; incomplete-model-comparison |
| 40 Eridani B | White-dwarf cooling | White-dwarf cooling | 100.000% | match | consistent-with-reference |
| Stein 2051 B | White-dwarf cooling | White-dwarf cooling | 100.000% | match | consistent-with-reference |
| Sirius B | White-dwarf cooling | White-dwarf cooling | 100.000% | match | consistent-with-reference |
| Procyon B | White-dwarf cooling | White-dwarf cooling | 100.000% | match | consistent-with-reference |
