# African philosophy: editorial research brief

**Status:** Preliminary research planning, not a finished article, independent scholarly review or sentence-level audit. Target: `data/branches.js`, entry `id: "african"` (`tradition`).

## Expansion framework

Follow `frame-2026-10` in `CLAUDE.md`: 5,000–8,000 words; “Scope and central questions”; 2–5 historical sections; 3–7 central-problem sections; “Encounters and comparisons”; “Criticisms and debates”; “Connections and influence”; and “Open questions.” Preserve useful existing content and functional thinker/concept cross-links.

## Research priorities

- Historical traditions
- Ethnophilosophy controversy
- Personhood and community
- Political liberation
- Contemporary African epistemology

## Philosophical accuracy safeguards

Do not treat African philosophy as a homogeneous communal worldview. Distinguish ethnophilosophy debates, professional philosophy, sage philosophy and diverse regional traditions.

## Initial academic reference lead

- Stanford Encyclopedia of Philosophy: https://plato.stanford.edu/entries/african-philosophy/

**Unverified source lead:** confirm that this exact page exists, its authors and revision date, and its relevant passages before relying on it. Collect multiple appropriate scholarly references, including primary texts and specialists in the traditions under discussion. Do not infer historical influence from conceptual resemblance alone.

## Publication checklist

1. Record every sentence and substantive claim in `tests/audit/african.json` with specific source locators and quotation verification.
2. Complete independent second review and incorporate justified corrections.
3. Generate article and section-level `xs` citations from the reviewed audit; verify hyperlinks.
4. Run `python3 tests/study_tools.py`, `python3 tests/links.py`, and `python3 tests/smoke.py`.
5. Keep published article untouched until reviewed expansion is ready for a separate PR.
