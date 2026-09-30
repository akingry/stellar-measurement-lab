# Measured light constraint

The optional input is integrated, continuum-normalized magnesium-region wing absorption, not surface gravity and not an invented universal line-width/mass relation. The interface retains the temperature and luminosity sliders and adds expandable numeric measurement and uncertainty inputs.

## Reproduction

Run `python prepare_spectra.py` with NumPy installed. It parses official archive download lists, selects MARCS spectra at resolving power 10,000, solar-relative carbon and alpha abundances, and synthesis microturbulence 2 kilometers per second. It caches originals under ignored `raw/spectra/`, and writes `public/data/spectral-index.json` with individual original-file SHA-256 hashes. No download scripts are executed.

585 source spectra sample 10 temperatures from 3,500 to 7,500 kelvin, six metallicities from -2 to +0.5, and all available gravities. The 2024 library uses air wavelengths in this visible region. Source wavelength values are angstroms, converted to nanometers. Flux divided by the supplied continuum cancels the surface-intensity normalization.

Integrate `1 - flux / continuum` in air-wavelength bands 518.1104–518.3104 and 518.4104–518.6104 nanometers. Linear interpolation to each band endpoint is included before trapezoidal integration. This is a blended wing-region index, not an isolated magnesium equivalent width. The full line core is excluded.

## Inference and limitations

Each candidate remains at the exact chosen temperature and luminosity. Its current mass and Stefan–Boltzmann radius give gravitational acceleration. Trilinear atmosphere interpolation predicts an absorption index, conditional on fixed atmosphere assumptions. There is no gravity input or main-sequence mass/luminosity relation.

The measurement interval rejects calibrated candidates only. Missing interpolation corners, out-of-domain temperatures/gravities, and phases beyond core helium burning stay visible as spectrum not tested and remain in the overall mass range. Never interpret an untested candidate as excluded or as a spectral match. Atmospheric metallicity is assumed to equal initial track iron abundance. Surface diffusion, changed element ratios, winds, rotation and additional broadening are not fitted. This approximation and differences between atmosphere/evolution mixtures limit accuracy. Especially for evolved stars, a real spectroscopic analysis needs more diagnostics. The entered uncertainty is a user-specified interval, not a calibrated likelihood or confidence interval.

## Verification

- `node validate-spectral.mjs`: all 585 grid nodes recovered, no extrapolation, solar gravity check, 1,540 synthetic evolutionary candidates recovered, changing the measured index filters candidates, unsupported late phases retained.
- `node validate-point.mjs`: pre-existing exact-position interpolation checks.
- From parent directory, `node stellar-measurement-lab/spectral-browser.cjs`: phone layout, measurement/filter/reset/invalid-input checks.
- Existing browser and touch tests remain applicable; there are still exactly two range sliders.

References: [Mészáros et al. 2024](https://arxiv.org/abs/2407.10872), [Space Telescope Science Institute archive](https://stdatu.stsci.edu/hlsp/bosz).
