# Philosophy in the Islamic world: editorial research brief

**Status:** Preliminary research planning, not a finished article or independent scholarly review. Target: `data/branches.js` entry `id: "islamic"`.

## Expansion framework

Follow `frame-2026-10`: 5,000–8,000 words, “Scope and central questions,” 2–5 historical sections, 3–7 problem sections, “Encounters and comparisons,” “Criticisms and debates,” “Connections and influence,” and “Open questions.”

## Priority topics

- Translation movement
- al-Kindī and al-Fārābī
- Avicenna and metaphysics
- Kalām and critique
- Averroes and later traditions

## Accuracy safeguards

Distinguish falsafa, kalām, illuminationist and later philosophical traditions. Avoid portraying al-Ghazālī as ending philosophy.

## Scholarly source lead

- Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/arabic-islamic-philosophy/

**Unverified lead:** Check the URL, authorship and exact source passages before citation; supplement with primary sources and specialist scholarship.

## Publication checklist

- Record each sentence, claims and exact sources in `tests/audit/islamic.json`.
- Obtain independent review and resolve discrepancies.
- Generate article and section-level `xs` citations from reviewed audit.
- Run `python3 tests/study_tools.py`, `python3 tests/links.py`, and `python3 tests/smoke.py`.
- Do not alter published article until a separate reviewed article PR.
