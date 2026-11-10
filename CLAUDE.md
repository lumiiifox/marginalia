# Working on Marginalia

Personal, single-user reading app (Lumiii's). Hosted on GitHub Pages from `main`: whatever lands on `main` is live on the owner's
phone within about a minute. The map of the code (every feature, its functions and its stored fields) is `docs/CODEMAP.md`; read
the part you're changing before you change it, and update it in the same commit.

## Who decides

Claude is the lead on Marginalia (owner's decision, 2026-10-26): it decides what goes in, what waits and what comes out, and says
why. The owner sets direction and can overrule. The app is vibe coded on purpose: it is a place to see what the idea can become,
separate from the owner learning to program, so explain changes in terms of what they do for reading, never as coding lessons.

Roles (owner's decision, 2026-11-01):
- **Claude** owns the codebase: implementation, testing, integration and final technical review. Only Claude changes code.
- **ChatGPT** is a philosophical collaborator, kept off the codebase: it drafts entries, examines interpretations of Nietzsche,
  Deleuze, Guattari and Land, finds conceptual inconsistencies and challenges questionable readings. Its drafts and objections reach
  the app through Claude, which checks them against sources like any other draft; a reading ChatGPT disputes is settled by the
  sources, and an open dispute is recorded in the audit, not papered over.
- **The owner** sets direction and can overrule; reviewed content ships without waiting for approval (below).

Intellectual quality comes first. Automation takes the repetitive work (drafting from sources, checking quotations, running tests);
interpretation stays under review.

## What Marginalia is for

A personal philosophical reading and research environment built around close reading, rigorous reference material and
traceable conceptual relationships. It grows with the texts and questions its owner chooses to pursue (now: Aristotle →
Spinoza → Deleuze → Land); it does not try to cover all of philosophy.

- **Depth before breadth.** An entry is worth having because its claims are accurate, attributed and sourced. Add thinkers,
  terms or texts when a reading needs them, never to fill out coverage.
- **Connections need evidence.** A link between thinkers or concepts says what kind it is (influence, critique,
  reinterpretation) and rests on a source or a passage. Shared vocabulary or chronology alone is not a connection.
- **The library sets the horizon.** Features work on whatever the owner imports, with the bundled classics as a foundation;
  new traditions should need new content, not new subsystems.
- **Contested readings are credited.** Interpretation of any thinker, Deleuze and Guattari included, rests on named
  academic scholarship (SEP, IEP, published scholars), never on forum posts or unsourced takes. Quotations are never invented:
  every one is checked against its text.
- **Rewards are part of how the owner learns.** Collecting, unlocking, instant feedback and visible mastery are core
  requirements (owner's decision, 2026-10-26), held to the same rigor as the content: a reward is earned by reading, writing
  notes or answering from verified material, and a puzzle draws only on checked data (or says plainly when it doesn't).

The test for any addition: does it deepen the owner's ability to read, investigate, compare or substantiate philosophical
ideas, or reward doing so? If not, it waits.

## How changes ship

- **Pull request** (branch + PR, owner merges) for anything touching stored data: the IndexedDB schema or `idbOpen` upgrade
  code, the `STORES` list, the shape of records in any store, backup (`version` in the export), restore (`VALID`, `planRestore`,
  merging), cloud backup, or `sw.js` caching. A mistake there can stop the app from opening the owner's library. The PR's
  description says in plain words what changes for the owner and what could go wrong.
- **Direct push to `main`** for everything else: interface, styling, reader behaviour, reference content, exports, tests.
- One logical change per commit, with a plain message saying what changed for the reader.
- A pull request carries a finished change: a working feature, a fix, or an audited piece of content. No PRs for plans, research
  briefs, outlines or unaudited drafts.
- **Test before pushing:** `python3 tests/run.py` runs everything, four at a time (about five minutes); `python3 tests/run.py
  reader` (or `storage`, `import`, `reference`, `look`) runs one group, and `python3 tests/run.py smoke trash` named tests. Run
  at least the groups you touched plus `smoke`; run everything before a PR. Add a check when a change adds a screen, a stored
  field or a reward. CI runs `tests/run.py` on every push and PR.
- Content audits: `tests/audit/` (see its README). Every audit gets an independent second review before its fixes ship.
  Audit along the reading route only, in the order of `tests/audit/ROUTE_QUEUE.md`; the rest stays visibly unchecked until a reading
  needs it (owner's decision, 2026-11-01).
- **Content ships once its independent review passes** (owner's decision, 2026-11-03: "don't wait for me, just get it done";
  supersedes the 2026-11-01 approval step): a drafted batch goes to `main` when the separate reviewer has passed it and the content
  tests pass, with a summary for the owner afterwards. Open disputes and doubtful claims are recorded in the audit, never shipped as
  settled.
- **One drafts branch.** Work in progress that must leave this session goes on `drafts`, never on a new branch per batch, so there
  is nothing to clean up. This session can't delete remote branches.
- Tests for a change: content only (`data/`, `tests/audit/`) → `python3 tests/run.py content`; anything in `js/`, `css/`, `index.html`
  or storage → the full `python3 tests/run.py`.
- This session can't delete remote branches; the repo deletes merged PR branches automatically (if not, tell the owner).

## Writing for the app

- Plain, exact English. No contrastive negation ("it's not X, it's Y", "not X but Y", "more than X", "goes beyond X"): the owner
  finds it irritating, and it usually hides a claim that should be stated directly.
- Copyrighted sources: quotations under 15 words, recorded with their source. The repository is public.

## Save points

- A known-good version is kept as a branch `saved/working-YYYY-MM-DD`, pointing at a commit on `main` whose tests all passed.
  Nothing is ever pushed to these branches, and they are never merged. Make a new one when the owner asks, from a `main` commit
  whose CI run passed.
- To go back to one: bring its files back as one new commit on `main`, so the history in between stays (`git rm -rq . &&
  git checkout saved/working-YYYY-MM-DD -- .`), run `tests/run.py`, then push. Never force-push or reset `main`.
- Before restoring, check whether `indexedDB.open("marginalia", N)` has gone up since the save point. If it has, keep the newer N
  and its upgrade code (and the stores it added): the owner's phone has already upgraded its database, and older code asking for a
  lower version can't open it at all.

## Rules

- **Never commit books, PDFs or backup files.** The repository is public. The one exception is `data/books/`: the classics that
  come with the app, built by `tools/build_classics.py` from Standard Ebooks editions (or, for a work they lack, a Project
  Gutenberg EPUB or a public-domain transcription of a public-domain translation; the EPUBs sit in the git-ignored
  tests/.cache/gutenberg) and public domain in both the US and Canada (author and any translator died in 1971 or earlier).
  Nothing from the owner's library ever goes there.
- Nothing personal about the owner goes in the repository beyond what this file says.
- Changing the stored shape of a record: bump `indexedDB.open("marginalia", N)` only when a store is added or needs migration,
  keep old records readable, and update `VALID` so old backups still restore.
- Keep the app a single static site with no build step. Libraries load from cdnjs; fonts from Google Fonts (the service worker
  caches only those hosts). Every library file carries its SHA-384 in `LIB_SRI` (js/core.js), so a changed copy on the CDN never runs;
  a new library or version needs its hash there (`tests/integrity.py` checks).
- **Deployment constraint: the shared origin** (owner's decision, 2026-11-08). The app is served from lumiiifox.github.io, an origin every
  GitHub Pages project of that account shares, and the automatic backup's GitHub token sits in that origin's `localStorage`. Any page
  published under lumiiifox.github.io can read it. Until the app moves to an origin of its own (a custom domain, or an account that
  hosts nothing else), which is the eventual fix, don't publish other Pages projects on that account, keep the token fine-grained and
  scoped to the one private backup repository, and keep the setup screen's warning.
- The page's content security policy (the meta tag at the top of `index.html`) names every host the app may load from or talk to.
  A new library host, picture source or service needs its line there, or the browser refuses it; `tests/csp.py` runs the app under
  the policy (every other test turns it off). Never add `'unsafe-eval'` or inline scripts.
- If `sw.js` changes in a way that needs old caches dropped, bump `CACHE`.
- Every file `index.html` loads must be in `SHELL` in `sw.js` (smoke.py checks), or the app can't open offline. A new file under
  `js/`, `css/` or `data/` needs both its tag in `index.html` and its line in `SHELL`, and a `CACHE` bump.
