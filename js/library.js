// Marginalia: the home screen and a book's page: bookplates, from your margins, notes through the book, reading pace, where you left off, tags and open questions. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- derived ---------- */
const notesFor = (tid) => [...S.notes.entries()].filter(([, n]) => n.textId === tid);
function sortNotes(list, t) {
  const order = new Map((t?.sections || []).map((s, i) => [s.id, i]));
  return list.sort(([, a], [, b]) => {
    if (!t) return (b.createdAt || 0) - (a.createdAt || 0);
    const sa = order.has(a.sectionId) ? order.get(a.sectionId) : 1e9, sb = order.has(b.sectionId) ? order.get(b.sectionId) : 1e9;
    return sa - sb || pnum(a.page) - pnum(b.page) || (a.at ?? 1e9) - (b.at ?? 1e9) || (a.createdAt || 0) - (b.createdAt || 0);
  });
}
const matches = (n, q) => !q || fold([n.passage, n.gloss, n.page, n.original, ...(n.premises || []), n.conclusion, ...fuTexts(n), ...wasTexts(n)].join(" ")).includes(fold(q));

/* ---------- render: library and text ---------- */
function render() {
  if ((S.screen === "text" || S.screen === "reader") && !S.texts.has(S.textId)) { S.screen = "library"; resetReader(); }
  buildBacklinks();
  if (S.screen === "draft" && !S.drafts.has(S.draftId)) S.screen = "drafts";
  if (S.screen === "compare" && !S.compares.has(S.cmpId)) S.screen = "compares";
  document.body.classList.toggle("path-mode", S.screen === "paths");
  const reading = S.screen === "reader";
  $("#main").hidden = reading;
  $("#reader").hidden = !reading;
  syncThemeColor(); drawPin();
  if (reading) { refreshMarks(); return; }
  wakeOff();
  $("#selbar").hidden = true;
  const views = { text: textView, glossary: glossaryView, branches: branchesView, thinkers: thinkersView, reference: referenceView, tag: tagView, questions: questionsView, drafts: draftsView, draft: draftView, trash: trashView, paths: pathsView, plates: platesView, disputes: disputesView, concord: concordView, compares: comparesView, compare: compareView };
  $("#main").innerHTML = (views[S.screen] || libraryView)();
}

function banner() {
  if (S.mode === "pending" && S.blocked) return `<div class="banner">Marginalia is updating its storage. Close it in any other tabs or windows and this will finish on its own.</div>`;
  if (S.mode === "pending") return `<div class="banner">Opening your reading log…</div>`;
  if (S.mode === "local") return `<div class="banner">This browser isn't letting the app save (private browsing does this). Anything you add disappears when you close the page.</div>`;
  return "";
}

const OPENABLE = new Set(["question", "objection"]);
const noteSnippet = (n, len = 90) => { const x = String(n.passage || n.gloss || n.conclusion || (n.premises || [])[0] || "").replace(/\s+/g, " ").trim(); return x.length > len ? x.slice(0, len - 1) + "…" : x; };
// Where a note sits, for lists and links: "p. 159" within its own text, "Ethics, p. 159" elsewhere.
function noteWhere(n, sameText) {
  const t = S.texts.get(n.textId), l = loc(n.page);
  if (sameText) return l || KINDS[n.kind] || "Note";
  return [t ? shortTitleOf(t.title) : "Unknown text", l].filter(Boolean).join(", ");
}
// Links between notes run both ways; built once per render.
let BACKLINKS = new Map();
function buildBacklinks() {
  const m = new Map();
  for (const [id, n] of S.notes) for (const to of n.links || []) { if (!m.has(to)) m.set(to, new Set()); m.get(to).add(id); }
  BACKLINKS = m;
}
const linkedNotes = (id, n) => [...new Set([...(n.links || []), ...(BACKLINKS.get(id) || [])])].filter((x) => x !== id && S.notes.has(x));
function noteHTML(id, n, t, showSrc) {
  const sec = t?.sections?.find((s) => s.id === n.sectionId);
  const arg = n.kind === "argument" && n.premises && n.premises.length;
  const links = linkedNotes(id, n);
  return `<article class="note k-${esc(n.kind)}${n.resolved ? " resolved" : ""}" data-nid="${esc(id)}">
    <div class="meta">
      ${n.page ? `<span class="pg">${esc(loc(n.page))}</span>` : ""}
      ${n.page && t && t.conc && concLabel(t, n.page) ? `<span class="pg2">${esc(concLabel(t, n.page))}</span>` : ""}
      ${sec ? `<span>${esc(sec.label)}</span>` : ""}
      <span class="chip k-${esc(n.kind)}">${esc(KINDS[n.kind] || "Note")}</span>
      ${OPENABLE.has(n.kind) && n.resolved ? `<span class="chip done">Resolved</span>` : ""}
      ${n.example ? `<span class="chip ex">Example</span>` : ""}
    </div>
    ${showSrc && t ? `<button class="src" data-open="${esc(n.textId)}">${esc(t.title)}</button>` : ""}
    ${n.passage ? `<p class="passage"><span>${esc(n.passage)}</span></p>` : ""}
    ${n.original ? `<p class="orig"><span class="olabel">Original</span> ${esc(n.original)}</p>` : ""}
    ${arg ? `<div class="argbox"><ol class="arg">${n.premises.map((p) => `<li>${withTags(esc(p))}</li>`).join("")}</ol><p class="argc"><span aria-hidden="true">∴</span><span class="sr">Therefore:</span> ${withTags(esc(n.conclusion))}</p></div>` : ""}
    ${n.gloss ? `<p class="gloss ${n.passage || arg ? "after" : ""}">${withTags(esc(n.gloss))}</p>` : ""}
    ${laterHTML(n)}
    ${links.length ? `<div class="links"><span class="clabel">Linked notes</span>${links.map((x) => { const m = S.notes.get(x); return `<button class="lrow" data-jump="${esc(x)}"><b>${esc(noteWhere(m, m.textId === n.textId))}</b><span>${esc(noteSnippet(m, 80))}</span></button>`; }).join("")}</div>` : ""}
    <div class="noteacts">
      ${t?.hasContent && Number.isInteger(n.at) ? `<button class="btn ghost" data-goto-note="${n.at}" data-tid="${esc(n.textId)}">Show in text</button>` : ""}
      <button class="btn ghost" data-cite="${esc(id)}">Cite</button>
      <button class="btn ghost" data-todraft="${esc(id)}">Add to draft</button>
      ${OPENABLE.has(n.kind) ? `<button class="btn ghost" data-resolve="${esc(id)}">${n.resolved ? "Reopen" : "Mark resolved"}</button>` : ""}
      <button class="btn ghost" data-followup="${esc(id)}">Follow up</button>
      <button class="btn ghost" data-editnote="${esc(id)}">Edit</button>
    </div>
  </article>`;
}
// Follow-ups, dated, under the note; earlier wordings of your note folded below them.
const wasHTML = (w) => `<p class="fu"><span class="fud">Written ${esc(fmtDate(w.at))}</span>${w.premises && w.premises.length ? esc(w.premises.map((x, k) => `${k + 1}. ${x}`).join("\n") + (w.conclusion ? `\n∴ ${w.conclusion}` : "")) + (w.gloss ? "\n" : "") : ""}${esc(w.gloss || "")}</p>`;
function laterHTML(n) {
  const fu = n.followups || [], was = n.was || [];
  if (!fu.length && !was.length) return "";
  return `<div class="later">${fu.map((f) => `<p class="fu"><span class="fud">Follow-up, ${esc(fmtDate(f.at))}</span>${withTags(esc(f.x))}</p>`).join("")}
    ${was.length ? `<details class="earlier"><summary>Earlier wording${was.length > 1 ? `s (${was.length})` : ""}</summary>${was.slice().reverse().map(wasHTML).join("")}</details>` : ""}</div>`;
}

// Books per shelf row: 3 on a phone, 4 once the screen is wide enough to keep covers readable.
const wideShelf = window.matchMedia ? matchMedia("(min-width: 520px)") : null;
const shelfPer = () => (wideShelf && wideShelf.matches ? 4 : 3);
if (wideShelf) wideShelf.addEventListener("change", () => { if (S.screen === "library") render(); });
// A shelf's books in order: books you've put in place (rank) keep their places, after any that have come onto the shelf since,
// newest first. A shelf you've never arranged is simply in order of recent use.
function shelfList(st) {
  const books = [...S.texts.entries()].filter(([, t]) => (t.status || "reading") === st);
  const placed = books.filter(([, t]) => Number.isFinite(t.rank)).sort(([, a], [, b]) => a.rank - b.rank);
  const fresh = books.filter(([, t]) => !Number.isFinite(t.rank)).sort(([, a], [, b]) => lastActive(b) - lastActive(a));
  return [...fresh, ...placed];
}
// The leaf of the app's icon (tools/build_icons.py draws the icon from the same path).
const LEAF_SVG = `<svg viewBox="10 17 76 76" aria-hidden="true"><path d="M27.0 75.0 C23 51 42 29 76.0 23.0 C74 53 56 73 27.0 75.0 Z M27.0 75.0 Q50.5 51.5 71.8 27.6 M38.8 62.5 Q43.4 63.4 49.2 62.9 M38.8 62.5 Q37.7 58.4 37.9 52.9 M47.6 53.2 Q52.5 54.0 58.6 53.5 M47.6 53.2 Q46.5 48.8 46.6 43.1 M56.4 43.8 Q60.5 44.6 65.9 44.1 M56.4 43.8 Q55.4 40.1 55.6 35.1 M64.2 35.5 Q66.9 36.2 70.7 35.7 M64.2 35.5 Q63.3 33.2 63.7 29.5 M27.0 75.0 C24.5 78.5 21.5 81.5 16.5 83.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function libraryView() {
  const texts = [...S.texts.entries()];
  let body = "";
  if (S.q.trim()) {
    const hits = sortNotes([...S.notes.entries()].filter(([, n]) => matches(n, S.q)), null);
    const ql = S.q.trim().toLowerCase();
    const th = allTerms().filter((g) => g.t.toLowerCase().includes(ql)).slice(0, 6);
    const fq = fold(S.q.trim()), who = fq.length > 2 ? THINKERS.filter((p) => thinkerMatches(p, fq)).slice(0, 6) : [];
    const anyLoaded = [...S.texts.values()].some((t) => t.hasContent);
    const fb = fold(S.q.trim()), bk = texts.filter(([, t]) => fold(`${t.title} ${t.author || ""}`).includes(fb)).slice(0, 8);
    const booksHit = bk.length ? `<section class="group"><div class="label">Your books<span class="cnt">${bk.length}</span></div><div class="termhits">${bk.map(([id, t]) => `<button class="termhit" data-open="${esc(id)}"><b>${esc(t.title)}</b><span>${[t.author, `${STATUS[t.status || "reading"] || ""} shelf`].filter(Boolean).map(esc).join(" · ")}</span></button>`).join("")}</div></section>` : "";
    body = `${booksHit}${anyLoaded && S.q.trim().length > 1 ? `<button class="btn searchbooks" id="searchbooks">Search inside your books for “${esc(S.q.trim())}”</button>` : ""}${th.length || who.length ? `<section class="group"><div class="label">In the glossary</div>${who.length ? `<div class="chips">${thinkerChips(who.map((p) => p.id))}</div>` : ""}${th.length ? `<div class="termhits">${th.map((g) => `<button class="termhit" data-term="${esc(g.id)}"><b>${esc(g.t)}</b><span>${esc(g.d.length > 150 ? g.d.slice(0, 150) + "…" : g.d)}</span></button>`).join("")}</div>` : ""}</section>` : ""}
      <section class="group"><div class="label">${hits.length ? `${hits.length} note${hits.length === 1 ? "" : "s"} matching “${esc(S.q)}”` : `Notes matching “${esc(S.q)}”`}</div>
      <div class="noteslist">${hits.map(([id, n]) => noteHTML(id, n, S.texts.get(n.textId), true)).join("") || `<p class="empty">No notes match. Search looks through passages, your notes and page numbers.</p>`}</div></section>`;
  } else if (!texts.length && S.mode !== "pending") {
    body = `<p class="empty"><b>No texts yet.</b> Add a book from a PDF, EPUB, Word or text file, then read it here and save passages as you go.</p>`;
  } else {
    const per = shelfPer();
    body = Object.keys(STATUS).map((st) => {
      const books = shelfList(st);
      if (!books.length) return "";
      // Long shelves show their two most recent rows until you ask for the rest.
      const cap = per * 2, open = S.shelfOpen.has(st) || books.length <= cap + 1, shown = open ? books : books.slice(0, cap);
      const rows = []; for (let k = 0; k < shown.length; k += per) rows.push(shown.slice(k, k + per));
      return `<section class="shelf" data-st="${st}"><div class="label">${STATUS[st]}<span class="cnt">${books.length}</span></div>
        ${rows.map((row) => `<div class="shelfrow" style="--per:${per}"><div class="plank"></div>${row.map(([id, t]) => {
          const nc = notesFor(id).length, p0 = progressOf(t), pc = p0 > 0 ? p0 : null;
          const meta = [pc != null ? `${pc}%` : "", nc ? `${nc} note${nc === 1 ? "" : "s"}` : ""].filter(Boolean).join(", ");
          return `<div class="sbwrap"><button class="shelfbook" data-open="${esc(id)}" aria-label="${esc(t.title)}">
            ${coverHTML(t, coverURL(id))}
            <span class="sb-title">${esc(t.title)}</span>
            ${meta ? `<span class="sb-meta">${meta}</span>` : ""}
            ${pc != null ? `<span class="sb-prog"><i style="width:${pc}%"></i></span>` : ""}
          </button><button class="sbmenu" data-bookmenu="${esc(id)}" aria-label="More for ${esc(t.title)}">⋯</button></div>`; }).join("")}</div>`).join("")}
        ${books.length > cap + 1 ? `<button class="btn shelfmore" data-shelf="${st}" aria-expanded="${open}">${open ? "Show fewer" : `Show all ${books.length}`}</button>` : ""}
      </section>`;
    }).join("");
  }
  const searching = !!S.q.trim();
  return `<header class="top"><h1 class="mark-leaf">${LEAF_SVG}<span class="sr">Marginalia</span></h1></header>
    ${banner()}
    <input class="search" id="q" type="search" placeholder="Search books, notes, glossary" value="${esc(S.q)}" aria-label="Search your books, notes and the glossary">
    ${searching ? body : `
    <section class="home-sec">
      <div class="sec-head"><div><h2>Bookshelf</h2><div class="sub">${S.texts.size} text${S.texts.size === 1 ? "" : "s"}, ${S.notes.size} note${S.notes.size === 1 ? "" : "s"}</div></div><button class="btn primary" id="addtext">Add text</button></div>
      ${body}
      ${S.mode === "pending" ? "" : acrossHTML()}
    </section>
    ${S.mode === "pending" ? "" : resurfHTML() + referenceHome() + backupView()}`}`;
}
/* ---------- bookplates: marks of reading, worked out from the library each time; nothing is stored and none expire ----------
   Firsts (your first gloss, question, objection, argument, return to a note, summary, draft, comparison), per book (every chapter
   read, every chapter summed up, finished) and each reading path walked. Back matter doesn't count as a chapter (BACK_MATTER). */
const BACK_MATTER = /^(notes|endnotes|footnotes|index|bibliography|contents|glossary|editor[’']s note)$/i;
const FIRSTS = [
  ["gloss", "First gloss", "Write a note in your own words.", (n) => n.gloss && n.gloss.trim()],
  ["question", "First question", "Save a note as a Question.", (n) => n.kind === "question"],
  ["objection", "First objection", "Save a note as an Objection.", (n) => n.kind === "objection"],
  ["argument", "First argument set out", "Save an Argument note with its premises and conclusion.", (n) => (n.premises || []).length > 0],
];
function bookPlates(tid, t = S.texts.get(tid)) {
  if (!t || t.example) return [];
  const secs = (t.sections || []).filter((x) => !BACK_MATTER.test(String(x.label || "").trim())), sums = t.summaries || {}, out = [];
  if (secs.length >= 2 && secs.every((x) => x.done)) out.push({ id: `read:${tid}`, n: "Read through", sub: t.title, tid, how: "every chapter ticked as read" });
  if (secs.length >= 2 && secs.every((x) => (sums[x.id] || "").trim())) out.push({ id: `sum:${tid}`, n: "Every chapter summed up", sub: t.title, tid, how: "a summary for each chapter" });
  if (t.status === "finished") out.push({ id: `fin:${tid}`, n: "Finished", sub: t.title, tid, how: "on the Finished shelf" });
  return out;
}
function bookplates() {
  const notes = [...S.notes.values()].filter((n) => { const t = S.texts.get(n.textId); return t && !t.example; }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const earned = [], todo = [];
  const where = (n) => S.texts.get(n.textId)?.title || "";
  for (const [id, name, how, test] of FIRSTS) { const n = notes.find(test); if (n) earned.push({ id, n: name, sub: where(n), at: n.createdAt, tid: n.textId, first: true }); else todo.push([name, how]); }
  let fu = null; for (const n of notes) for (const f of n.followups || []) if (!fu || f.at < fu.f.at) fu = { n, f };
  if (fu) earned.push({ id: "followup", n: "First return to a note", sub: where(fu.n), at: fu.f.at, tid: fu.n.textId, first: true }); else todo.push(["First return to a note", "Add a follow-up to a note you made earlier."]);
  const summed = [...S.texts.entries()].find(([, t]) => !t.example && Object.values(t.summaries || {}).some((x) => String(x).trim()));
  if (summed) earned.push({ id: "summary", n: "First chapter summed up", sub: summed[1].title, tid: summed[0], first: true }); else todo.push(["First chapter summed up", "Write a summary when a chapter ends, or from its name on the book's page."]);
  const firstOf = (m) => [...m.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))[0];
  const d = firstOf(S.drafts); if (d) earned.push({ id: "draft", n: "First draft", sub: d.title || "", at: d.createdAt, first: true }); else todo.push(["First draft", "Start a draft from your notes, or from an essay template."]);
  const c = firstOf(S.compares); if (c) earned.push({ id: "compare", n: "First comparison", sub: c.title || "", at: c.createdAt, first: true }); else todo.push(["First comparison", "Set two views side by side in Comparisons."]);
  const books = [...S.texts.keys()].flatMap((tid) => bookPlates(tid));
  const paths = bookPaths().filter((P) => P.steps.length > 0 && P.steps.every((st) => stepState(st).done)).map((P) => ({ id: `path:${P.id}`, n: "A path walked", sub: P.n, path: P.id }));
  if (!books.length) todo.push(["A book read through", "Tick every chapter of a book as read, on its page."]);
  if (!paths.length) todo.push(["A path walked", "Finish every step of a reading path."]);
  return { firsts: earned, books, paths, todo, count: earned.length + books.length + paths.length };
}
function plateHTML(x) {
  const attr = x.tid ? ` data-open="${esc(x.tid)}"` : x.path ? ` data-path="${esc(x.path)}"` : "";
  return `<button class="plate"${attr}${attr ? "" : " disabled"}><span class="pl-leaf" aria-hidden="true">${LEAF_SVG}</span><span class="pl-ex">ex libris</span>
    <span class="pl-n">${esc(x.n)}</span>${x.sub ? `<span class="pl-sub">${esc(x.sub)}</span>` : ""}${x.at ? `<span class="pl-at">${esc(fmtDate(x.at))}</span>` : x.how ? `<span class="pl-at">${esc(x.how)}</span>` : ""}</button>`;
}
function platesView() {
  const P = bookplates(), grid = (list) => `<div class="plates">${list.map(plateHTML).join("")}</div>`;
  const sec = (title, list) => (list.length ? `<section class="group"><div class="label">${title}<span class="cnt">${list.length}</span></div>${grid(list)}</section>` : "");
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>
    <header class="gl-head"><div><h1>Bookplates</h1><div class="sub">${P.count ? `${P.count} earned` : "None yet"}</div></div></header>
    <p class="hint">Marks of reading and argument, worked out from your library each time you look. Nothing is counted for you to keep up, and none expire.</p>
    ${sec("Firsts", P.firsts)}${sec("Books", P.books)}${sec("Reading paths", P.paths)}
    ${P.count ? "" : `<p class="empty"><b>No bookplates yet.</b> They come from your notes, summaries and the chapters you tick as read.</p>`}
    ${P.todo.length ? `<details class="tmorehits plates-todo"><summary>Still to come (${P.todo.length})</summary><ul class="bq-list">${P.todo.map(([n, how]) => `<li><b>${esc(n)}</b>: ${esc(how)}</li>`).join("")}</ul></details>` : ""}`;
}
/* ---------- from your margins: one of your older notes a day, on the home screen ----------
   A note made at least RESURF_DAYS ago, chosen by the date so it stays the same all day; Another shows the next one for now.
   Nothing is stored. */
const RESURF_DAYS = 14;
let resurfSkip = 0;
function resurfPool() {
  const cut = Date.now() - RESURF_DAYS * DAY;
  return [...S.notes.entries()].filter(([, n]) => { const t = S.texts.get(n.textId); return t && !t.example && n.createdAt && n.createdAt <= cut && (n.passage || n.gloss || (n.premises || []).length); })
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}
function resurfaced(day = dayNumber()) {
  const pool = resurfPool(); if (!pool.length) return null;
  return pool[((day * 2654435761) % pool.length + resurfSkip) % pool.length]; // a large odd step, so neighbouring days land far apart
}
function agoLabel(ms) {
  const d = Math.floor((Date.now() - ms) / DAY);
  if (d < 14) return `${d} days ago`;
  if (d < 60) return `${Math.round(d / 7)} weeks ago`;
  if (d < 365) { const m = Math.round(d / 30.4); return m <= 1 ? "a month ago" : `${m} months ago`; }
  const y = Math.floor(d / 365); return y === 1 ? "a year ago" : `${y} years ago`;
}
function resurfHTML() {
  const hit = resurfaced(); if (!hit) return "";
  const [id, n] = hit, t = S.texts.get(n.textId), cut = (x, k) => (x.length > k ? x.slice(0, k - 1).replace(/\s+\S*$/, "") + "…" : x);
  const arg = (n.premises || []).length && !n.passage;
  return `<section class="group" id="resurf"><div class="label">From your margins <span class="rs-ago">${esc(agoLabel(n.createdAt))}</span></div><div class="paperpanel rsurf">
    ${n.passage ? `<p class="passage"><span>${esc(cut(n.passage, 320))}</span></p>` : ""}
    ${arg ? `<ol class="arg">${n.premises.map((x) => `<li>${esc(x)}</li>`).join("")}</ol><p class="argc">∴ ${esc(n.conclusion || "")}</p>` : ""}
    ${n.gloss ? `<p class="gloss${n.passage || arg ? " after" : ""}">${esc(cut(n.gloss, 400))}</p>` : ""}
    <p class="rs-src"><button class="src" data-open="${esc(n.textId)}">${esc(t.title)}</button>${n.page ? ` <span>${esc(loc(n.page))}</span>` : ""}${(n.followups || []).length ? ` <span>· ${n.followups.length} follow-up${n.followups.length === 1 ? "" : "s"}</span>` : ""}</p>
    <div class="noteacts">
      ${t.hasContent && Number.isInteger(n.at) ? `<button class="btn ghost" data-goto-note="${n.at}" data-tid="${esc(n.textId)}">Show in text</button>` : ""}
      <button class="btn ghost" data-followup="${esc(id)}">Follow up</button>
      ${resurfPool().length > 1 ? `<button class="btn ghost" id="resurfnext">Another</button>` : ""}
    </div>
  </div></section>`;
}
function backupView() {
  let last = 0; try { last = +localStorage.getItem("mg-backup") || 0; } catch {}
  const when = last ? new Date(last).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "never";
  return `<footer class="backup">
    <div class="label">Backups and exports</div>
    <p class="hint">Last backup ${esc(when)}. Everything is stored only on this device. A backup file keeps it safe and moves it to another device; Export gives you Markdown, a bibliography and BibTeX for writing elsewhere.</p>
    <div class="row">
      <button class="btn" id="backup">Save backup</button>
      <span class="btn filebtn">Restore<input id="restore" type="file" aria-label="Restore from a backup file"></span>
      <button class="btn" id="exportbtn">Export</button>
    </div>
    ${S.trash.size ? `<button class="btn ghost" id="opentrash" style="padding-left:0">Recently deleted (${S.trash.size})</button>` : ""}
  </footer>`;
}

function trashView() {
  const list = [...S.trash.entries()].sort(([, a], [, b]) => b.at - a.at);
  const what = (e) => e.kind === "text" ? `“${esc(e.title)}”${e.notes ? ` and its ${e.notes === 1 ? "note" : `${e.notes} notes`}` : ""}`
    : e.kind === "note" ? `A note${e.title ? ` in “${esc(e.title)}”` : ""}` : `${e.kind === "draft" ? "Draft" : e.kind === "path" ? "Reading path" : "Comparison"} “${esc(e.title)}”`;
  const left = (e) => { const d = Math.max(1, Math.ceil((e.at + TRASH_DAYS * DAY - Date.now()) / DAY)); return `${d} day${d === 1 ? "" : "s"} left`; };
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>${banner()}
    <header class="gl-head"><div><h1>Recently deleted</h1><div class="sub">${list.length} item${list.length === 1 ? "" : "s"}</div></div>${list.length > 1 ? `<button class="btn ghost danger" id="trash-empty">Empty</button>` : ""}</header>
    <p class="hint">Books, notes, drafts, comparisons and reading paths you delete stay here for ${TRASH_DAYS} days, then go for good. Backups don't include them.</p>
    ${list.length ? `<div class="gl-list">${list.map(([id, e]) => `<div class="thinkrow trashrow"><b>${what(e)}</b><span class="ty">${esc(fmtDate(e.at))}</span>
      ${e.snip ? `<span class="td">${esc(e.snip)}</span>` : ""}<span class="td">${left(e)}</span>
      <div class="trashacts"><button class="btn" data-untrash="${esc(id)}">Restore</button><button class="btn ghost danger" data-purge="${esc(id)}">Delete now</button></div></div>`).join("")}</div>`
      : `<p class="empty"><b>Nothing here.</b> What you delete waits here for ${TRASH_DAYS} days before it goes.</p>`}`;
}
function textView() {
  const id = S.textId, t = S.texts.get(id), secs = t.sections || [];
  const all = notesFor(id);
  const counts = new Map(); all.forEach(([, n]) => counts.set(n.sectionId, (counts.get(n.sectionId) || 0) + 1));
  const list = sortNotes(all.filter(([, n]) => (S.sec === "all" || n.sectionId === S.sec) && (S.kind === "all" || n.kind === S.kind) && matches(n, S.tq)), t);
  const secName = S.sec === "all" ? null : secs.find((s) => s.id === S.sec)?.label;
  const sums = t.summaries || {}, sum = secName ? sums[S.sec] || "" : "";
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Library</button></div>
    ${banner()}
    <header class="head">
      <div class="headrow">
        <div class="headcover">${coverHTML(t, coverURL(id))}</div>
        <div class="headtext">
          <h1>${esc(t.title)}</h1>
          ${t.author || t.edition ? `<div class="byline">${esc([t.author, t.edition].filter(Boolean).join(", "))}</div>` : ""}
          ${authorThinkers(t.author).map((p) => `<button class="src authlink" data-thinker="${esc(p.id)}">About ${esc(p.sn)}</button>`).join("")}
          ${pairOf(t) ? `<button class="src authlink" data-open="${esc(t.pair)}">Paired with “${esc(pairOf(t).title)}”</button>` : ""}
          ${t.source ? `<div class="srcline">From ${esc(t.source.name)}${t.source.pages ? `, ${esc(t.source.pages)} pages` : ""}${progressOf(t) > 0 ? `, ${progressOf(t)}% read` : ""}${t.readAt ? `, last read ${esc(fmtDate(t.readAt))}` : ""}</div>` : ""}
        </div>
      </div>
      <div class="actions">
        ${t.hasContent ? `<button class="btn primary" id="read">${t.pos > 0 ? "Continue reading" : "Read"}</button>` : ""}
        ${t.hasContent ? "" : `<button class="btn primary" id="loadfile">Load the book</button>`}
        <select id="status" aria-label="Status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(t.status || "reading") === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        <button class="btn" id="more" aria-haspopup="dialog">More</button>
        ${t.example ? `<span class="chip ex">Example</span>` : ""}
      </div>
    </header>
    ${primerHTML(id, t)}
    ${briefHTML(id, t)}
    ${classicMentionsHTML(id)}
    ${bookPlates(id, t).length ? `<section class="group"><div class="label">Bookplates</div><div class="plates">${bookPlates(id, t).map((x) => plateHTML({ ...x, tid: null, sub: "" })).join("")}</div></section>` : ""}
    ${spreadHTML(id, t)}
    ${paceHTML(id, t)}
    ${secs.length ? `<section class="group"><div><div class="label">Sections</div><p class="hint">Tick a section once you have read it. Tap its name to see its notes.</p></div><div class="sections">
      ${secs.map((s) => `<div class="sec ${s.done ? "done" : ""} ${S.sec === s.id ? "sel" : ""}">
        <input type="checkbox" id="chk-${esc(s.id)}" data-tick="${esc(s.id)}" ${s.done ? "checked" : ""} aria-label="Mark ${esc(s.label)} as read">
        <button data-sec="${esc(s.id)}">${esc(s.label)}</button><span class="n">${sums[s.id] ? `<span class="hassum" title="Has a summary">¶</span> ` : ""}${counts.get(s.id) || 0}</span></div>`).join("")}
    </div></section>` : ""}
    ${secName ? `<section class="group"><div class="notesbar"><div class="label">Summary of ${esc(secName)}</div><button class="btn" id="editsummary">${sum ? "Edit" : "Write summary"}</button></div>
      ${sum ? `<div class="paperpanel summary"><p>${esc(sum)}</p></div>` : `<p class="hint">Put the section's argument in your own words, in a few sentences. Summaries go into the Markdown export.</p>`}</section>` : ""}
    <section class="group">
      <div class="notesbar"><div class="label">${secName ? `Notes on ${esc(secName)}` : "Notes"}<span class="cnt">${list.length}</span></div><button class="btn primary" id="addnote">Add note</button></div>
      <div class="chips">
        ${secName ? `<button class="chip on" data-sec="all">${esc(secName)} ✕</button>` : ""}
        ${["all", ...Object.keys(KINDS)].map((k) => `<button class="chip ${S.kind === k ? "on" : ""}" data-kind="${k}">${k === "all" ? "All kinds" : KINDS[k]}</button>`).join("")}
      </div>
      <input class="search" id="tq" type="search" placeholder="Search this text's notes" value="${esc(S.tq)}" aria-label="Search this text's notes">
      <div class="noteslist">${list.map(([nid, n]) => noteHTML(nid, n, t, false)).join("") || `<p class="empty">${all.length ? "No notes match these filters." : t.hasContent ? `<b>No notes yet.</b> Open the text, select a passage and save it.` : `<b>No notes yet.</b> Log a passage word for word with its page, or load the book's file to read and select passages here.`}</p>`}</div>
    </section>`;
}

/* ---------- your notes through the book: where in it you took them, on a book's page ----------
   The book in SPREAD_BINS stretches, each bar as tall as its share of your notes; lines where chapters begin (once the text is loaded)
   and a dot at your place. A bar with notes goes to the first of them. Nothing is stored. */
const SPREAD_BINS = 48;
function spreadHTML(id, t) {
  const total = t.total || (S.content.get(id) || []).length;
  if (!t.hasContent || total < 2) return "";
  const at = notesFor(id).map(([, n]) => n).filter((n) => Number.isInteger(n.at) && n.at >= 0 && n.at < total).sort((a, b) => a.at - b.at);
  if (at.length < 2) return "";
  const bin = (i) => Math.min(SPREAD_BINS - 1, Math.floor((SPREAD_BINS * i) / total)), bins = Array.from({ length: SPREAD_BINS }, () => []);
  at.forEach((n) => bins[bin(n.at)].push(n));
  const top = Math.max(...bins.map((b) => b.length)), pct = (i) => (100 * i) / total;
  const B = S.content.get(id), chapters = B ? B.map((b, i) => [b, i]).filter(([b]) => b.s && !b.stj && roleOf(b) === "chapter").map(([, i]) => i) : [];
  const half = Math.round(SPREAD_BINS / 2), firstHalf = bins.slice(0, half).reduce((k, b) => k + b.length, 0);
  const busiest = bins.indexOf(bins.reduce((a, b) => (b.length > a.length ? b : a))), from = Math.round((100 * busiest) / SPREAD_BINS);
  return `<section class="group"><div class="label">Your notes through the book</div><div class="paperpanel spread">
    <div class="sp-bars" role="group" aria-label="Where in the book your ${at.length} notes are">
      ${chapters.map((i) => `<i class="sp-ch" style="left:${pct(i)}%" aria-hidden="true"></i>`).join("")}
      ${bins.map((b, k) => b.length ? `<button class="sp-bin" style="left:${(100 * k) / SPREAD_BINS}%;height:${Math.max(14, Math.round((100 * b.length) / top))}%" data-goto-note="${b[0].at}" data-tid="${esc(id)}" aria-label="${b.length} note${b.length === 1 ? "" : "s"} about ${Math.round((100 * k) / SPREAD_BINS)}% through"></button>` : "").join("")}
      ${Number.isInteger(t.pos) && t.pos > 0 ? `<i class="sp-pos" style="left:${pct(t.pos)}%" title="Your place" aria-hidden="true"></i>` : ""}
    </div>
    <div class="sp-ends"><span>Start</span><span>End</span></div>
    <p class="hint">${at.length} notes; the most around ${from}% of the way through${at.length >= 6 ? `, ${firstHalf > at.length * 0.65 ? "most in the first half" : firstHalf < at.length * 0.35 ? "most in the second half" : "spread across both halves"}` : ""}. ${chapters.length ? "Lines mark chapters. " : ""}${Number.isInteger(t.pos) && t.pos > 0 ? "The dot is your place. " : ""}Tap a bar to go to its notes.</p>
  </div></section>`;
}

/* ---------- your reading pace, on a book's page: from t.days (see savePos) ----------
   The last PACE_SHOWN days' minutes as bars; time in the book; words a minute and minutes a reading day over the last PACE_RECENT days
   (all of them when that's too little to go on); and, once the text is loaded, the time to the end of the text before the back matter. */
const PACE_SHOWN = 14, PACE_RECENT = 30;
const fmtDur = (sec) => { const m = Math.round(sec / 60); return m < 60 ? `${Math.max(1, m)} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`; };
function paceOf(t, now = new Date()) {
  const days = Object.entries(t.days || {}).filter(([k, d]) => DAY_KEY.test(k) && Array.isArray(d));
  const total = days.reduce((a, [, d]) => a + d[0], 0);
  if (total < 60) return null;
  const since = new Date(now); since.setDate(since.getDate() - PACE_RECENT + 1);
  const recent = days.filter(([k]) => k >= dayKey(since)), sum = (L, j) => L.reduce((a, [, d]) => a + d[j], 0);
  const base = sum(recent, 0) >= 600 && sum(recent, 1) >= 1000 ? recent : days, secs = sum(base, 0), words = sum(base, 1);
  const read = base.filter(([, d]) => d[0] >= 60);
  return { total, on: days.filter(([, d]) => d[0] > 0).length, wpm: secs >= 600 && words >= 1000 ? (60 * words) / secs : 0, daily: read.length ? sum(read, 0) / read.length : 0, recentOnly: base === recent };
}
function paceHTML(id, t) {
  const P = paceOf(t); if (!P) return "";
  const today = new Date(), bars = Array.from({ length: PACE_SHOWN }, (_, k) => { const d = new Date(today); d.setDate(d.getDate() - (PACE_SHOWN - 1 - k)); return [d, ((t.days || {})[dayKey(d)] || [0])[0]]; });
  const top = Math.max(60, ...bars.map(([, x]) => x)), shown = bars.reduce((a, [, x]) => a + x, 0);
  let left = "";
  const B = S.content.get(id), pos = Number.isInteger(t.pos) ? t.pos : 0;
  if (B && P.wpm) {
    const names = new Map((t.sections || []).map((x) => [x.id, x.label]));
    let end = B.length; for (const i of chapterHeads(B)) if (i > pos && BACK_MATTER.test((names.get(B[i].s) || "").trim())) { end = i; break; }
    const wc = wordCum(B), words = Math.max(0, wc[end] - wc[Math.min(pos, end)]), secs = (60 * words) / P.wpm;
    left = words < 50 ? "You're at the end of the text." : `At that pace, about ${fmtDur(secs)} to the end of the text${end < B.length ? " (before the back matter)" : ""}${P.daily >= 60 ? (secs <= P.daily * 1.25 ? ", about a day's reading" : `, some ${Math.round(secs / P.daily)} reading days`) : ""}.`;
  } else if (!B && t.hasContent && P.wpm && !BRIEF_LOADING.has(id)) { BRIEF_LOADING.add(id); loadContent(id).then((x) => { if (x && S.screen === "text" && S.textId === id) render(); }).catch(() => {}); }
  const day = (d) => d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  return `<section class="group"><div class="label">Your reading pace</div><div class="paperpanel pace">
    <div class="pace-bars" role="img" aria-label="Minutes read on each of the last ${PACE_SHOWN} days: ${bars.map(([d, x]) => `${day(d)} ${Math.round(x / 60)}`).join(", ")}">
      ${bars.map(([d, x], k) => `<i${k === PACE_SHOWN - 1 ? ' class="today"' : ""} style="height:${x ? Math.max(6, Math.round((100 * x) / top)) : 0}%" title="${esc(day(d))}: ${esc(x ? fmtDur(x) : "none")}"></i>`).join("")}
    </div>
    <div class="sp-ends"><span>Two weeks ago</span><span>Today</span></div>
    <p class="hint"><b>${esc(fmtDur(P.total))}</b> in this book, over ${P.on} day${P.on === 1 ? "" : "s"}${shown && shown < P.total ? `; ${esc(fmtDur(shown))} in the last two weeks` : ""}.
      ${P.wpm ? `${P.recentOnly ? "Lately" : "So far"} about ${Math.round(P.wpm / 10) * 10} words a minute${P.daily >= 60 ? `, ${esc(fmtDur(P.daily))} on a day you read it` : ""}.` : "Read a little longer for a pace."} ${esc(left)}</p>
  </div></section>`;
}

/* ---------- where I left off: the brief on a book's page, beside Continue reading ----------
   Your place (page and chapter), your summary of that chapter or the last one you summarized, your latest notes and the
   book's open questions. Nothing is stored for it. The chapter needs the book's text, loaded once and then kept. */
const BRIEF_LOADING = new Set();
function placeIn(blocks, t, at) {
  let page = "", sec = null, sum = null;
  const names = new Map((t.sections || []).map((x) => [x.id, x.label])), sums = t.summaries || {};
  for (let k = Math.min(at, blocks.length - 1); k >= 0; k--) {
    const b = blocks[k];
    if (!page && b.k === "pg" && b.x) page = String(b.x);
    if (b.s && !b.stj && roleOf(b) === "chapter" && names.has(b.s)) {
      if (!sec) sec = b.s;
      if (!sum && sums[b.s]) sum = b.s;
      if (page && sum) break;
    }
  }
  return { page, sec, label: sec ? names.get(sec) : "", sum, sumLabel: sum ? names.get(sum) : "" };
}
// Next time: one line you leave yourself (t.next), shown here and when you next continue reading.
function nextSheet(tid) {
  const t = S.texts.get(tid); if (!t) return;
  openSheet(`<h2>Next time</h2>
    <div class="field"><label for="nx-text">What to pick up when you come back</label><textarea id="nx-text" name="next" rows="3" placeholder="Work out why he rejects…">${esc(t.next || "")}</textarea>
    <span class="hint">Shown on the book's page and when you next continue reading. Leave it empty to clear it.</span></div>`,
  async (fd) => {
    const now = S.texts.get(tid); if (!now) return;
    const v = fd.get("next").trim(), rec = { ...now, updatedAt: Date.now() };
    if (v) rec.next = v; else delete rec.next;
    await put("texts", tid, rec);
  });
}
function briefHTML(id, t) {
  const pos = Number.isInteger(t.pos) && t.pos > 0 ? t.pos : null;
  const mine = notesFor(id), when = (n) => Math.max(n.updatedAt || 0, n.createdAt || 0);
  const open = mine.filter(([, n]) => OPENABLE.has(n.kind) && !n.resolved), shown = new Set(open.slice(0, 3).map(([nid]) => nid));
  const recent = mine.filter(([nid]) => !shown.has(nid)).sort((a, b) => when(b[1]) - when(a[1])).slice(0, 3);
  if (pos === null && !mine.length && !t.next) return "";
  let where = null;
  if (pos !== null && t.hasContent) {
    const B = S.content.get(id);
    if (B) where = placeIn(B, t, pos);
    else if (!BRIEF_LOADING.has(id)) { BRIEF_LOADING.add(id); loadContent(id).then((x) => { if (x && S.screen === "text" && S.textId === id) render(); }).catch(() => {}); }
  }
  const row = ([nid, n]) => `<button class="brow"${Number.isInteger(n.at) && t.hasContent ? ` data-goto-note="${n.at}" data-tid="${esc(id)}"` : ` data-editnote="${esc(nid)}"`}><span>${esc(OPENABLE.has(n.kind) && n.gloss ? noteSnippet({ gloss: n.gloss }, 110) : noteSnippet(n, 110))}</span><small>${esc([KINDS[n.kind] || "", loc(n.page)].filter(Boolean).join(", "))}</small></button>`;
  const summary = where && where.sum ? (t.summaries || {})[where.sum] : "";
  return `<section class="group"><div class="label">Where you left off</div><div class="paperpanel brief">
    ${pos !== null ? `<p class="bwhere">${where ? `${esc(where.page ? loc(where.page) : `${progressOf(t)}% through`)}${where.label ? ` <span>in ${esc(where.label)}</span>` : ""}` : `${progressOf(t)}% through`}${t.readAt ? ` <span>· ${esc(fmtDate(t.readAt))}</span>` : ""}</p>` : ""}
    ${t.next ? `<div class="bnext"><div class="blab">Next time</div><p class="bsum">${esc(t.next)}</p><button class="linkbtn" id="editnext">Change or clear it</button></div>` : ""}
    ${summary ? `<div><div class="blab">${where.sum === where.sec ? "Your summary of this chapter" : `Your summary of ${esc(where.sumLabel)}`}</div><p class="bsum" id="bsum">${esc(summary)}</p></div>` : ""}
    ${open.length ? `<div><div class="blab">Open questions in this book</div>${open.slice(0, 3).map(row).join("")}${open.length > 3 ? `<div class="bmore">and ${open.length - 3} more</div>` : ""}</div>` : ""}
    ${recent.length ? `<div><div class="blab">Your latest notes</div>${recent.map(row).join("")}</div>` : ""}
    ${(() => { const at = where && stepAt(id, S.content.get(id), pos); return at ? `<div><div class="blab">Questions to read these chapters with</div>${readQsHTML(at.P, at.k, true, true)}<div class="bmore">From the reading path “${esc(at.P.n)}”</div></div>` : ""; })()}
    ${t.next ? "" : `<div class="bnext"><button class="linkbtn" id="editnext">Leave yourself a line for next time</button></div>`}
  </div></section>`;
}

/* ---------- tags and open questions ---------- */
// Notes grouped by text (texts in title order), each group in reading order.
function byText(list) {
  const m = new Map();
  list.forEach((e) => { const k = e[1].textId; if (!m.has(k)) m.set(k, []); m.get(k).push(e); });
  return [...m].map(([tid, notes]) => [tid, sortNotes(notes, S.texts.get(tid))])
    .sort(([a], [b]) => ((S.texts.get(a) || {}).title || "").localeCompare((S.texts.get(b) || {}).title || ""));
}
function groupsHTML(list) {
  return byText(list).map(([tid, notes]) => {
    const t = S.texts.get(tid);
    return `<section class="group"><div class="label">${t ? `<button class="src grouptitle" data-open="${esc(tid)}">${esc(t.title)}</button>` : "Unknown text"}<span class="cnt">${notes.length}</span></div>
      <div class="noteslist">${notes.map(([id, n]) => noteHTML(id, n, t, false)).join("")}</div></section>`;
  }).join("");
}
const taggedWith = (tg) => [...S.notes.entries()].filter(([, n]) => tagsOf(n).includes(tg));
function tagView() {
  const head = `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>${banner()}`;
  if (!S.tag) {
    const tags = allTags();
    return `${head}<header class="gl-head"><div><h1>Tags</h1><div class="sub">${tags.length} tag${tags.length === 1 ? "" : "s"} in your notes</div></div></header>
      ${tags.length ? `<div class="chips">${tags.map(([tg, c]) => `<button class="chip tagchip" data-tag="${esc(tg)}">#${esc(tg)}<span class="cnt">${c}</span></button>`).join("")}</div>` : `<p class="empty">No tags yet. Write #something in a note to start one.</p>`}`;
  }
  const list = taggedWith(S.tag), texts = new Set(list.map(([, n]) => n.textId)).size;
  const near = new Map();
  list.forEach(([, n]) => tagsOf(n).forEach((x) => { if (x !== S.tag) near.set(x, (near.get(x) || 0) + 1); }));
  const nearList = [...near].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  return `${head}
    <header class="gl-head"><div><h1>#${esc(S.tag)}</h1><div class="sub">${list.length} note${list.length === 1 ? "" : "s"}${texts > 1 ? ` across ${texts} texts` : ""}</div></div>${list.length ? `<button class="btn" id="exporttag">Export</button>` : ""}</header>
    ${nearList.length ? `<div class="group"><div class="label">Often tagged with it</div><div class="chips">${nearList.map(([tg, c]) => `<button class="chip tagchip" data-tag="${esc(tg)}">#${esc(tg)}<span class="cnt">${c}</span></button>`).join("")}</div></div>` : ""}
    ${groupsHTML(list) || `<p class="empty">No notes carry #${esc(S.tag)} any more.</p>`}`;
}
const questionNotes = () => [...S.notes.entries()].filter(([, n]) => OPENABLE.has(n.kind));
function questionsView() {
  const all = questionNotes(), open = all.filter(([, n]) => !n.resolved), done = all.filter(([, n]) => n.resolved);
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>${banner()}
    <header class="gl-head"><div><h1>Open questions</h1><div class="sub">${open.length} open, ${done.length} resolved</div></div>${open.length ? `<button class="btn" id="exportquestions">Export</button>` : ""}</header>
    <p class="hint">Every note of the kind Question or Objection stays here until you mark it resolved. Edit the note to record the answer you found.</p>
    ${groupsHTML(open) || `<p class="empty"><b>Nothing open.</b> ${all.length ? "Every question and objection is resolved." : "Save a note as a Question or an Objection and it will wait here."}</p>`}
    ${done.length ? `<details class="resolvedlist"><summary class="label">Resolved<span class="cnt">${done.length}</span></summary>${groupsHTML(done)}</details>` : ""}`;
}
function acrossHTML() {
  const qs = questionNotes(), open = qs.filter(([, n]) => !n.resolved).length, tags = allTags();
  const loaded = [...S.texts.values()].some((t) => t.hasContent), drafts = S.drafts.size;
  if (!qs.length && !tags.length && !loaded && !drafts && !S.compares.size && !S.notes.size) return "";
  return `<div class="across"><div class="label">Across your library</div><div class="chips">
    ${loaded ? `<button class="chip qchip" id="searchall">Search all books</button>` : ""}
    ${drafts || S.notes.size ? `<button class="chip qchip" id="opendrafts">Drafts<span class="cnt">${drafts}</span></button>` : ""}
    ${S.compares.size || S.notes.size ? `<button class="chip qchip" id="opencompares">Comparisons<span class="cnt">${S.compares.size}</span></button>` : ""}
    ${qs.length ? `<button class="chip qchip" id="openquestions">Open questions<span class="cnt">${open}</span></button>` : ""}
    ${S.notes.size ? (() => { const k = bookplates().count; return k ? `<button class="chip qchip" id="openplates">Bookplates<span class="cnt">${k}</span></button>` : ""; })() : ""}
    ${tags.slice(0, 8).map(([tg, c]) => `<button class="chip tagchip" data-tag="${esc(tg)}">#${esc(tg)}<span class="cnt">${c}</span></button>`).join("")}
    ${tags.length > 8 ? `<button class="chip" data-tag="">All ${tags.length} tags</button>` : ""}
  </div></div>`;
}

/* ---------- jumping to a note ---------- */
function jumpToNote(id) {
  const n = S.notes.get(id); if (!n) return toast("That note was deleted.");
  go({ screen: "text", textId: n.textId, note: id });
}
