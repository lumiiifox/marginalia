# Backlog

Order of work under the teaching mission (CLAUDE.md, "What Marginalia is for", 2026-11-22). Each item names the existing
feature it builds on (see `docs/CODEMAP.md`). An item moves up when the owner wants it while studying; one that nobody has
wanted while reading waits.

## The learning loop already in the app

Reading paths with questions to read with, close readings (Spinoza → Deleuze), primers, the chapter-end summary prompt, the
reconstruction guide and truth tables, disputations, From your margins, Anki export, A draft for critique, and Mastery. The
items below connect these into one loop: read → recall → reconstruct → feedback → re-test.

## Next, in order

1. **Recall before rereading.** *(Done 2026-11-22.)* The chapter-end summary prompt (`summarySheet`) asks for the chapter's main idea written from
   memory, with the text hidden while you write, then one argument from the chapter as premises and conclusion (the
   reconstruction steps, `RECON_STEPS`, folded underneath). Interface only.
2. **Copy for Claude.** *(Done 2026-11-23: asks for one inference, the passage on it, and one sentence to revise or defend; the grading standard is not built yet.)* One button on a chapter's summary, and on a reading-path step, that copies a single block: the
   passage references, your summary, your reconstruction, your open questions, and the standard to grade against (chosen once,
   e.g. "second-year undergraduate"). Built on the For critique export (`exportCritique`). Free: nothing calls an API.
3. **Keep the verdict.** Paste Claude's grade back; it is saved with the chapter and shown in Where you left off. Touches
   stored data: pull request.
4. **Error log.** Each verdict can tag the kind of mistake (misread term, missing premise, wrong attribution, summary too
   vague). A Study card lists your most frequent kinds. Pull request, together with or after item 3.
5. **Spaced re-testing.** Chapters you summarized come back for recall at growing intervals (for example 3, 10 and 30 days),
   alongside From your margins. Recall is checked against your own saved summary and the verdict.
6. **Steps open in order.** A reading-path step shows as ready once the step before it has a summary and a verdict. Soft gate:
   a later step can still be opened, with a note saying what comes first. Prerequisites between paths (logic before argument
   puzzles; Aristotle and Spinoza before Deleuze) follow the same rule.
7. **Foundation primers by branch** (logic, metaphysics, ethics, epistemology, aesthetics, politics): short, sourced, each
   with a section checklist, written when a reading path needs them.

## Waiting

Items from the earlier backlog stay here until a reading calls for them: two-edition page concordance (English/Minuit),
original text beside translation, import PDF highlights, reading pace per book, density gauge, hear names pronounced, term
histories on the timeline.
