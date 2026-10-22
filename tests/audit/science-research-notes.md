# Philosophy of Science: research dossier (working draft)

Status: preliminary research, not an audited article and not ready for release.
Target: `data/branches.js` entry `id: "science"`, following `frame-2026-10`.
This dossier is an editorial working document. It is not a substitute for the required sentence-level audit, independent review, or tests.

## Current entry: retain and develop

The existing article already introduces demarcation, induction, confirmation, explanation, Kuhn's revolutions, Lakatos's research programmes, Feyerabend's critique, scientific realism, models, underdetermination, values, Haraway, and feminist criticism. Preserve those themes, but add historical depth, distinctions between positions, objections, and explicit attribution.

## Proposed section architecture

1. Scope and central questions
2. Ancient and medieval investigations of nature
3. Early modern experimental and mathematical sciences
4. Nineteenth-century science and philosophies of method
5. Logical empiricism and twentieth-century transformations
6. Demarcation, testing and methodological pluralism
7. Induction, Bayesian confirmation and evidence
8. Explanation, causation and laws
9. Models, idealization and representation
10. Scientific realism, empiricism and underdetermination
11. Paradigms, research programmes and scientific change
12. Objectivity, values and the social organization of inquiry
13. Beyond the European canon
14. Criticisms and debates
15. Connections and influence
16. Open questions

Frame check before drafting: 4 history sections, 7 central-problem sections, 5,000–8,000 words total. Section 13 must avoid treating non-European knowledge as an afterthought or equating all historical knowledge systems with modern institutional science. Verify each specific historical example with specialist scholarship.

## Source leads consulted (primary editorial orientation)

- Stanford Encyclopedia of Philosophy, "Scientific Objectivity": https://plato.stanford.edu/entries/scientific-objectivity/
  Use for distinctions among objectivity as faithfulness to facts, freedom from individual bias, and social criticism. The entry explicitly connects objectivity with induction, theory choice, realism, experimentation and feminist critiques.
- Stanford Encyclopedia of Philosophy, "Scientific Realism": https://plato.stanford.edu/entries/scientific-realism/
  Use for the epistemic, semantic and metaphysical dimensions of realism, and arguments about unobservable entities and scientific success.
- Stanford Encyclopedia of Philosophy, "Feminist Perspectives on Science" (revised 2025): https://plato.stanford.edu/entries/feminist-science/
  Use to differentiate feminist empiricism, standpoint approaches and social accounts of objectivity; avoid representing feminist science as a single doctrine.
- Stanford Encyclopedia of Philosophy, "Feminist Epistemology and Philosophy of Science": https://plato.stanford.edu/entries/feminism-epistemology/
  Use for situated knowledge, criticism of value neutrality and the difference between exposing bias and rejecting standards of evidence.

These are starting sources, not complete evidence for the whole article. Record current named entry authors when adding the final `xs` and audit sources table. Retrieve further specialist entries and historical scholarship before writing historical or cross-cultural sections.

## Early editorial cautions

- Do not conflate Popper's falsifiability criterion with the claim that one failed prediction mechanically refutes a whole theory. Account for auxiliary assumptions and subsequent debate.
- Distinguish Kuhn's descriptive historical claims from stronger relativist readings; attribute contested interpretations.
- Do not treat all antirealists as instrumentalists. Constructive empiricism and other positions require separate treatment.
- Avoid suggesting that Haraway, Harding and Longino offer interchangeable accounts of situated knowledge and objectivity.
- Differentiate epistemic values (e.g. empirical adequacy) from ethical and political values, while explaining where their roles are contested.
- Explain that underdetermination can be local or global, and that its philosophical significance is disputed.
- Check quotations against original sources and keep all recorded quotations below the repository's limit.
- Keep sources below their relevant sections in the UI, and build a sentence-by-sentence `tests/audit/science.json` before proposing changes to `data/branches.js`.

## Required shipping gate

1. Finish source collection and verify source authors and locators.
2. Draft each paragraph as sentence records with assessed claims and quotes.
3. Obtain independent second review, fix issues and document the verdict.
4. Generate the article and section sources from the audit record.
5. Run `python3 tests/study_tools.py`, `python3 tests/links.py`, and `python3 tests/smoke.py`.
6. Open a PR for owner review. Do not merge automatically.
