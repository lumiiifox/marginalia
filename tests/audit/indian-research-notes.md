# Indian philosophy: editorial research brief

**Status:** Preliminary research planning, not a finished article or independent scholarly review. Target: `data/branches.js` entry `id: "indian"`.

## Expansion framework

Follow `frame-2026-10`: 5,000–8,000 words, “Scope and central questions,” 2–5 historical sections, 3–7 problem sections, “Encounters and comparisons,” “Criticisms and debates,” “Connections and influence,” and “Open questions.”

## Priority topics

- Knowledge and pramāṇas
- Self and no-self
- Logic and debate
- Liberation and ethics
- Buddhist and Brahmanical traditions

## Accuracy safeguards

Distinguish Buddhist, Jain, Nyāya, Mīmāṃsā, Sāṃkhya, Yoga and Vedānta traditions. Avoid conflating ātman and anātman.

## Scholarly source lead

- Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/indian-philosophy/

**Unverified lead:** Check the URL, authorship and exact source passages before citation; supplement with primary sources and specialist scholarship.

## Publication checklist

- Record each sentence, claims and exact sources in `tests/audit/indian.json`.
- Obtain independent review and resolve discrepancies.
- Generate article and section-level `xs` citations from reviewed audit.
- Run `python3 tests/study_tools.py`, `python3 tests/links.py`, and `python3 tests/smoke.py`.
- Do not alter published article until a separate reviewed article PR.
