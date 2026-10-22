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


## Verified conceptual source notes (2026-10-22)

These notes record specific claims supported by accessible SEP entries, not an independent second review. Use them as leads for sentence-level audit records; recheck section locators and the full entry's named authors at publication.

### Realism: three distinct commitments

Source: [SEP, Scientific Realism](https://plato.stanford.edu/entries/scientific-realism/), §§1.1–1.3, 2.1.

- **Metaphysical:** a world exists independently of inquiry; this is different from a commitment to any particular taxonomy of kinds.
- **Semantic:** theoretical claims about unobservables can be read literally as true or false; not all antirealists deny this.
- **Epistemic:** well-supported scientific theories can yield knowledge of unobservable aspects of the world. The epistemic dimension is especially disputed.
- Realism about the *aim* of science (truth) does not by itself imply that contemporary theories have achieved that aim.
- Selective realism can concern explanatory components, manipulable entities or preserved structures, rather than endorsing every element of a successful theory.
- The no-miracles argument treats approximate truth as an explanation of predictive and explanatory success. Antirealist responses include van Fraassen's selection analogy; the strength of the inference is contested.

Drafting implication: distinguish constructive empiricism, instrumentalism, entity realism and structural realism rather than treating realism and antirealism as two uniform camps.

### Kuhn: normal science, exemplars and revolution

Source: [SEP, Thomas Kuhn](https://plato.stanford.edu/entries/thomas-kuhn/), §§2–3.

- Kuhn's **normal science** consists largely of puzzle-solving within a shared disciplinary matrix of theories, instruments, values and assumptions.
- **Paradigm** can mean the wider disciplinary matrix or, more narrowly, exemplary solved problems that guide scientific training and further work.
- Accumulated anomalies need not immediately overthrow a theory. A crisis can develop when anomalies seriously disrupt normal research.
- Revolutionary changes can produce an overall gain in puzzle-solving power while losing some prior explanations (the phenomenon called *Kuhn-loss*).
- Kuhn's criticism of fixed algorithms for theory choice should not automatically be presented as a claim that scientific judgment is irrational.
- His account of progress through puzzle-solving differs from realist narratives of straightforward convergence to truth.

Drafting implication: compare Kuhn's actual account with Popper's criticism-driven account, and separately identify subsequent relativist interpretations.

### Objectivity: distinguish ideals and mechanisms

Source: [SEP, Scientific Objectivity](https://plato.stanford.edu/entries/scientific-objectivity/), introduction.

- Objectivity is attributed to scientific claims, methods, results, institutions and investigators, not only to the psychology of an individual scientist.
- Debates about objectivity intersect with confirmation, theory choice, explanation, reproducibility, measurement, and the role of social and ethical values.
- The idea of scientific objectivity as freedom from personal perspective is one ideal among several; the article must explain what a social account of objectivity is supposed to achieve before assessing objections.

Drafting implication: distinguish value-freedom, reproducibility, methodological transparency, and opportunities for transformative criticism; consult more specialized literature before attributing detailed theses to Longino, Harding or Haraway.

## Evidence status

The three SEP pages above were retrieved and inspected for these propositions. Historical sections, non-European traditions, Bayesian confirmation, causal explanation, models, and specialist feminist positions **still need dedicated sources**. Do not mark those topics verified on the strength of this note.
