// Marginalia: the glossary and quizzes, guess the thinker, puzzles, the argument reconstruction guide, quiz sets and truth tables. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- glossary ---------- */
const AREAS = { meta: "Metaphysics", know: "Knowledge", logic: "Logic", ethics: "Ethics & politics", aes: "Aesthetics & religion", phen: "Phenomenology & hermeneutics", crit: "Critical theory", mine: "Your terms" };
// GLOSSARY is in data/glossary.js.
function allTerms() {
  const out = new Map(GLOSSARY.map((g) => [g.id, { ...g, builtIn: true }]));
  for (const [id, u] of S.terms) {
    if (id.startsWith("~")) continue; // settings kept with the glossary, such as your look-up aliases
    const base = out.get(id);
    out.set(id, { ...(base || {}), ...u, id, builtIn: !!base, edited: !!base });
  }
  return [...out.values()].sort((x, y) => x.t.localeCompare(y.t, undefined, { sensitivity: "base" }));
}
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function termKeys(g) {
  const keys = g.edited || !g.builtIn ? [g.t.replace(/\s*\(.*?\)\s*/g, " ").trim()] : g.k || [g.t.replace(/\s*\(.*?\)\s*/g, " ").trim()];
  return keys.filter((k) => k.length > 2);
}
function termNotes(g) {
  const keys = termKeys(g); if (!keys.length) return [];
  const re = new RegExp(`(^|[^\\p{L}])(${keys.map(reEsc).join("|")})(s|es)?(?![\\p{L}])`, "iu");
  return [...S.notes.entries()].filter(([, n]) => re.test(n.passage || "") || re.test(n.gloss || "")).sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0));
}
// Links between terms run both ways: if A lists B, B shows A too. A contrast is listed once, under "Contrast with".
const LINKS = (() => {
  const see = new Map(), vs = new Map();
  const add = (m, a, b) => { if (!m.has(a)) m.set(a, new Set()); m.get(a).add(b); };
  for (const g of GLOSSARY) {
    for (const r of g.r || []) { add(see, g.id, r); add(see, r, g.id); }
    for (const r of g.vs || []) { add(vs, g.id, r); add(vs, r, g.id); }
  }
  for (const [a, set] of vs) for (const b of set) if (see.has(a)) see.get(a).delete(b);
  return { see, vs };
})();
const chipRow = (label, html) => (html ? `<div class="crow"><span class="clabel">${label}</span><div class="chips">${html}</div></div>` : "");
const thinkerChips = (ids) => ids.map((id) => THINKER.get(id)).filter(Boolean).map((p) => `<button class="chip pchip" data-thinker="${esc(p.id)}">${esc(p.sn)}</button>`).join("");
const branchChips = (ids) => ids.map((id) => BRANCH.get(id)).filter(Boolean).map((b) => `<button class="chip bchip2" data-branch="${esc(b.id)}">${esc(b.n)}</button>`).join("");
// A long row of thinkers: the first few, then the rest folded away.
const foldChips = (label, ids, k = 8) => !ids.length ? "" : ids.length <= k + 2 ? chipRow(label, thinkerChips(ids))
  : `<div class="crow"><span class="clabel">${label}</span><div class="chips">${thinkerChips(ids.slice(0, k))}</div><details class="cfold"><summary>${ids.length - k} more</summary><div class="chips">${thinkerChips(ids.slice(k))}</div></details></div>`;
const termChips = (ids, tmap) => ids.filter((id) => tmap.has(id)).map((id) => `<button class="chip tchip" data-term="${esc(id)}">${esc(tmap.get(id).t)}</button>`).join("");
const termMap = () => new Map(allTerms().map((g) => [g.id, g]));
// Your notes that use a term, grouped by author and then book, each book's in reading order: how the concept reads in each,
// in the passages you kept and what you wrote about them. Only your notes; nothing is said about the term for you.
function termHitsHTML(hits) {
  if (!hits.length) return "";
  const byBook = new Map();
  for (const [id, n] of hits) { if (!byBook.has(n.textId)) byBook.set(n.textId, []); byBook.get(n.textId).push([id, n]); }
  const books = [...byBook].map(([tid, list]) => [tid, S.texts.get(tid), list]).filter(([, t]) => t)
    .sort(([, a], [, b]) => (a.author || "\uffff").localeCompare(b.author || "\uffff", undefined, { sensitivity: "base" }) || a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  const authors = new Set(books.map(([, t]) => fold(t.author || "")));
  const note = (tid, t) => ([, n]) => `<div class="thit"><div class="meta">${n.page ? `<span>${esc(loc(n.page))}</span>` : ""}${KINDS[n.kind] && n.kind !== "passage" ? `<span>${esc(KINDS[n.kind])}</span>` : ""}${t.hasContent && Number.isInteger(n.at) ? `<button class="src" data-goto-note="${n.at}" data-tid="${esc(tid)}">Show in text</button>` : ""}</div>${n.passage ? `<p>${esc(n.passage)}</p>` : ""}${n.gloss ? `<p class="tgl">${esc(n.gloss)}</p>` : ""}</div>`;
  const group = ([tid, t, list]) => {
    const sorted = sortNotes(list, t), first = sorted.slice(0, 4), rest = sorted.slice(4);
    return `<div class="tbook"><div class="tbh"><button class="src" data-open="${esc(tid)}">${esc(t.title)}</button>${t.author ? `<span>${esc(t.author)}</span>` : ""}<span class="cnt">${list.length}</span></div>
      ${first.map(note(tid, t)).join("")}${rest.length ? `<details class="tmorehits"><summary>${rest.length} more from this book</summary>${rest.map(note(tid, t)).join("")}</details>` : ""}</div>`;
  };
  return `<div class="thits"><div class="label">In your notes</div>${books.length > 1 ? `<p class="hint">In ${books.length} books${authors.size > 1 ? ` by ${authors.size} authors` : ""}, grouped by author, to compare how each uses it.</p>` : ""}${books.map(group).join("")}</div>`;
}
/* ---------- In your books: where a term's name occurs in the texts of your library ----------
   Searched only when you ask, since it reads every book's text. Matching is Mentioned in's (termNeedles, findNeedles): whole words,
   accents ignored in either Unicode form, plurals. The text is read as Find reads it (textRuns): a paragraph and its continuations past
   printed-page breaks are one run, so a name the printed page split is found. Every occurrence counts, so two in one paragraph count
   two. Passages you linked to the term yourself (t.termMarks) are listed too, as Your link, placed like a note's passage; a name inside
   one of them is that link, counted once. Each book shows its count and its first hits with page and chapter (sectionIndex) and the
   sentence; tapping one opens the reader there, with the word in Find and ← Your place to go back. Nothing is stored. */
const INBOOK_SHOWN = 3, INBOOK_LISTED = 40;
const IS_ASCII = /^[\x00-\x7f]*$/;
// One book's occurrences: { count, links, hits: [{ i, page, sec, word, snip, mine }] } (the first INBOOK_SHOWN + INBOOK_LISTED, in
// reading order), or null with no text. termId picks your links to the term.
async function bookOccurrences(tid, needles, termId) {
  const B = S.content.get(tid) || (idb ? await idbGet("content", tid) : null); if (!B) return null;
  const ix = sectionIndex(B), all = [];
  // your links first, so a name inside one counts as the link
  const links = [];
  for (const m of termMarksOf(S.texts.get(tid))) {
    if (m.id !== termId) continue;
    const A = placeNote(m, B); if (A) links.push(A);
  }
  // places as [block, character]; a match overlapping a link anywhere, even across blocks, is that link
  const before = (i, o, j, p) => i < j || (i === j && o < p);
  const inLink = (s, e) => links.some((A) => before(s.i, s.off, A.b, A.bo) && before(A.a, A.ao, e.i, e.off));
  for (const A of links) all.push({ i: A.a, off: A.ao, mine: true, snip: () => { const p = quoteOf(B, A); return `<mark>${esc(p.length > 260 ? p.slice(0, 250).replace(/\s\S*$/, "") + "…" : p)}</mark>`; } });
  if (needles.length) for (const run of textRuns(B)) {
    const text = run.text;
    // plain ASCII folds to itself, letter for letter: skip linkFold's work, and runs without any needle
    const ascii = IS_ASCII.test(text), low = ascii ? text.toLowerCase() : null;
    if (ascii && !needles.some((nd) => (nd.exact ? text : low).includes(nd.s))) continue;
    const F = ascii ? { cased: text, low } : linkFold(text), at = (k) => (ascii ? k : F.map[k]);
    for (const h of findNeedles(F, needles)) {
      const a = at(h.pos), e = at(h.end);
      // where the match starts and ends, as a block and a character in that block's own text (the end exclusive)
      const where = (c, end) => { let sg = run.segs[0]; for (const x of run.segs) if (end ? x.at < c : x.at <= c) sg = x; return { i: sg.i, off: Math.max(0, Math.min(c - sg.at, sg.len)) + sg.base }; };
      const st = where(a, false), en = where(e, true), i = st.i, off = st.off;
      if (inLink(st, en)) continue;
      all.push({ i, off, word: text.slice(a, e), snip: () => rawSnip(text, a, e) });
    }
  }
  all.sort((x, y) => x.i - y.i || x.off - y.off);
  const hits = all.slice(0, INBOOK_SHOWN + INBOOK_LISTED).map((h) => ({ i: h.i, page: ix.pageAt[h.i], sec: ix.secAt[h.i], word: h.word || "", mine: !!h.mine, snip: h.snip() }));
  return { count: all.length, links: links.length, hits };
}
function inBooksStart(g) {
  const n = [...S.texts.values()].filter((t) => t.hasContent).length; if (!n || (!termNeedles(g).length && ![...S.texts.values()].some((t) => termMarksOf(t).some((m) => m.id === g.id)))) return "";
  return `<div class="label">In your books</div><p class="hint">Where it occurs in the text of your ${n} book${n === 1 ? "" : "s"}, by its name${termNeedles(g).length > 1 ? "s" : ""} as whole words.</p>
    <div class="noteacts"><button class="btn ghost" data-inbooks="${esc(g.id)}">Search your books</button></div>`;
}
let INBOOK_RUN = 0;
async function runInBooks(btn) {
  const box = btn.closest("[data-inbooks-box]"), g = box && allTerms().find((x) => x.id === box.dataset.inbooksBox); if (!g) return;
  const entry = box.closest("details"), run = String(++INBOOK_RUN); box.dataset.run = run;
  const needles = termNeedles(g), texts = [...S.texts.entries()].filter(([, t]) => t.hasContent);
  btn.disabled = true;
  const found = []; let missing = 0, k = 0;
  for (const [tid, t] of texts) {
    btn.textContent = `Searching ${++k} of ${texts.length}…`;
    await new Promise((r) => setTimeout(r));
    // gone, closed, or started again: stop, and leave the button ready for next time
    if (!box.isConnected || box.dataset.run !== run) return;
    if (entry && !entry.open) { box.innerHTML = inBooksStart(g); return; }
    let r = null; try { r = await bookOccurrences(tid, needles, g.id); } catch { r = null; }
    if (!r) { missing++; continue; }
    if (r.count) found.push([tid, t, r]);
  }
  if (!box.isConnected || box.dataset.run !== run) return;
  if (entry && !entry.open) { box.innerHTML = inBooksStart(g); return; }
  box.innerHTML = inBooksHTML(g, found, texts.length, missing);
}
function inBooksHTML(g, found, searched, missing) {
  found.sort(([, a], [, b]) => (a.author || "￿").localeCompare(b.author || "￿", undefined, { sensitivity: "base" }) || a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  const total = found.reduce((n, [, , r]) => n + r.count, 0);
  const row = (tid, t) => (h) => {
    const sec = h.sec && (t.sections || []).find((s) => s.id === h.sec), meta = [h.page ? loc(h.page) : "", sec ? sec.label : ""].filter(Boolean);
    if (h.mine) meta.unshift("Your link");
    return `<button class="mention" data-inbook="${esc(tid)}" data-at="${h.i}"${h.word ? ` data-find="${esc(h.word)}"` : ""}><span class="mn">${meta.map((m) => `<span>${esc(m)}</span>`).join("") || "<span>Open it here</span>"}</span><span class="ms">${h.snip}</span></button>`;
  };
  const group = ([tid, t, r]) => {
    const first = r.hits.slice(0, INBOOK_SHOWN), rest = r.hits.slice(INBOOK_SHOWN), over = r.count - r.hits.length;
    return `<div class="tbook"><div class="tbh"><button class="src" data-open="${esc(tid)}">${esc(t.title)}</button>${t.author ? `<span>${esc(t.author)}</span>` : ""}<span class="cnt">${r.count} time${r.count === 1 ? "" : "s"}${r.links ? `, ${r.links} your link${r.links === 1 ? "" : "s"}` : ""}</span></div>
      ${first.map(row(tid, t)).join("")}${rest.length ? `<details class="tmorehits"><summary>${rest.length} more${over > 0 ? ` of ${r.count - INBOOK_SHOWN}` : ""} from this book</summary>${rest.map(row(tid, t)).join("")}${over > 0 ? `<p class="hint">${over} more not listed: open one and Find steps through them all.</p>` : ""}</details>` : ""}</div>`;
  };
  const read = searched - missing, books = (n) => `${n} book${n === 1 ? "" : "s"}`;
  const where = missing ? `the ${books(read)} that could be read` : `your ${books(read)}`;
  const head = total ? `${total} time${total === 1 ? "" : "s"} in ${found.length} of ${where}.` : read ? `Not found in ${where}.` : "None of your books could be read.";
  return `<div class="label">In your books</div><div class="thits inbooks"><p class="hint" role="status">${head}${missing ? ` ${books(missing)} couldn't be read, so ${missing === 1 ? "it wasn't" : "they weren't"} searched.` : ""}</p>${found.map(group).join("")}</div>`;
}
/* ---------- Mentioned in: where the articles, thinker cards and glossary entries use a term or a thinker's name ----------
   Matching follows the articles' own links (branchLinks): accents ignored in either Unicode form, whole words only, a name under five
   letters in exact case, LINK_FULL_ONLY names only in full, a name two thinkers share never matched. A term matches by its name and the
   name in its brackets ("Assemblage (agencement)" finds both), and for a pair ("Signifier and signified") by each half its entry lists
   as a key. Each place is listed once, with the sentence of its first mention. Worked out when an entry opens; nothing is stored. */
let MENTION_SRC = null;
function mentionSources() {
  if (MENTION_SRC) return MENTION_SRC;
  const out = [];
  for (const b of BRANCHES) {
    if (!b.x) continue;
    let head = null, paras = [];
    const flush = () => { if (paras.length) out.push({ kind: "branch", id: b.id, name: b.n, sec: head, text: paras.join("\n\n") }); paras = []; };
    for (const part of b.x.split(/\n\n/)) {
      const at = part.indexOf("\n");
      if (at >= 0) { flush(); head = part.slice(0, at); paras.push(part.slice(at + 1)); }
      else paras.push(part);
    }
    flush();
  }
  for (const p of THINKERS) out.push({ kind: "thinker", id: p.id, name: p.n, text: [p.d, p.x].filter(Boolean).join("\n\n") });
  for (const s of out) s.f = linkFold(s.text);
  return (MENTION_SRC = out);
}
const MENTION_PAIR_SKIP = new Set(["analytic", "synthetic", "sense", "reference", "contradiction", "community", "normative", "li"]);
function termNeedles(g) {
  const name = g.t.replace(/\s*\(.*?\)\s*/g, " ").trim(), par = (g.t.match(/\(([^()]+)\)/) || [])[1];
  const keys = new Set([name]);
  if (par && !/^(the|of|a|an)\b|^understanding$/i.test(par)) keys.add(par);
  const k = new Set((g.k || []).map((x) => x.toLowerCase()));
  const halves = name.split(/,\s*|\s+and\s+/);
  if (halves.length > 1) for (const h of halves) if (k.has(h.toLowerCase()) && !MENTION_PAIR_SKIP.has(h.toLowerCase())) keys.add(h);
  return [...keys].filter((x) => x.length >= 3).map((x) => ({ s: linkFold(x).low, exact: false, plural: true }));
}
// Each thinker's names as the articles link them; shared names left out.
let NAME_OWNERS = null;
function thinkerNeedles(p) {
  if (!NAME_OWNERS) {
    NAME_OWNERS = new Map();
    for (const x of THINKERS) for (const n of new Set([x.n, x.sn])) { const k = linkFold(n).low; if (!NAME_OWNERS.has(k)) NAME_OWNERS.set(k, new Set()); NAME_OWNERS.get(k).add(x.id); }
  }
  return [...new Set([p.n, p.sn])].filter((n) => n && n.length >= 4 && !LINK_FULL_ONLY.has(n.toLowerCase()) && NAME_OWNERS.get(linkFold(n).low).size === 1)
    .map((n) => { const f = linkFold(n); return n.length < 5 ? { s: f.cased, exact: true } : { s: f.low, exact: false }; });
}
// Every whole-word match of the needles in a folded text: [{ pos, end }], in order, never overlapping.
function findNeedles(F, needles) {
  const word = /[\p{L}\p{N}]/u, isW = (i) => i >= 0 && i < F.cased.length && word.test(F.cased[i]), hits = [];
  for (const nd of needles) {
    const hay = nd.exact ? F.cased : F.low;
    for (let from = 0, pos; (pos = hay.indexOf(nd.s, from)) >= 0; from = pos + 1) {
      let end = pos + nd.s.length;
      if (nd.plural) { if (hay.startsWith("es", end) && !isW(end + 2)) end += 2; else if (hay[end] === "s" && !isW(end + 1)) end += 1; }
      if (isW(pos - 1) || isW(end)) continue;
      if (hits.some((h) => pos < h.end && end > h.pos)) continue;
      hits.push({ pos, end });
    }
  }
  return hits.sort((a, b) => a.pos - b.pos);
}
// The sentence around a match, as HTML with the words marked; long sentences cut around them.
function mentionSnip(text, F, h) { return rawSnip(text, F.map[h.pos], F.map[h.end]); }
// The sentence around characters a to b of a text, as HTML with them marked.
function rawSnip(text, a, b) {
  // a sentence ends at white space after . ! or ? (and any closing quote), unless the word before is an initial or an abbreviation
  const ends = (j) => /\s/.test(text[j]) && /[.!?][”’")\]]*$/.test(text.slice(Math.max(0, j - 14), j))
    && !/(?:^|[\s(“])(?:\p{Lu}|c|ca|cf|e\.g|i\.e|vol|ch|pp?|St|Dr|Mr|Mrs|Ms|no|ed|eds|trans|vs)\.[”’")\]]*$/u.test(text.slice(Math.max(0, j - 14), j));
  let s = a, e = b;
  while (s > 0 && text[s - 1] !== "\n" && !ends(s - 1)) s--;
  while (e < text.length && text[e] !== "\n" && !ends(e)) e++;
  let pre = text.slice(s, a), post = text.slice(b, e);
  if (pre.length > 110) pre = "…" + pre.slice(pre.length - 100).replace(/^\S*\s/, "");
  if (post.length > 160) post = post.slice(0, 150).replace(/\s\S*$/, "") + "…";
  return `${esc(pre)}<mark>${esc(text.slice(a, b))}</mark>${esc(post)}`;
}
// Where the needles occur: { branch: [...], thinker: [...], term: [...] }, each { id, name, sec, count, snip }.
function mentionsOf(needles, self) {
  const out = { branch: [], thinker: [], term: [] };
  if (!needles.length) return out;
  const look = (src) => {
    if (self && src.kind === self.kind && src.id === self.id) return;
    const hits = findNeedles(src.f, needles); if (!hits.length) return;
    out[src.kind].push({ id: src.id, name: src.name, sec: src.sec, count: hits.length, snip: mentionSnip(src.text, src.f, hits[0]) });
  };
  mentionSources().forEach(look);
  for (const g of allTerms()) { const text = [g.d, g.x].filter(Boolean).join("\n\n"); look({ kind: "term", id: g.id, name: g.t, text, f: linkFold(text) }); }
  out.thinker.sort((a, b) => b.count - a.count); out.term.sort((a, b) => b.count - a.count);
  return out;
}
function mentionsHTML(m) {
  const row = (attrs, title, x) => `<button class="mention" ${attrs}><span class="mn">${title}</span><span class="ms">${x.snip}</span></button>`;
  // articles: each article once, with its sections under it
  const arts = new Map(); for (const x of m.branch) { if (!arts.has(x.id)) arts.set(x.id, []); arts.get(x.id).push(x); }
  const artRows = [...arts.values()].sort((a, b) => b.reduce((n, x) => n + x.count, 0) - a.reduce((n, x) => n + x.count, 0))
    .flatMap((list) => list.map((x, k) => row(`data-branch="${esc(x.id)}"${x.sec ? ` data-bsec="${esc(x.sec)}"` : ""}`, `${k ? "" : `<b>${esc(x.name)}</b>`}${x.sec ? `<span>${esc(x.sec)}</span>` : ""}`, x)));
  const fold = (label, rows, k = 4) => !rows.length ? "" : `<div class="mgroup"><div class="clabel">${label}</div>${rows.slice(0, k).join("")}${rows.length > k ? `<details class="cfold"><summary>${rows.length - k} more</summary>${rows.slice(k).join("")}</details>` : ""}</div>`;
  const html = fold(`In ${arts.size} article${arts.size === 1 ? "" : "s"}`, artRows)
    + fold(`On ${m.thinker.length} thinker card${m.thinker.length === 1 ? "" : "s"}`, m.thinker.map((x) => row(`data-thinker="${esc(x.id)}"`, `<b>${esc(x.name)}</b>`, x)))
    + fold(`In ${m.term.length} other entr${m.term.length === 1 ? "y" : "ies"}`, m.term.map((x) => row(`data-term="${esc(x.id)}"`, `<b>${esc(x.name)}</b>`, x)));
  return html ? `<div class="mentions"><div class="label">Mentioned in</div>${html}</div>` : "";
}
// A glossary entry's mentions, drawn when it opens (and for entries drawn open).
// An entry's text with its links, drawn when it opens (working them out for every closed entry would slow the glossary).
function fillLinks(d) {
  const box = d.querySelector(":scope > .tbody > [data-gx]"); if (!box || box.dataset.done) return;
  const g = allTerms().find((x) => x.id === box.dataset.gx); if (!g) return;
  box.dataset.done = "1"; box.innerHTML = refParas(g.x, { kind: "term", id: g.id });
}
function fillMentions(d) {
  const box = d.querySelector(":scope > .tbody > [data-mentions]"); if (!box || box.dataset.done) return;
  const g = allTerms().find((x) => x.id === box.dataset.mentions); if (!g) return;
  box.dataset.done = "1";
  box.innerHTML = mentionsHTML(mentionsOf(termNeedles(g), { kind: "term", id: g.id }));
}
// Your notes whose passage or gloss names a thinker, newest first (the same form as a term's "In your notes").
function thinkerNotes(needles) {
  if (!needles.length) return [];
  return [...S.notes.entries()].filter(([, n]) => findNeedles(linkFold([n.passage, n.gloss].filter(Boolean).join("\n")), needles).length)
    .sort(([, a], [, b]) => (b.createdAt || 0) - (a.createdAt || 0));
}
function termHTML(g, tmap) {
  const hits = termNotes(g);
  const see = [...(LINKS.see.get(g.id) || [])], vs = [...(LINKS.vs.get(g.id) || [])];
  const conn = chipRow("Thinkers", thinkerChips(g.p || []))
    + chipRow("Branches and traditions", branchChips(termBranches(g)))
    + chipRow("See also", termChips(see, tmap))
    + chipRow("Contrast with", termChips(vs, tmap));
  return `<details class="term" data-term-id="${esc(g.id)}"${S.gOpen.has(g.id) ? " open" : ""}>
    <summary><span class="tm">${esc(g.t)}</span><span class="ta">${esc(AREAS[g.a] || "")}${hits.length ? `, ${hits.length} in your notes` : ""}${g.edited ? ", edited by you" : ""}</span></summary>
    <div class="tbody">
      <p class="tdef">${esc(g.d)}</p>
      ${figHTML(g.img)}${diaHTML(g.fig)}
      <div data-gx="${esc(g.id)}">${S.gOpen.has(g.id) ? refParas(g.x, { kind: "term", id: g.id }) : classicParas(g.x)}</div>
      ${g.s ? `<p class="tsrc">${sourceLinks(g.s)}</p>` : ""}
      ${thinkerSources(g)}
      ${g.w ?`<p class="tsrc">Associated with ${esc(g.w)}</p>` : ""}
      ${aliasesOf(g.id).length ? `<p class="tsrc">Look up also finds: ${esc(aliasesOf(g.id).join(", "))}</p>` : ""}
      ${conn ? `<div class="tconn">${conn}</div>` : ""}
      ${termTimeHTML(g.p)}
      <div data-mentions="${esc(g.id)}"></div>
      ${termHitsHTML(hits)}
      <div data-inbooks-box="${esc(g.id)}">${inBooksStart(g)}</div>
      <div class="noteacts">
        ${sayBtn(g.t)}
        ${TT_TERMS.has(g.id) ? `<button class="btn" data-truth="${TT_TERMS.get(g.id)}">Try it in a truth table</button>` : ""}
        <button class="btn ghost" data-editterm="${esc(g.id)}">Edit</button>
        ${g.edited ? `<button class="btn ghost" data-restoreterm="${esc(g.id)}">Restore original</button>` : ""}
        ${g.builtIn ? "" : `<button class="btn ghost danger" data-delterm="${esc(g.id)}">Delete</button>`}
      </div>
    </div>
  </details>`;
}
const thinkerMatches = (p, q) => fold(p.n).includes(q) || fold(p.sn).includes(q);
// A life as years (BCE negative) for the timeline: { a, b, approx, open }, or null with no dates. Centuries ("8th c. CE",
// "early 5th c. BCE") are approximate; "b. 1929" runs to the present, as it isn't known here whether they're living.
function lifeSpan(y) {
  if (!y) return null;
  const bce = /BCE/.test(y);
  const r = y.match(/(\d+)\s*[–-]\s*(\d+)(?!\w*\s*c\.)/), c = y.match(/(\d+)(?:st|nd|rd|th)(?:[–-](\d+)(?:st|nd|rd|th))?\s*c\./), born = y.match(/^b\.\s*(\d+)/);
  if (c) {
    const c1 = +c[1], c2 = c[2] ? +c[2] : c1;
    let a = bce ? -c1 * 100 : (c1 - 1) * 100, b = bce ? -(c2 - 1) * 100 : c2 * 100;
    if (/early/.test(y)) b = a + 40; else if (/late/.test(y)) a = b - 40;
    return { a, b, approx: true, open: false };
  }
  if (r) return { a: bce ? -r[1] : +r[1], b: bce ? -r[2] : +r[2], approx: /c\.|trad\./.test(y), open: false };
  if (born) return { a: +born[1], b: new Date().getFullYear(), approx: false, open: true };
  return null;
}
const yearLabel = (v, ancient) => (v < 0 ? `${-v} BCE` : v === 0 ? "1 CE" : ancient ? `${v} CE` : String(v)); // there is no year 0
const TL_ERAS = [["Ancient, before the common era", -Infinity, 0], ["The first centuries CE", 0, 500], ["Medieval", 500, 1400], ["Renaissance and early modern", 1400, 1750], ["Modern", 1750, 1880],
  ["Twentieth century", 1880, 1930], ["Contemporary", 1930, Infinity]];
// The thinkers on a timeline, a period at a time, each on its own scale so the lives that overlap can be seen.
function timelineHTML(list) {
  const lives = list.map((p) => ({ p, s: lifeSpan(p.y) }));
  const eras = TL_ERAS.map(([name, lo, hi]) => {
    const rows = lives.filter((x) => x.s && x.s.a >= lo && x.s.a < hi).sort((x, y) => x.s.a - y.s.a || x.s.b - y.s.b);
    if (!rows.length) return "";
    const ancient = hi <= 1400;
    const min = Math.min(...rows.map((x) => x.s.a)), max = Math.max(...rows.map((x) => x.s.b));
    const span = Math.max(1, max - min), step = span <= 150 ? 25 : span <= 400 ? 50 : span <= 1000 ? 100 : 250;
    const from = Math.floor(min / step) * step, to = Math.ceil(max / step) * step, W = to - from;
    const pct = (v) => (100 * (v - from)) / W;
    const ticks = []; for (let v = from; v < to; v += step) ticks.push(v);
    const keep = Math.ceil(ticks.length / 5); // about five labels across a phone
    return `<section class="tl-era" data-era="${esc(name)}"><h3>${name}</h3><p class="hint">${rows.length} thinker${rows.length === 1 ? "" : "s"}, ${yearLabel(min, ancient)} to ${max >= new Date().getFullYear() ? "now" : yearLabel(max, ancient)}</p>
      <div class="tl-scale">${ticks.filter((_, k) => k % keep === 0).map((v) => `<span style="left:${pct(v)}%">${yearLabel(v, ancient)}</span>`).join("")}</div>
      ${rows.map(({ p, s }) => `<button class="tl-row" data-thinker="${esc(p.id)}" style="--tick:${(100 * step) / W}%"><span class="tl-n">${esc(p.n)}<span>${esc(p.y)}</span></span>
        <span class="tl-bar${s.approx ? " approx" : ""}${s.open ? " open" : ""}" style="margin-left:${pct(s.a)}%;width:${Math.max(0.5, pct(s.b) - pct(s.a))}%" aria-hidden="true"></span></button>`).join("")}
    </section>`;
  }).join("");
  const undated = lives.filter((x) => !x.s).map((x) => x.p);
  return eras + (undated.length ? `<section class="tl-era"><h3>Dates not given</h3><div class="gl-list">${undated.map(thinkerRow).join("")}</div></section>` : "");
}
// A term's thinkers on one scale, in order of birth: who the entry names, and when they lived. Undated thinkers are left out.
function termTimeHTML(ids, label = "Its thinkers in time") {
  const rows = (ids || []).map((id) => THINKER.get(id)).filter(Boolean).map((p) => ({ p, s: lifeSpan(p.y) })).filter((x) => x.s).sort((x, y) => x.s.a - y.s.a || x.s.b - y.s.b);
  if (rows.length < 2) return "";
  const min = Math.min(...rows.map((x) => x.s.a)), max = Math.max(...rows.map((x) => x.s.b)), ancient = min < 1400;
  const span = Math.max(1, max - min), step = [25, 50, 100, 250, 500, 1000].find((k) => span / k <= 4) || 1000;
  const from = Math.floor(min / step) * step, to = Math.ceil(max / step) * step, W = to - from, pct = (v) => (100 * (v - from)) / W;
  const ticks = []; for (let v = from; v < to; v += step) ticks.push(v);
  return `<div class="ttime"><div class="label">${esc(label)}</div>
    <div class="tl-scale">${ticks.map((v) => `<span style="left:${pct(v)}%">${yearLabel(v, ancient)}</span>`).join("")}</div>
    ${rows.map(({ p, s }) => `<button class="tl-row" data-thinker="${esc(p.id)}" style="--tick:${(100 * step) / W}%"><span class="tl-n">${esc(p.sn || p.n)}<span>${esc(p.y)}</span></span>
      <span class="tl-bar${s.approx ? " approx" : ""}${s.open ? " open" : ""}" style="margin-left:${pct(s.a)}%;width:${Math.max(0.8, pct(s.b) - pct(s.a))}%" aria-hidden="true"></span></button>`).join("")}</div>`;
}
// Thinkers two steps away along "drew on": those their sources drew on, and those who took up the ones who took them up.
function lineageSteps(id) {
  const back1 = new Set(THINKER.get(id)?.i || []), on1 = new Set(THINKERS.filter((x) => x.i.includes(id)).map((x) => x.id));
  const back2 = new Set(), on2 = new Set();
  for (const b of back1) for (const x of THINKER.get(b)?.i || []) if (x !== id && !back1.has(x)) back2.add(x);
  for (const o of on1) for (const x of THINKERS) if (x.i.includes(o) && x.id !== id && !on1.has(x.id)) on2.add(x.id);
  const byBirth = (set) => [...set].filter((x) => THINKER.has(x)).sort((a, b) => birthYear(THINKER.get(a).y) - birthYear(THINKER.get(b).y));
  return { back: byBirth(back2), on: byBirth(on2) };
}
// People whose lives overlapped by twenty years or more: who could have read, met or argued with whom.
function contemporariesOf(p) {
  const s = lifeSpan(p.y); if (!s || s.approx) return [];
  return THINKERS.filter((x) => { if (x.id === p.id) return false; const t = lifeSpan(x.y); return t && !t.approx && Math.min(s.b, t.b) - Math.max(s.a, t.a) >= 20; })
    .sort((x, y) => lifeSpan(x.y).a - lifeSpan(y.y).a).map((x) => x.id);
}
// Approximate birth year from the dates line, for listing thinkers in order ("c. 428–348 BCE", "8th c. CE", "b. 1929").
function birthYear(y) {
  const bce = /BCE/.test(y), cent = y.match(/(\d+)(?:st|nd|rd|th) c\./), n = y.match(/\d+/);
  if (cent) { const c = +cent[1]; return bce ? -(c * 100) + 10 : (c - 1) * 100 + 10; }
  if (n) return bce ? -n[0] : +n[0];
  return 1e4;
}
function thinkerRow(p) {
  const n = GLOSSARY.filter((g) => (g.p || []).includes(p.id)).length;
  return `<button class="thinkrow" data-thinker="${esc(p.id)}"><b>${esc(p.n)}</b><span class="ty">${esc(p.y)}</span><span class="td">${esc(p.d)}${n ? ` ${n} term${n === 1 ? "" : "s"}.` : ""}</span></button>`;
}
function glossaryView() {
  const terms = allTerms(), tmap = new Map(terms.map((g) => [g.id, g])), q = fold(S.gq.trim());
  const areas = ["all", ...Object.keys(AREAS).filter((a) => terms.some((g) => g.a === a))];
  if (!areas.includes(S.gArea)) S.gArea = "all";
  let body;
  {
    const who = q ? THINKERS.filter((p) => thinkerMatches(p, q)) : [], whoIds = new Set(who.map((p) => p.id));
    const list = terms.filter((g) => (S.gArea === "all" || g.a === S.gArea) && (!q || fold(g.t).includes(q) || fold(g.d).includes(q) || fold(g.x).includes(q) || (g.p || []).some((id) => whoIds.has(id))));
    body = `${who.length ? `<div class="tconn">${chipRow("Thinkers", thinkerChips(who.slice(0, 8).map((p) => p.id)))}</div>` : ""}
      <div class="gl-list">${list.map((g) => termHTML(g, tmap)).join("") || `<p class="empty">No terms match.</p>`}</div>`;
  }
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>
    <header class="gl-head"><div><h1>Glossary</h1><div class="sub">${terms.length} terms</div></div><div class="gl-acts">${lookedUp().length ? `<button class="btn" id="mywords">Your words</button>` : ""}<button class="btn" id="quiz">Quiz yourself</button><button class="btn primary" id="addterm">Add a term</button></div></header>
    <p class="hint">Reference definitions with their sources. Tap a thinker, tradition or related term to follow the connections. Each term also lists the passages in your notes that use it, and you can edit any entry or add your own.</p>
    <input class="search" id="gq" type="search" placeholder="Search terms, definitions and thinkers" value="${esc(S.gq)}" aria-label="Search the glossary">
    <div class="chips">${areas.map((a) => `<button class="chip ${S.gArea === a ? "on" : ""}" data-area="${a}">${a === "all" ? "All" : esc(AREAS[a])}</button>`).join("")}</div>
    ${body}`;
}
// Thinkers: everyone in the app's thinker entries, in order of birth or on a timeline; each opens their card.
function thinkersView() {
  const q = fold((S.pq || "").trim());
  const list = THINKERS.filter((p) => !q || thinkerMatches(p, q) || fold(p.d).includes(q) || p.w.some((w) => fold(w).includes(q)))
    .map((p, i) => [birthYear(p.y), i, p]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((e) => e[2]);
  const views = `<div class="chips"><button class="chip ${S.tl ? "" : "on"}" data-tl="0">In order of birth</button><button class="chip ${S.tl ? "on" : ""}" data-tl="1">Timeline</button></div>`;
  const body = !list.length ? `<p class="empty">No thinkers match.</p>` : S.tl
    ? `<p class="hint">Each bar is a life, on the scale of its period, so you can see who lived at the same time. Pale bars are approximate dates; a bar that fades runs to the present.</p>${timelineHTML(list)}`
    : `<p class="hint">In order of birth; the last few have no published birth year.</p><div class="gl-list">${list.map(thinkerRow).join("")}</div>`;
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>
    <header class="gl-head"><div><h1>Thinkers</h1><div class="sub">${THINKERS.length} philosophers and theorists</div></div><div class="gl-acts"><button class="btn" id="puzzles">Puzzles</button><button class="btn" id="quiz">Who wrote it?</button></div></header>
    <p class="hint">Tap a name for their key works, the glossary terms and traditions they belong to, who they drew on and who took them up, and who lived at the same time.</p>
    <input class="search" id="pq" type="search" placeholder="Search names, descriptions and works" value="${esc(S.pq || "")}" aria-label="Search the thinkers">
    ${views}
    ${body}`;
}
// Term of the day: one of the glossary's own entries a day, in an order shuffled once per round so every term comes up before any
// repeats. Worked out from the date, so nothing is stored and every device shows the same term.
const dayNumber = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
function termOfDay(day = dayNumber()) {
  const n = GLOSSARY.length; if (!n) return null;
  let seed = Math.floor(day / n) + 1;
  const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const order = [...GLOSSARY.keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  const base = GLOSSARY[order[day % n]];
  return allTerms().find((g) => g.id === base.id) || base; // your edit of it, if you made one
}
function todHTML() {
  const g = termOfDay(); if (!g) return "";
  return `<button class="refcard tod" data-term="${esc(g.id)}"><span class="tod-l">Term of the day<span>${esc(AREAS[g.a] || "")}</span></span><span class="rc-t">${esc(g.t)}</span><span class="rc-s">${esc(g.d)}</span><span class="rc-go" aria-hidden="true">›</span></button>`;
}
// The home screen's way into the reference sections: three buttons, each opening its whole contents as a list.
function referenceHome() {
  const card = (rk, title, sub) => `<button class="refcard" data-ref="${rk}"><span class="rc-t">${title}</span><span class="rc-s">${sub}</span><span class="rc-go" aria-hidden="true">›</span></button>`;
  return `<section class="home-sec">${todHTML()}<div class="refcards">
    ${card("glossary", "Glossary", `${allTerms().length} terms`)}
    ${card("branches", "Branches", `${BRANCHES.filter((b) => b.k === "branch").length} branches, ${BRANCHES.filter((b) => b.k === "tradition").length} traditions`)}
    ${card("thinkers", "Thinkers", `${THINKERS.length} philosophers and theorists`)}
  </div>${masteryCardHTML()}${typeof PATHS !== "undefined" && PATHS.length ? `<button class="refcard pathcard" id="openpaths"><span class="rc-t">Reading paths</span><span class="rc-s">${PATHS.length} routes through the classics on your shelf, chapter by chapter</span><span class="rc-go" aria-hidden="true">›</span></button>` : ""}${typeof DISPUTES !== "undefined" && DISPUTES.length ? `<button class="refcard pathcard" id="opendisputes"><span class="rc-t">Disputations</span><span class="rc-s">${DISPUTES.length} arguments to answer, then compare with the classic objection</span><span class="rc-go" aria-hidden="true">›</span></button>` : ""}</section>`;
}
// Everything in the three reference sections as one searchable list; each row opens its entry, and each group can open its
// full screen (the glossary's areas and quiz, a branch's questions and reading, the thinkers' timeline).
function referenceView() {
  const q = fold((S.rq || "").trim()), k = S.rk || "all";
  const cut = (x, n = 120) => { x = String(x || "").replace(/\s+/g, " ").trim(); return x.length > n ? x.slice(0, n - 1) + "…" : x; };
  const row = (attr, name, tag, line) => `<button class="refrow" ${attr}><span class="rr-n">${esc(name)}</span><span class="rr-t">${esc(tag)}</span><span class="rr-d">${esc(cut(line))}</span></button>`;
  const terms = allTerms().filter((g) => !q || fold(g.t).includes(q) || fold(g.d).includes(q));
  const branches = BRANCHES.filter((b) => !q || fold(b.n).includes(q) || fold(b.d).includes(q));
  const thinkers = THINKERS.filter((p) => !q || thinkerMatches(p, q) || fold(p.d).includes(q) || p.w.some((w) => fold(w).includes(q)))
    .map((p, i) => [birthYear(p.y), i, p]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((e) => e[2]);
  const eras = TL_ERAS.map(([name, lo, hi]) => [name, THINKERS.filter((p) => { const s = lifeSpan(p.y); return s && s.a >= lo && s.a < hi; }).length]).filter(([, n]) => n);
  // one group: its rows, with a button to its full screen; with All, each group under its own heading
  const group = (id, title, n, open, extra, rows) => (k !== "all" && k !== id) || (q && !n) ? "" : `<section class="refgroup">
    <div class="sec-head"><div>${k === "all" ? `<h2>${title}</h2>` : ""}<div class="sub">${n} ${{ glossary: n === 1 ? "term" : "terms", branches: n === 1 ? "branch or tradition" : "branches and traditions", thinkers: n === 1 ? "thinker" : "thinkers" }[id]}${q ? " matching" : ""}</div></div><button class="btn" id="${open}">${{ glossary: "Areas and your terms", branches: "Questions and reading", thinkers: "Timeline" }[id]}</button></div>
    ${extra}<div class="reflist">${rows || `<p class="empty">Nothing here yet.</p>`}</div></section>`;
  const chip = (id, label) => `<button class="chip ${k === id ? "on" : ""}" data-rk="${id}">${label}</button>`;
  const body = group("glossary", "Glossary", terms.length, "openglossary", "", terms.map((g) => row(`data-term="${esc(g.id)}"`, g.t, AREAS[g.a] || "Your term", g.d)).join(""))
    + group("branches", "Branches", branches.length, "openbranches", "", branches.map((b) => row(`data-branch="${esc(b.id)}"`, b.n, b.k === "branch" ? "Branch" : "Tradition", b.d)).join(""))
    + group("thinkers", "Thinkers", thinkers.length, "openthinkers", q ? "" : `<div class="label">On the timeline</div><div class="chips bchips">${eras.map(([name, n]) => `<button class="chip bchip" data-era="${esc(name)}">${esc(name)} <span class="cnt">${n}</span></button>`).join("")}</div>`,
      thinkers.map((p) => row(`data-thinker="${esc(p.id)}"`, p.n, p.y, p.d)).join(""));
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>
    <header class="gl-head"><div><h1>${{ all: "Glossary, branches and thinkers", glossary: "Glossary", branches: "Branches", thinkers: "Thinkers" }[k] || "Glossary"}</h1></div><div class="gl-acts"><button class="btn" id="quiz">${k === "thinkers" ? "Who wrote it?" : "Quiz yourself"}</button></div></header>
    <input class="search" id="rq" type="search" placeholder="${{ all: "Search terms, branches and thinkers", glossary: "Search terms and definitions", branches: "Search branches and traditions", thinkers: "Search names, descriptions and works" }[k] || "Search"}" value="${esc(S.rq || "")}" aria-label="Search the glossary, branches and thinkers">
    <div class="chips">${chip("all", "All")}${chip("glossary", "Glossary")}${chip("branches", "Branches")}${chip("thinkers", "Thinkers")}</div>
    ${body || `<p class="empty">Nothing matches.</p>`}`;
}
function openTerm(id) {
  earn("term", id, "met");
  go({ screen: "glossary", gs: { gOpen: [id], gq: "", gArea: "all" }, scrollTo: id });
}
// Thinkers whose names appear in a book's author field, so a book can link to its author's card.
function authorThinkers(author) {
  const a = fold(author); if (!a) return [];
  return THINKERS.filter((p) => {
    const full = fold(p.n.replace(/\s*\(.*?\)/g, ""));
    if (a.includes(full)) return true;
    const sn = fold(p.sn);
    return !/\s|\(/.test(sn) && sn.length > 3 && new RegExp(`(^|[^\\p{L}])${reEsc(sn)}($|[^\\p{L}])`, "u").test(a);
  });
}
// An entry's picture (img: { file, alt, cap, wide }): a public-domain file on Wikimedia Commons, loaded only when online
// and only once the entry is open. A picture that can't load removes its figure (the error listener below).
const COMMONS = "https://commons.wikimedia.org/wiki/";
function figHTML(im) {
  if (!im || !im.file) return "";
  const f = encodeURIComponent(im.file.replace(/ /g, "_"));
  return `<figure class="efig${im.wide ? " wide" : ""}"><img loading="lazy" decoding="async" src="${COMMONS}Special:FilePath/${f}?width=${im.wide ? 960 : 500}" alt="${esc(im.alt || "")}"><figcaption>${esc(im.cap || "")} <a href="${COMMONS}File:${f}" target="_blank" rel="noopener">Wikimedia Commons</a></figcaption></figure>`;
}
// A diagram drawn for a term (FIGURES in data/glossary.js): part of the app, so it shows offline and follows the theme.
function diaHTML(key) {
  const f = typeof FIGURES !== "undefined" && key && FIGURES[key];
  if (!f) return "";
  return `<figure class="efig dia"><div class="dsvg" role="img" aria-label="${esc(f.alt)}"><svg viewBox="0 0 320 ${f.h}" aria-hidden="true">${f.svg}</svg></div><figcaption>${esc(f.cap)}</figcaption></figure>`;
}
document.addEventListener("error", (e) => { const fig = e.target instanceof HTMLImageElement && e.target.closest(".efig"); if (fig) fig.remove(); }, true);
// A longer account as paragraphs (separated by a blank line).
const parasHTML =(x) => (x ? String(x).split(/\n\s*\n/).map((para) => para.trim()).filter(Boolean).map((para) => `<p class="tmore">${esc(para)}</p>`).join("") : "");
// An entry's sources (thinker, term or branch): the main one (src, srcName), then any further ones for particular claims (srcs: [{ src, srcName }]).
function thinkerSources(p) {
  const all = [p.src ? { src: p.src, srcName: p.srcName } : null, ...(Array.isArray(p.srcs) ? p.srcs : [])].filter((x) => x && x.src);
  if (!all.length) return "";
  const link = (x) => `<a href="${esc(x.src)}" target="_blank" rel="noopener">${esc(x.srcName || x.src)}</a>`;
  return all.length === 1 ? `<p class="tsrc">Source: ${link(all[0])}</p>` : `<div class="tsrc">Sources:<ul class="srclist">${all.map((x) => `<li>${link(x)}</li>`).join("")}</ul></div>`;
}
/* ---------- connections between thinkers (CONNECTIONS, in data/thinkers.js) ----------
   Each says what kind it is and rests on evidence: what the primary texts show (a reference into a bundled classic opens it there), then
   what scholarship argues, with its source. On both thinkers' cards, worded from each side. Nothing stored. */
const CONN_KINDS = { influence: ["Influenced by", "Influenced"], critique: ["Criticizes", "Criticized by"], reinterpretation: ["Reinterprets", "Reinterpreted by"] };
const connTo = (c) => (Array.isArray(c.to) ? c.to : [c.to]);
const connectionsOf = (id) => CONNECTIONS.filter((c) => c.from === id || connTo(c).includes(id));
function connectionsHTML(id) {
  const list = connectionsOf(id); if (!list.length) return "";
  const names = (ids) => ids.map((x) => THINKER.get(x)).filter(Boolean).map((p) => `<button class="linkbtn" data-thinker="${esc(p.id)}">${esc(p.sn)}</button>`).join(" and ");
  const one = (c) => {
    const mine = c.from === id, [fwd, back] = CONN_KINDS[c.kind] || [c.kind, c.kind];
    const head = mine ? `${fwd} ${names(connTo(c))}` : `${back} ${names([c.from])}`;
    const text = (c.text || []).map((t) => `<p><span class="ck">In the text</span> ${esc(t.says)}${t.ref ? ` ${passageLinks(esc(t.ref), t.style)}` : ""}${t.cite ? ` <span class="tsrc">(${esc(t.cite)})</span>` : ""}</p>`).join("");
    const reading = (c.reading || []).map((r) => `<p><span class="ck">Scholarship</span> ${esc(r.says)} <a href="${esc(r.src)}" target="_blank" rel="noopener" class="tsrc">${esc(r.srcName)}</a></p>`).join("");
    return `<div class="conn" data-conn-kind="${esc(c.kind)}"><div class="conn-h">${head}</div><p class="conn-c">${esc(c.claim)}</p>${text}${reading}</div>`;
  };
  return `<div class="crow"><span class="clabel">Connections</span><div class="conns">${list.map(one).join("")}</div></div>`;
}
function thinkerPanel(id) {
  const p = THINKER.get(id); if (!p) return;
  earn("thinker", id, "met"); earnConnectionsOf(id);
  const tmap = termMap();
  const terms = [...tmap.values()].filter((g) => (g.p || []).includes(id)).map((g) => g.id);
  const trad = BRANCHES.filter((b) => b.p.includes(id)).map((b) => b.id);
  const took = THINKERS.filter((x) => x.i.includes(id)).map((x) => x.id), steps = lineageSteps(id);
  const shelf = [...S.texts.entries()].filter(([, t]) => authorThinkers(t.author).some((x) => x.id === id));
  const needles = thinkerNeedles(p);
  openPanel(`<h2>${esc(p.n)}</h2>
    ${p.y || CAN_SAY ? `<div class="sayline">${p.y ? `<p class="hint">${esc(p.y)}</p>` : ""}${sayBtn(p.n, "linkbtn")}</div>` : ""}
    ${figHTML(p.img)}
    <p class="tdef">${esc(p.d)}</p>
    ${refParas(p.x, { kind: "thinker", id })}
    ${thinkerSources(p)}
    ${p.w.length ? `<div class="crow"><span class="clabel">Key works</span><ul class="bq-list">${p.w.map((w) => `<li>${classicLinks(w, id)}</li>`).join("")}</ul></div>` : ""}
    ${connectionsHTML(id)}
    <div class="tconn">
      ${chipRow("On your shelf", shelf.map(([tid, t]) => `<button class="chip" data-open="${esc(tid)}">${esc(t.title)}</button>`).join(""))}
      ${chipRow("Glossary terms", termChips(terms, tmap))}
      ${chipRow("Branches and traditions", branchChips(trad))}
      ${chipRow("Drew on", thinkerChips(p.i))}
      ${foldChips("Further back", steps.back)}
      ${chipRow("Taken up by", thinkerChips(took))}
      ${foldChips("Further on", steps.on)}
      ${chipRow("Lived at the same time", thinkerChips(contemporariesOf(p)))}
    </div>
    ${mentionsHTML(mentionsOf(needles, { kind: "thinker", id }))}
    ${termHitsHTML(thinkerNotes(needles))}`, (b) => {
    if (b.dataset.say) return sayIt(b.dataset.say);
    if (b.dataset.thinker) thinkerPanel(b.dataset.thinker);
    else if (b.dataset.term) openTerm(b.dataset.term);
    else if (b.dataset.branch) go({ screen: "branches", focus: b.dataset.branch, sec: b.dataset.bsec });
    else if (b.dataset.classic) openClassic(b.dataset.classic);
    else if (b.dataset.passage) openPassage(b.dataset.passage, b.dataset.passageAt);
    else if (b.dataset.gotoNote) go({ screen: "reader", textId: b.dataset.tid, at: +b.dataset.gotoNote, flash: true });
    else if (b.dataset.open) go({ screen: "text", textId: b.dataset.open });
  });
}
/* ---------- guess the thinker: one a day, from clues out of the thinker entries ----------
   Clues go from vague to telling: the period, a tradition, a glossary term, who they drew on or who took them up, a key work, the
   entry's own description (the name blanked out). Each wrong guess or Another clue shows the next. Today's game is kept in
   localStorage (mg-guess) so it survives closing the app; a new day starts afresh. No streaks, no scores kept. */
const GUESS_KEY = "mg-guess", GUESS_MAX = 6;
function guessPool() { return THINKERS.filter((p) => lifeSpan(p.y) && worksOf(p).length && (BRANCHES.some((b) => b.p.includes(p.id)) || GLOSSARY.some((g) => (g.p || []).includes(p.id)))); }
function guessOfDay(day = dayNumber()) {
  const pool = guessPool(), n = pool.length; if (!n) return null;
  let seed = Math.floor(day / n) + 7919;
  const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const order = [...pool.keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return pool[order[day % n]];
}
function guessClues(p) {
  const words = [...new Set([p.n, p.sn, ...p.n.replace(/\(.*?\)/g, " ").split(/\s+/)].filter((w) => w && w.length > 2))];
  const hide = (x) => String(x).replace(new RegExp(`(^|[^\\p{L}])(${words.map(reEsc).join("|")})(?![\\p{L}])`, "giu"), "$1___");
  const s = lifeSpan(p.y), era = TL_ERAS.find(([, lo, hi]) => s.a >= lo && s.a < hi), ancient = s.a < 1400;
  const trad = BRANCHES.filter((b) => b.p.includes(p.id)), terms = GLOSSARY.filter((g) => (g.p || []).includes(p.id));
  const took = THINKERS.filter((x) => x.i.includes(p.id)), drew = p.i.map((id) => THINKER.get(id)).filter(Boolean);
  const pickOne = (a, k) => a[(p.id.length * 7 + k) % a.length]; // the same clue every time for the same thinker
  const out = [`On the timeline: ${era ? era[0] : "undated"}${s.approx ? "" : `, born ${yearLabel(s.a, ancient)}`}.`];
  if (trad.length) out.push(`Listed in Branches under ${trad.slice(0, 2).map((b) => b.n).join(" and ")}.`);
  if (terms.length) out.push(`Listed in the glossary under “${hide(pickOne(terms, 1).t)}”.`);
  if (drew.length || took.length) out.push(drew.length ? `Drew on ${pickOne(drew, 2).n}.` : `Was taken up by ${pickOne(took, 2).n}.`);
  out.push(`Wrote ${hide(workTitle(pickOne(worksOf(p), 3)))}.`);
  out.push(hide(p.d));
  return out.slice(0, GUESS_MAX);
}
function guessState() {
  const day = dayNumber(); let st = null;
  try { st = JSON.parse(localStorage.getItem(GUESS_KEY) || "null"); } catch {}
  return st && st.day === day && Array.isArray(st.wrong) ? st : { day, shown: 1, wrong: [], done: "" };
}
function guessSave(st) { try { localStorage.setItem(GUESS_KEY, JSON.stringify(st)); } catch {} }
const guessFind = (v) => { const q = fold(v.trim()); return q ? THINKERS.find((p) => fold(p.n) === q || fold(p.sn) === q || fold(p.n.replace(/\s*\(.*?\)/g, "")) === q) : null; };
function guessResult(st, clues) {
  const date = new Date().toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  return `Marginalia · Guess the thinker · ${date}\n${st.done === "solved" ? `Got it with ${st.shown} of ${clues.length} clues${st.wrong.length ? ` and ${st.wrong.length} wrong guess${st.wrong.length === 1 ? "" : "es"}` : ""}.` : `Didn't get it in ${clues.length} clues.`}`;
}
function guessHTML() {
  const p = guessOfDay(); if (!p) return `<p class="hint">There aren't enough thinker entries for this yet.</p>`;
  const st = guessState(), clues = guessClues(p), over = !!st.done;
  const shown = clues.slice(0, over ? clues.length : st.shown);
  return `<ol class="gclues">${shown.map((c, k) => `<li${k === shown.length - 1 && !over ? ' class="new"' : ""}><span class="gk">${k + 1}</span>${esc(c)}</li>`).join("")}</ol>
    ${st.wrong.length ? `<p class="hint">Not ${st.wrong.map((id) => esc(THINKER.get(id)?.sn || id)).join(", not ")}.</p>` : ""}
    ${over ? `<div class="paperpanel gdone"><p class="qz-q">${st.done === "solved" ? "<b>Right:</b> " : "It was "}<b>${esc(p.n)}</b> <span class="hint">${esc(p.y)}</span></p>
        <div class="noteacts"><button class="btn primary" data-thinker="${esc(p.id)}">About ${esc(p.sn)}</button><button class="btn" data-keep="1" data-gshare="1">Share the result</button></div>
        <p class="hint">A new thinker tomorrow.</p></div>`
      : `<div class="field"><label for="g-in">Who is it?</label><input id="g-in" list="g-names" autocomplete="off" autocapitalize="words" placeholder="Type a name"><datalist id="g-names">${THINKERS.map((x) => `<option value="${esc(x.n)}">`).join("")}</datalist></div>
        <p class="tt-err" id="g-err" role="status"></p>
        <div class="noteacts"><button class="btn primary" data-keep="1" data-gtry="1">Guess</button>${st.shown < clues.length ? `<button class="btn" data-keep="1" data-gmore="1">Another clue</button>` : ""}<button class="btn ghost" data-keep="1" data-ggive="1">Show me</button></div>`}`;
}
function guessPanel() {
  openPanel(`<h2>Guess the thinker</h2><p class="hint">One thinker a day from the app's entries. Clues go from vague to telling; each wrong guess shows the next.</p><div id="gbox" style="display:grid;gap:12px">${guessHTML()}</div>`, async (b) => {
    const p = guessOfDay(), st = guessState(), clues = p ? guessClues(p) : [];
    const draw = () => { $("#gbox").innerHTML = guessHTML(); const i = $("#g-in"); if (i && b.dataset.gtry) i.focus(); };
    if (b.dataset.thinker) return thinkerPanel(b.dataset.thinker);
    if (!p) return;
    if (b.dataset.gtry) {
      const v = $("#g-in").value, who = guessFind(v);
      if (!who) { $("#g-err").textContent = v.trim() ? "That isn't one of the app's thinkers. Pick a name from the list." : "Type a name first."; return; }
      if (who.id === p.id) { st.done = "solved"; earn("thinker", p.id, "ans"); }
      else if (!st.wrong.includes(who.id)) { st.wrong.push(who.id); if (st.shown < clues.length) st.shown++; else st.done = "gave"; }
      guessSave(st); return draw();
    }
    if (b.dataset.gmore) { st.shown = Math.min(clues.length, st.shown + 1); guessSave(st); return draw(); }
    if (b.dataset.ggive) { st.done = "gave"; guessSave(st); return draw(); }
    if (b.dataset.gshare) {
      const text = guessResult(st, clues);
      try { if (navigator.share && matchMedia("(pointer: coarse)").matches) { await navigator.share({ text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
      toast((await copyText(text)) ? "Result copied." : "Couldn't copy the result.");
    }
  });
  $("#sheetroot .veil").addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "g-in") { e.preventDefault(); const g = $("#sheetroot [data-gtry]"); if (g) g.click(); } });
}
/* ---------- puzzles about the thinkers (Thinkers → Puzzles): nothing is stored ---------- */
function puzzlesMenu() {
  openPanel(`<h2>Puzzles</h2><p class="hint">Played on the app's own thinker entries: their dates, and who they drew on.</p>
    <div class="menu pzmenu">
      <button class="menuitem" id="pz-guess"><b>Guess the thinker</b><span>Today's thinker, from clues that get more telling</span></button>
      <button class="menuitem" id="pz-connect"><b>Connect two thinkers</b><span>From one to another through who took up whom</span></button>
      <button class="menuitem" id="pz-order"><b>Order of birth</b><span>Put five thinkers in the order they were born</span></button>
    </div>`, (b) => {
    if (b.id === "pz-guess") guessPanel();
    else if (b.id === "pz-connect") connectPanel();
    else if (b.id === "pz-order") orderPanel();
  });
}
// Who took each thinker up: the "drew on" lists read the other way. Built on first use.
let TOOK_MAP = null;
function tookMap() {
  if (TOOK_MAP) return TOOK_MAP;
  TOOK_MAP = new Map(THINKERS.map((p) => [p.id, []]));
  for (const p of THINKERS) for (const i of p.i) if (TOOK_MAP.has(i)) TOOK_MAP.get(i).push(p.id);
  return TOOK_MAP;
}
// Steps forward from a, along "taken up by": each reachable thinker's distance, and one way back to a.
function lineFrom(a) {
  const on = tookMap(), dist = new Map([[a, 0]]), prev = new Map(), q = [a];
  while (q.length) { const x = q.shift(); for (const y of on.get(x) || []) if (!dist.has(y)) { dist.set(y, dist.get(x) + 1); prev.set(y, x); q.push(y); } }
  return { dist, route: (b) => { if (!dist.has(b)) return null; const r = [b]; while (r[0] !== a) r.unshift(prev.get(r[0])); return r; } };
}
/* Connect two thinkers: from a start to a target that is k steps on, choosing at each step one of those who took up the current
   thinker. A few steps beyond the shortest are allowed; Hint marks a choice that still leads there in the fewest. */
const CN = { k: 3, a: "", b: "", chain: [], over: "", hint: "", shortest: 0 };
const CN_SLACK = 3;
function connectNew(k = CN.k) {
  const starts = shuffle(THINKERS.filter((p) => tookMap().get(p.id).length));
  for (const p of starts) {
    const { dist } = lineFrom(p.id), ends = [...dist].filter(([, d]) => d === k).map(([id]) => id);
    if (ends.length) { Object.assign(CN, { k, a: p.id, b: ends[Math.floor(Math.random() * ends.length)], chain: [p.id], over: "", hint: "", shortest: k }); return; }
  }
  Object.assign(CN, { k, a: "", b: "" });
}
const cnName = (id) => esc(THINKER.get(id)?.sn || THINKER.get(id)?.n || id);
function connectHTML() {
  if (!CN.a) return `<p class="hint">The thinker entries don't have a chain that long.</p>`;
  const cur = CN.chain[CN.chain.length - 1], steps = CN.chain.length - 1, left = CN.shortest + CN_SLACK - steps;
  const diff = `<div class="chips">${[2, 3, 4].map((k) => `<button class="chip ${CN.k === k ? "on" : ""}" data-keep="1" data-cnk="${k}">${k} steps</button>`).join("")}</div>`;
  const chain = `<ol class="cnchain">${CN.chain.map((id, i) => `<li class="${i === CN.chain.length - 1 ? "cur" : ""}">${cnName(id)}</li>`).join("")}${CN.over === "solved" ? "" : `<li class="goal">${cnName(CN.b)}</li>`}</ol>`;
  const head = `<p class="qz-q">From <b>${cnName(CN.a)}</b> to <b>${cnName(CN.b)}</b> <span class="hint">(${esc(THINKER.get(CN.b).y)})</span>, through who took up whom. The shortest way takes ${CN.shortest} steps.</p>`;
  if (CN.over) {
    const best = lineFrom(CN.a).route(CN.b);
    const said = CN.over === "solved"
      ? `<b>There in ${steps} step${steps === 1 ? "" : "s"}.</b> ${steps === CN.shortest ? "That's the shortest way." : `The shortest takes ${CN.shortest}.`}`
      : `<b class="bad">${CN.over === "gave" ? "Here's a way." : "Out of steps."}</b>`;
    return `${diff}${head}${chain}<p class="qz-say">${said}${CN.over !== "solved" || steps > CN.shortest ? ` One shortest route: ${best.map(cnName).join(" → ")}.` : ""}</p>
      <div class="noteacts"><button class="btn primary" data-keep="1" data-cnnew="1">Another</button><button class="btn" data-thinker="${esc(CN.b)}">About ${cnName(CN.b)}</button></div>`;
  }
  const next = [...tookMap().get(cur)].sort((x, y) => birthYear(THINKER.get(x).y) - birthYear(THINKER.get(y).y));
  const choices = next.length
    ? `<div class="label">Who took up ${cnName(cur)}?</div><div class="chips">${next.map((id) => `<button class="chip pchip${CN.hint === id ? " hinted" : ""}${CN.chain.includes(id) ? " used" : ""}" data-keep="1" data-cngo="${esc(id)}"${CN.chain.includes(id) ? " disabled" : ""}>${cnName(id)}</button>`).join("")}</div>`
    : `<p class="hint">No one in the app's entries took up ${cnName(cur)}. Step back and try another way.</p>`;
  return `${diff}${head}${chain}${choices}
    <p class="hint">${left} step${left === 1 ? "" : "s"} left.</p>
    <div class="noteacts">${steps ? `<button class="btn" data-keep="1" data-cnback="1">Step back</button>` : ""}${next.length ? `<button class="btn" data-keep="1" data-cnhint="1">Hint</button>` : ""}<button class="btn ghost" data-keep="1" data-cngive="1">Show a way</button></div>`;
}
function connectPanel() {
  connectNew();
  openPanel(`<h2>Connect two thinkers</h2><p class="hint">Each step goes to someone whose entry lists the one before among those they drew on.</p><div id="cnbox" style="display:grid;gap:12px">${connectHTML()}</div>`, (b) => {
    if (b.dataset.thinker) return thinkerPanel(b.dataset.thinker);
    const cur = () => CN.chain[CN.chain.length - 1];
    if (b.dataset.cnk) connectNew(+b.dataset.cnk);
    else if (b.dataset.cnnew) connectNew();
    else if (b.dataset.cngo && !CN.over) {
      const from = CN.chain[CN.chain.length - 1], to = b.dataset.cngo;
      CN.chain.push(to); CN.hint = "";
      for (const c of CONNECTIONS) if (c.from === to && connTo(c).includes(from)) earn("conn", connId(c), "ans"); // a step along a checked connection
      if (b.dataset.cngo === CN.b) CN.over = "solved";
      else if (CN.chain.length - 1 >= CN.shortest + CN_SLACK) CN.over = "out";
    } else if (b.dataset.cnback && CN.chain.length > 1) { CN.chain.pop(); CN.hint = ""; }
    else if (b.dataset.cnhint) { const r = lineFrom(cur()).route(CN.b); CN.hint = r && r[1] && !CN.chain.includes(r[1]) ? r[1] : ""; if (!CN.hint) toast(`${THINKER.get(CN.b).sn} can't be reached from here. Step back.`); }
    else if (b.dataset.cngive) CN.over = "gave";
    $("#cnbox").innerHTML = connectHTML();
  });
}
/* Order of birth: five thinkers with known birth years, at least ORDER_GAP years apart; tap them from earliest to latest. */
const OB = { ids: [], placed: [], checked: false, era: false };
const ORDER_GAP = 12;
function orderNew(era = OB.era) {
  const dated = THINKERS.filter((p) => { const s = lifeSpan(p.y); return s && !s.approx && !s.open; });
  for (let tries = 0; tries < 200; tries++) {
    let pool = dated;
    if (era) { const e = TL_ERAS[Math.floor(Math.random() * TL_ERAS.length)]; pool = dated.filter((p) => { const a = lifeSpan(p.y).a; return a >= e[1] && a < e[2]; }); }
    const pick = [];
    for (const p of shuffle(pool)) { const a = lifeSpan(p.y).a; if (pick.every((q) => Math.abs(lifeSpan(q.y).a - a) >= ORDER_GAP)) pick.push(p); if (pick.length === 5) break; }
    if (pick.length === 5) { Object.assign(OB, { ids: pick.map((p) => p.id), placed: [], checked: false, era }); return; }
  }
}
const obRight = () => [...OB.ids].sort((x, y) => lifeSpan(THINKER.get(x).y).a - lifeSpan(THINKER.get(y).y).a);
function orderHTML() {
  const mode = `<div class="chips"><button class="chip ${OB.era ? "" : "on"}" data-keep="1" data-obera="0">Across history</button><button class="chip ${OB.era ? "on" : ""}" data-keep="1" data-obera="1">Within one period</button></div>`;
  if (OB.ids.length < 5) return `${mode}<p class="hint">There aren't enough dated thinkers for this yet.</p>`;
  const right = obRight(), name = (id) => esc(THINKER.get(id).n);
  const placed = OB.placed.map((id, k) => {
    const ok = OB.checked && right[k] === id, born = lifeSpan(THINKER.get(id).y).a;
    return `<li class="${OB.checked ? (ok ? "ok" : "no") : ""}"><button class="obrow" data-keep="1" data-obout="${esc(id)}"${OB.checked ? " disabled" : ""}><span class="obk">${k + 1}</span><span>${name(id)}</span>${OB.checked ? `<span class="obyr">${esc(yearLabel(born, born < 1400))}${ok ? "" : ` · ${ordinal(right.indexOf(id) + 1)}`}</span>` : ""}</button></li>`;
  }).join("");
  const rest = OB.ids.filter((id) => !OB.placed.includes(id));
  if (!OB.checked) return `${mode}<p class="qz-q">Tap them in order of birth, earliest first.</p>
    ${OB.placed.length ? `<ol class="oblist">${placed}</ol><p class="hint">Tap a placed name to take it back.</p>` : ""}
    ${rest.length ? `<div class="obpick">${rest.map((id) => `<button class="qz-opt" data-keep="1" data-obin="${esc(id)}">${name(id)}<small>${esc(THINKER.get(id).d)}</small></button>`).join("")}</div>` : ""}
    <div class="noteacts">${rest.length ? "" : `<button class="btn primary" data-keep="1" data-obcheck="1">Check</button>`}<button class="btn ghost" data-keep="1" data-obnew="1">Five others</button></div>`;
  const n = OB.placed.filter((id, k) => right[k] === id).length;
  return `${mode}<p class="qz-say"><b>${n} of 5</b> in the right place${n === 5 ? ". All of them." : "; the number after a year is where it belongs."}</p>
    <ol class="oblist">${placed}</ol>
    ${termTimeHTML(OB.ids, "On one time scale")}
    <div class="noteacts"><button class="btn primary" data-keep="1" data-obnew="1">Five others</button></div>`;
}
const ordinal = (k) => ["1st", "2nd", "3rd", "4th", "5th"][k - 1] || `${k}th`;
function orderPanel() {
  orderNew();
  openPanel(`<h2>Order of birth</h2><div id="obbox" style="display:grid;gap:12px">${orderHTML()}</div>`, (b) => {
    if (b.dataset.thinker) return thinkerPanel(b.dataset.thinker);
    if (b.dataset.obera) orderNew(b.dataset.obera === "1");
    else if (b.dataset.obnew) orderNew();
    else if (b.dataset.obin && !OB.placed.includes(b.dataset.obin)) OB.placed.push(b.dataset.obin);
    else if (b.dataset.obout && !OB.checked) OB.placed = OB.placed.filter((x) => x !== b.dataset.obout);
    else if (b.dataset.obcheck && OB.placed.length === 5) OB.checked = true;
    $("#obbox").innerHTML = orderHTML();
  });
}
/* quiz: questions made from the glossary's own definitions and the thinkers' key works */
const QZ = { mode: "def", area: "all", qs: [], k: 0, picked: -1, right: 0, missed: [] };
const QZ_MODES = { def: "Name the term", term: "Pick the definition", work: "Who wrote it?", fallacy: "Name the fallacy", valid: "Valid or not?", missing: "Missing premise", words: "Words you looked up" };
// Fallacies easily mistaken for one another are never offered as each other's wrong answers.
const FAL_NEAR = [["straw-man", "irrelevant-conclusion"], ["ad-hominem", "genetic-fallacy"], ["post-hoc", "hasty-generalization"], ["begging", "many-questions"], ["appeal-authority", "ad-populum"], ["affirming-consequent", "denying-antecedent"]];
const falNear = (a, b) => FAL_NEAR.some((p) => p.includes(a) && p.includes(b));
// Valid or not: a small argument in letters, made at random and checked by the truth table; half valid, half not. Premises that
// can't all be true, and conclusions true in every row, are left out, since they make the question trivial or a trick.
/* ---------- how to reconstruct an argument: a guide, from the Logic branch; its steps also fold out in an Argument note ---------- */
const RECON_STEPS = [
  ["Find the conclusion", "Ask what the passage is trying to get you to accept. Words like therefore, so, hence, thus and it follows that often mark it, but not always, and a conclusion can come first or be left unstated."],
  ["Find the reasons", "Ask what is offered in support. Because, since, for, given that and as often mark a premise. Leave out what only repeats, illustrates or persuades: examples, rhetoric, asides."],
  ["Set it out in standard form", "Number the premises, one claim to each, as complete sentences, with the conclusion last. Say whether premises work together (each needed) or separately (each enough on its own)."],
  ["Supply what's left unsaid", "Most arguments rely on a premise nobody states (an enthymeme). Add the one the argument needs, choosing the most plausible version that makes it work, and mark it as yours, not the author's."],
  ["Keep each term to one sense", "If a key word shifts meaning between premises, the argument only seems to follow. Fix what each term means and use it the same way throughout."],
  ["Test the form", "Deductive: if every premise were true, could the conclusion still be false? If not, it is valid. Inductive: do the premises make the conclusion likely? Don't fault a strong inductive argument just for being invalid."],
  ["Test the premises", "A valid argument with true premises is sound. Find the weakest premise and ask what can be said for and against it; that is usually where to aim an objection."],
  ["Be charitable", "Reconstruct the strongest version the text supports, the one its author would accept as theirs. Refuting a weaker version proves nothing about the real one."],
];
const RECON_EXAMPLE = {
  text: "“We shouldn't trust this study. It was paid for by the company that makes the drug.”",
  first: [["The study was paid for by the drug's maker.", ""], ["Studies paid for by a product's maker can't be trusted.", "unstated"]], c1: "We shouldn't trust this study.",
  note: "Valid as set out, but the unstated premise is too strong: plenty of industry-funded studies are accurate, and rejecting a claim for its source alone is the genetic fallacy. A charitable reader weakens the premise and the conclusion with it:",
  second: [["The study was paid for by the drug's maker.", ""], ["Studies paid for by a product's maker are more likely to be biased in its favor.", "unstated"]], c2: "We should wait for independent studies before relying on this one.",
};
function reconSteps(short) {
  return `<ol class="recon">${RECON_STEPS.map(([h, x]) => `<li><b>${esc(h)}.</b>${short ? "" : ` ${esc(x)}`}</li>`).join("")}</ol>`;
}
function reconPanel() {
  const E = RECON_EXAMPLE, form = (ps, c) => `<span class="qz-arg">${ps.map(([x, tag], i) => `<span>${i + 1}. ${esc(x)}${tag ? ` <small>(${tag})</small>` : ""}</span>`).join("")}<span class="qz-c">∴ ${esc(c)}</span></span>`;
  openPanel(`<h2>How to reconstruct an argument</h2>
    <p class="hint">Putting an argument in your own words as numbered premises and a conclusion, so you can see exactly what it claims and test it.</p>
    ${reconSteps(false)}
    <div class="label">An example</div>
    <p class="tdef">${esc(E.text)}</p>${form(E.first, E.c1)}<p class="tdef">${esc(E.note)}</p>${form(E.second, E.c2)}
    <div class="noteacts"><button class="btn" data-truth="-1">Test a form in the truth table</button><button class="btn ghost" data-term="genetic-fallacy">The genetic fallacy</button></div>
    <div class="tsrc">Sources:<ul class="srclist"><li><a href="https://iep.utm.edu/argument/" target="_blank" rel="noopener">Internet Encyclopedia of Philosophy, “Argument” (Matthew McKeon)</a></li><li><a href="https://www.uwo.ca/philosophy/undergraduate/Jim-Pryors-Guidelines-and-Writing-a-Philosophy-Paper-2.pdf" target="_blank" rel="noopener">Jim Pryor, Guidelines on Writing a Philosophy Paper</a></li></ul></div>
    <p class="hint">To keep a reconstruction, save it as an Argument note on the passage, or start a draft from the “Reconstruct an argument” template.</p>`, (b) => {
    if (b.dataset.truth) return truthPanel();
    if (b.dataset.term) return openTerm(b.dataset.term);
  });
}
/* Put the steps in order: a chain of modus ponens (a fact, then conditionals each leading from the last), shuffled; tap them in
   the order a proof would use them. The order is unique, so it can be checked exactly. */
const ST = { prem: [], order: [], placed: [], checked: false, concl: "" };
function stepsNew() {
  const L = shuffle(["P", "Q", "R", "S", "T"]).slice(0, Math.random() < 0.5 ? 4 : 5).map((x) => (Math.random() < 0.3 ? "¬" + x : x));
  const order = [L[0], ...L.slice(1).map((x, i) => `${L[i]} → ${x}`)];
  Object.assign(ST, { order, prem: shuffle(order), placed: [], checked: false, concl: L[L.length - 1] });
  if (ST.prem.join() === order.join()) ST.prem.push(ST.prem.shift());
}
function stepsHTML() {
  const rest = ST.prem.filter((x) => !ST.placed.includes(x)), ok = ST.checked && ST.placed.join() === ST.order.join();
  const row = (x, k) => `<li class="${ST.checked ? (ST.order[k] === x ? "ok" : "no") : ""}"><button class="obrow" data-keep="1" data-stout="${esc(x)}"${ST.checked ? " disabled" : ""}><span class="obk">${k + 1}</span><span class="tt-ascii">${esc(x)}</span></button></li>`;
  if (!ST.checked) return `<p class="qz-q">Tap the premises in the order a proof of <b>${esc(ST.concl)}</b> would use them.</p>
    ${ST.placed.length ? `<ol class="oblist">${ST.placed.map(row).join("")}</ol>` : ""}
    ${rest.length ? `<div class="obpick">${rest.map((x) => `<button class="qz-opt tt-ascii" data-keep="1" data-stin="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : ""}
    <div class="noteacts">${rest.length ? "" : `<button class="btn primary" data-keep="1" data-stcheck="1">Check</button>`}<button class="btn ghost" data-keep="1" data-stnew="1">Another</button></div>`;
  let cur = ST.order[0];
  const proof = [`<li><span class="tt-ascii">${esc(cur)}</span><small>premise</small></li>`, ...ST.order.slice(1).map((c) => { const to = c.split(" → ")[1], line = `<li><span class="tt-ascii">${esc(to)}</span><small>from ${esc(cur)} and ${esc(c)}, by modus ponens</small></li>`; cur = to; return line; })];
  return `<p class="qz-say">${ok ? "<b>Right.</b> Each step's “if” is what the step before established." : `<b class="bad">Not this order.</b> Start from the plain fact, then use the conditional whose “if” it is, and so on.`}</p>
    <ol class="oblist">${ST.placed.map(row).join("")}</ol>
    <div class="label">The proof</div><ol class="stproof">${proof.join("")}</ol>
    <div class="noteacts"><button class="btn primary" data-keep="1" data-stnew="1">Another</button><button class="btn ghost" data-term="modus">Modus ponens in the glossary</button></div>`;
}
function stepsPanel() {
  stepsNew();
  openPanel(`<h2>Put the steps in order</h2><div id="stbox" style="display:grid;gap:12px">${stepsHTML()}</div>`, (b) => {
    if (b.dataset.term) return openTerm(b.dataset.term);
    if (b.dataset.stnew) stepsNew();
    else if (b.dataset.stin && !ST.placed.includes(b.dataset.stin)) ST.placed.push(b.dataset.stin);
    else if (b.dataset.stout && !ST.checked) ST.placed = ST.placed.filter((x) => x !== b.dataset.stout);
    else if (b.dataset.stcheck && ST.placed.length === ST.prem.length) ST.checked = true;
    $("#stbox").innerHTML = stepsHTML();
  });
}
// Missing premise: a valid argument with one premise taken out; four candidates, of which only the right one makes it valid again
// (the truth table checks each), and the rest alone don't already prove the conclusion.
function ttFlip(x) { return x.startsWith("¬") && !x.startsWith("¬(") ? x.slice(1) : /^[A-Z]$/.test(x) ? "¬" + x : `¬(${x})`; }
function missingQuestion() {
  const valid = (prem, c) => { const r = ttCheck(prem.join("\n"), c); return r.err === undefined && r.live > 0 && r.cx === 0; };
  for (let k = 0; k < 300; k++) {
    let v = validQuestion(); if (!v.ok) continue;
    const i = Math.floor(Math.random() * v.prem.length), right = v.prem[i], rest = v.prem.filter((_, j) => j !== i);
    if (valid(rest, v.concl)) continue; // the rest already prove it: any premise would do
    const letters = ttVars([...v.prem, v.concl].map(ttParse)), m = right.match(/^(¬?\w)\s*(→|∨|∧|↔)\s*(¬?\w)$/);
    const cands = [ttFlip(right), ...(m ? [`${m[3]} ${m[2]} ${m[1]}`, `${m[1]} ${m[2] === "→" ? "∨" : "→"} ${m[3]}`, `${ttFlip(m[1])} ${m[2]} ${m[3]}`, `${m[1]} ${m[2]} ${ttFlip(m[3])}`] : []),
      ...letters.flatMap((x) => [x, "¬" + x]), v.concl, ttFlip(v.concl)];
    const shown = (x) => ttShow(ttParse(x));
    const wrong = shuffle([...new Set(cands.map(shown))]).filter((x) => x !== shown(right) && x !== shown(v.concl) && ttCheck([...rest, x].join("\n"), v.concl).cx > 0).slice(0, 3); // each wrong one has a real counterexample
    if (wrong.length < 3) continue;
    const opts = shuffle([shown(right), ...wrong]);
    return { rest: rest.map(shown), concl: shown(v.concl), opts, answer: opts.indexOf(shown(right)) };
  }
  return { rest: ["P → Q"], concl: "Q", opts: ["P", "Q", "¬P", "Q → P"], answer: 0 };
}
function validQuestion() {
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const lit = (v) => (Math.random() < 0.3 ? "¬" + v : v);
  const two = (a, b) => pick([`${lit(a)} → ${lit(b)}`, `${lit(a)} ∨ ${lit(b)}`, `${lit(a)} ∧ ${lit(b)}`, `${a} ↔ ${b}`, `¬(${a} ∧ ${b})`]);
  const want = Math.random() < 0.5;
  for (let k = 0; k < 400; k++) {
    const L = shuffle(["P", "Q", "R"]).slice(0, Math.random() < 0.6 ? 2 : 3), [a, b] = L, c = L[2] || pick(L);
    const prem = [two(a, b), pick([lit(a), lit(b), two(b, c)])];
    const concl = pick([lit(pick(L)), two(a, c)]);
    if (prem.includes(concl) || prem[0] === prem[1]) continue;
    const r = ttCheck(prem.join("\n"), concl);
    if (r.err !== undefined || !r.live || r.rows.every((x) => x.cv) || (r.cx === 0) !== want) continue;
    return { prem, concl, ok: want, res: r };
  }
  return { prem: ["P → Q", "P"], concl: "Q", ok: true, res: ttCheck("P → Q\nP", "Q") };
}
const quizModes = () => Object.entries(QZ_MODES).filter(([m]) => (QZ.set ? m === "def" || m === "term" : m !== "words" || lookedUp().length >= 4));
// A term in a quiz links to the glossary only if it's there (a shared set can bring terms of its own).
const quizTermLink = (g, cls) => (allTerms().some((x) => x.id === g.id) ? `<button class="${cls}" data-term="${esc(g.id)}">${cls === "linkbtn" ? esc(g.t) : "Open in the glossary"}</button>` : cls === "linkbtn" ? esc(g.t) : "");
const argModes = new Set(["fallacy", "valid", "missing"]);
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
// A definition with the term's own words blanked out, so it doesn't give the answer away.
function maskTerm(g) {
  const words = [...termKeys(g), ...g.t.replace(/\(.*?\)/g, " ").split(/[\s\-–—/]+/).filter((w) => w.length >= 5)];
  if (!words.length) return g.d;
  const re = new RegExp(`(^|[^\\p{L}])(${words.map(reEsc).join("|")})(s|es)?(?![\\p{L}])`, "giu");
  return g.d.replace(re, "$1___");
}
const workTitle = (w) => { const y = w.match(/\((?:c\. )?(\d{3,4})/); return w.replace(/\s*\(.*$/, "").trim() + (y ? ` (${y[1]})` : ""); };
// Works a thinker wrote, leaving out entries that name another author ("Plato, Apology" under Socrates).
function worksOf(p) {
  return p.w.filter((w) => { const pre = w.split(",")[0].trim(); return !(w.includes(",") && THINKERS.some((x) => x.id !== p.id && (x.sn === pre || x.n === pre))); });
}
function quizQuestions(mode, area) {
  if (mode === "fallacy") {
    const fal = allTerms().filter((g) => g.fal && (g.ex || []).length);
    if (fal.length < 4) return [];
    const items = shuffle(fal.flatMap((g) => g.ex.map((x) => ({ g, x })))).slice(0, 10);
    return items.map(({ g, x }) => {
      const opts = shuffle([g, ...shuffle(fal.filter((y) => y.id !== g.id && !falNear(y.id, g.id))).slice(0, 3)]);
      return { prompt: `Which fallacy is this? <i>${esc(x)}</i>`, opts: opts.map((y) => esc(y.t)), answer: opts.indexOf(g), g };
    });
  }
  if (mode === "missing") return Array.from({ length: 10 }, () => {
    const m = missingQuestion();
    return { prompt: `Which premise makes this valid?<span class="qz-arg">${m.rest.map((x) => `<span>${esc(x)}</span>`).join("")}<span class="qz-gap">?</span><span class="qz-c">∴ ${esc(m.concl)}</span></span>`, opts: m.opts.map(esc), answer: m.answer, m };
  });
  if (mode === "valid") return Array.from({ length: 10 }, () => {
    const v = validQuestion();
    return { prompt: `Is this argument valid?<span class="qz-arg">${v.prem.map((x) => `<span>${esc(x)}</span>`).join("")}<span class="qz-c">∴ ${esc(v.concl)}</span></span>`, opts: ["Valid", "Not valid"], answer: v.ok ? 0 : 1, v };
  });
  if (mode === "words") {
    const all = lookedUp(); if (all.length < 4) return [];
    return shuffle(all).slice(0, 10).map((x) => {
      const stem = x.word.length > 5 ? x.word.slice(0, x.word.length - 2) : x.word;
      const prompt = x.sense.replace(new RegExp(`(^|[^\\p{L}])${reEsc(stem)}\\p{L}*`, "giu"), "$1___");
      const opts = shuffle([x, ...shuffle(all.filter((y) => y.word !== x.word)).slice(0, 3)]);
      return { prompt: `Which word means: <i>${esc(prompt)}</i>`, opts: opts.map((y) => esc(y.word)), answer: opts.indexOf(x), wd: x };
    });
  }
  if (mode === "work") {
    const all = THINKERS.flatMap((p) => worksOf(p).map((w) => ({ p, w })));
    return shuffle(all).slice(0, 10).map(({ p, w }) => {
      const title = w.replace(/\s*\(.*$/, "").trim().toLowerCase();
      // anyone else listed with the same work (co-authors) or named in it can't be a wrong answer
      const also = new Set(THINKERS.filter((x) => x.w.some((v) => v.replace(/\s*\(.*$/, "").trim().toLowerCase() === title) || w.includes(x.sn)).map((x) => x.id));
      const by = birthYear(p.y), near = THINKERS.filter((x) => !also.has(x.id)).sort((a, b) => Math.abs(birthYear(a.y) - by) - Math.abs(birthYear(b.y) - by)).slice(0, 8);
      const opts = shuffle([p, ...shuffle(near).slice(0, 3)]);
      return { prompt: `Who wrote <b>${esc(workTitle(w))}</b>?`, opts: opts.map((x) => esc(x.n)), answer: opts.indexOf(p), p };
    });
  }
  const terms = allTerms().filter((g) => g.d && g.d.length > 20), pool = QZ.set ? QZ.set.terms : area !== "all" && area !== "thinkers" ? terms.filter((g) => g.a === area) : terms;
  return shuffle(pool).slice(0, 10).map((g) => {
    const inSet = QZ.set && QZ.set.terms.length >= 4 ? QZ.set.terms.filter((x) => x.id !== g.id) : null; // a set's own terms are each other's wrong answers
    const same = terms.filter((x) => x.id !== g.id && x.a === g.a), others = inSet || (same.length >= 3 ? same : terms.filter((x) => x.id !== g.id));
    const opts = shuffle([g, ...shuffle(others).slice(0, 3)]);
    return mode === "def"
      ? { prompt: esc(maskTerm(g)), opts: opts.map((x) => esc(x.t)), answer: opts.indexOf(g), g }
      : { prompt: `What is <b>${esc(g.t)}</b>?`, opts: opts.map((x) => esc(x.d.length > 220 ? x.d.slice(0, 219) + "…" : x.d)), answer: opts.indexOf(g), g };
  });
}
function quizStart(mode, area) {
  Object.assign(QZ, { mode, area, qs: quizQuestions(mode, area), k: 0, picked: -1, right: 0, missed: [] });
}
function quizHTML() {
  const modes = `<div class="chips">${quizModes().map(([m, label]) => `<button class="chip ${QZ.mode === m ? "on" : ""}" data-keep="1" data-qzmode="${m}">${label}</button>`).join("")}</div>`;
  const from = QZ.set ? `the set “${esc(QZ.set.title)}”` : QZ.mode === "missing" ? "arguments made at random" : QZ.mode === "fallacy" ? "the fallacies in the glossary" : QZ.mode === "valid" ? "arguments made at random" : QZ.mode === "words" ? "words you looked up" : QZ.mode === "work" ? "the thinkers' key works" : QZ.area !== "all" && AREAS[QZ.area] ? `terms in ${esc(AREAS[QZ.area])}` : "the whole glossary";
  if (QZ.qs.length < 4) return `${modes}<p class="hint">There aren't enough entries here for a quiz yet.</p>`;
  if (QZ.k >= QZ.qs.length) {
    const n = QZ.qs.length;
    return `${modes}<p class="qz-q"><b>${QZ.right} of ${n}</b> right.</p>
      ${QZ.missed.length ? `<div class="crow"><span class="clabel">To look at again</span><ul class="qz-missed">${QZ.missed.map((q) => q.m ? `<li>${esc(q.m.rest.join("; "))}; <b>${esc(q.m.opts[q.answer])}</b> ∴ ${esc(q.m.concl)}</li>` : q.v ? `<li>${esc(q.v.prem.join("; "))} ∴ ${esc(q.v.concl)}: ${q.v.ok ? "valid" : "not valid"}</li>` : q.wd ? `<li><b>${esc(q.wd.word)}</b>: ${esc(q.wd.sense)}</li>` : q.g ? `<li>${quizTermLink(q.g, "linkbtn")}</li>` : `<li><button class="linkbtn" data-thinker="${esc(q.p.id)}">${esc(q.p.n)}</button></li>`).join("")}</ul></div>` : `<p class="hint">Every one right.</p>`}
      <div class="noteacts"><button class="btn primary" data-keep="1" data-qzagain="1">Another ten</button></div>`;
  }
  const q = QZ.qs[QZ.k], done = QZ.picked >= 0;
  const cls = (i) => (!done ? "" : i === q.answer ? " right" : i === QZ.picked ? " wrong" : " dim");
  const next = `<button class="btn primary" data-keep="1" data-qznext="1">${QZ.k + 1 < QZ.qs.length ? "Next" : "See the score"}</button>`;
  const cxRow = (v) => { const x = v.res.rows.find((r) => r.cx); return x ? v.res.vars.map((k) => `${k} ${x.env[k] ? "true" : "false"}`).join(", ") : ""; };
  const say = !done ? "" : q.m
    ? `<p class="qz-say">${QZ.picked === q.answer ? "<b>Right.</b>" : `<b class="bad">Not this time.</b>`} With <b>${esc(q.m.opts[q.answer])}</b>, no row makes every premise true and the conclusion false.${QZ.picked !== q.answer ? ` With ${esc(q.m.opts[QZ.picked])} there is such a row.` : ""}</p>
       <div class="noteacts">${next}<button class="btn ghost" data-keep="1" data-qzmt="1">See it in a truth table</button></div>`
    : q.v
    ? `<p class="qz-say">${QZ.picked === q.answer ? "<b>Right.</b>" : `<b class="bad">Not this time.</b>`} ${q.v.ok ? "It's valid: no row of its truth table makes every premise true and the conclusion false." : `It's not valid: with ${cxRow(q.v)}, every premise is true and the conclusion false.`}</p>
       <div class="noteacts">${next}<button class="btn ghost" data-keep="1" data-qztt="1">See its truth table</button></div>`
    : q.wd
    ? `<p class="qz-say">${QZ.picked === q.answer ? "<b>Right.</b>" : `<b class="bad">Not this time.</b>`} <b>${esc(q.wd.word)}</b> (${esc(q.wd.pos)}): ${esc(q.wd.sense)}</p><div class="noteacts">${next}</div>`
    : q.g
    ? `<p class="qz-say">${QZ.picked === q.answer ? "<b>Right.</b>" : `<b class="bad">Not this time.</b>`} <b>${esc(q.g.t)}</b>: ${esc(q.g.d)}</p>
       <div class="noteacts"><button class="btn primary" data-keep="1" data-qznext="1">${QZ.k + 1 < QZ.qs.length ? "Next" : "See the score"}</button>${quizTermLink(q.g, "btn ghost")}</div>`
    : `<p class="qz-say">${QZ.picked === q.answer ? "<b>Right.</b>" : `<b class="bad">Not this time.</b>`} <b>${esc(q.p.n)}</b> (${esc(q.p.y)}): ${esc(q.p.d)}</p>
       <div class="noteacts"><button class="btn primary" data-keep="1" data-qznext="1">${QZ.k + 1 < QZ.qs.length ? "Next" : "See the score"}</button><button class="btn ghost" data-thinker="${esc(q.p.id)}">About ${esc(q.p.sn || q.p.n)}</button></div>`;
  return `${modes}
    <div class="qz-bar"><span>Question ${QZ.k + 1} of ${QZ.qs.length}, from ${from}</span><span>${QZ.right} right</span></div>
    <p class="qz-q">${q.prompt}</p>
    <div class="qz-opts">${q.opts.map((o, i) => `<button class="qz-opt${cls(i)}" data-keep="1" data-qzans="${i}"${done ? " disabled" : ""}>${o}</button>`).join("")}</div>
    ${say}`;
}
function quizPanel(area, set) {
  QZ.set = set || null;
  quizStart(area === "words" || argModes.has(area) ? area : area === "thinkers" ? "work" : "def", area === "words" || argModes.has(area) ? "all" : area || "all");
  openPanel(`<h2>${set ? esc(set.title) : "Quiz yourself"}</h2>${set ? `<p class="hint">A quiz set shared with you: ${set.terms.length} terms.</p>` : ""}<div id="quizbox" style="display:grid;gap:14px">${quizHTML()}</div>
    ${set || argModes.has(area) || area === "words" || area === "thinkers" ? "" : `<button class="btn ghost" data-mkset="1" style="justify-self:start;padding-left:0">Make a quiz set to share</button>`}`, (b) => {
    if (b.dataset.mkset) return setMaker();
    const box = $("#quizbox");
    if (b.dataset.qzans !== undefined && QZ.picked < 0) {
      QZ.picked = +b.dataset.qzans; const q = QZ.qs[QZ.k];
      if (QZ.picked === q.answer) { QZ.right++; if (q.g && q.g.builtIn && !q.g.edited) earn("term", q.g.id, "ans"); else if (q.p) earn("thinker", q.p.id, "ans"); } else QZ.missed.push(q);
    } else if (b.dataset.qznext) { QZ.k++; QZ.picked = -1; }
    else if (b.dataset.qzmode) quizStart(b.dataset.qzmode, QZ.area);
    else if (b.dataset.qzagain) quizStart(QZ.mode, QZ.area);
    else if (b.dataset.qzmt) { const m = QZ.qs[QZ.k].m; return truthPanel({ prem: [...m.rest, m.opts[QZ.picked]].join("\n"), concl: m.concl }); }
    else if (b.dataset.qztt) { const v = QZ.qs[QZ.k].v; return truthPanel({ prem: v.prem.join("\n"), concl: v.concl }); }
    else if (b.dataset.term) return openTerm(b.dataset.term);
    else if (b.dataset.thinker) return thinkerPanel(b.dataset.thinker);
    if (box) { box.innerHTML = quizHTML(); const sh = box.closest(".sheet"); if (sh && (b.dataset.qznext || b.dataset.qzmode || b.dataset.qzagain)) sh.scrollTop = 0; }
  });
}
/* ---------- quiz sets to share: chosen glossary terms in a link; whoever opens it gets a quiz on them. Nothing is stored. ----------
   The link holds { v, t: title, ids: built-in term ids, own: [[term, definition]] for terms you added or edited }, as base64url JSON. */
const SET_LIMITS = { title: 120, ids: 300, own: 30, t: 120, d: 500 };
const b64u = (str) => btoa(String.fromCharCode(...new TextEncoder().encode(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (x) => new TextDecoder().decode(Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0)));
const appURL = () => location.origin + location.pathname;
function setLink(title, terms) {
  const ids = terms.filter((g) => g.builtIn && !g.edited).map((g) => g.id), own = terms.filter((g) => !g.builtIn || g.edited).map((g) => [g.t, g.d]);
  return `${appURL()}#set=${b64u(JSON.stringify({ v: 1, t: title, ids, own }))}`;
}
// A set from a link, checked: only real glossary ids, strings of sane length; null if the link is damaged.
function readSet(code) {
  let o; try { o = JSON.parse(unb64u(code)); } catch { return null; }
  if (!o || typeof o !== "object" || o.v !== 1) return null;
  const str = (x, n) => typeof x === "string" && x.trim() && x.length <= n;
  const ids = Array.isArray(o.ids) ? o.ids.slice(0, SET_LIMITS.ids).filter((x) => typeof x === "string") : [];
  const own = Array.isArray(o.own) ? o.own.slice(0, SET_LIMITS.own).filter((x) => Array.isArray(x) && str(x[0], SET_LIMITS.t) && str(x[1], SET_LIMITS.d)) : [];
  const byId = new Map(GLOSSARY.map((g) => [g.id, g]));
  const terms = [...ids.filter((id) => byId.has(id)).map((id) => ({ ...byId.get(id), builtIn: true })), ...own.map(([t, d], k) => ({ id: `~set${k}`, t, d, a: "mine" }))];
  return terms.length >= 4 ? { title: str(o.t, SET_LIMITS.title) ? o.t.trim() : "A quiz set", terms } : null;
}
async function shareLink(url, title) {
  try { if (navigator.share && matchMedia("(pointer: coarse)").matches) { await navigator.share({ title, url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
  toast((await copyText(url)) ? "Link copied." : "Couldn't copy the link.");
}
const MK = { title: "", q: "", picked: new Set() };
function setMaker() {
  const terms = () => allTerms().filter((g) => g.d), q = () => fold(MK.q.trim());
  const shown = () => terms().filter((g) => !q() || fold(g.t).includes(q()) || fold(AREAS[g.a] || "").includes(q()) || termBranches(g).some((b) => fold(BRANCH.get(b).n).includes(q())));
  const list = () => `<div class="mkcount">${MK.picked.size} chosen${MK.picked.size && MK.picked.size < 4 ? " (a quiz needs at least four)" : ""}</div>
    <div class="mklist">${shown().slice(0, 80).map((g) => `<label class="mkrow"><input type="checkbox" data-mk="${esc(g.id)}"${MK.picked.has(g.id) ? " checked" : ""}><span><b>${esc(g.t)}</b><small>${esc(AREAS[g.a] || "")}</small></span></label>`).join("")}${shown().length > 80 ? `<p class="hint">${shown().length - 80} more; search to narrow it.</p>` : ""}</div>`;
  openPanel(`<h2>Make a quiz set</h2>
    <p class="hint">Choose glossary terms and get a link. Whoever opens it in Marginalia gets a quiz on just those terms: for a class, a reading group, or yourself. The link holds the whole set, so nothing is saved here.</p>
    <div class="field"><label for="mk-t">Title</label><input id="mk-t" value="${esc(MK.title)}" placeholder="e.g. Week 3: Kant's ethics" autocomplete="off"></div>
    <input class="search" id="mk-q" type="search" placeholder="Search terms, areas or branches" value="${esc(MK.q)}" aria-label="Search the terms">
    <div class="noteacts"><button class="btn" data-keep="1" data-mkall="1">Choose all shown</button><button class="btn ghost" data-keep="1" data-mkclear="1">Clear</button></div>
    <div id="mkbox">${list()}</div>
    <div class="noteacts"><button class="btn primary" data-keep="1" data-mklink="1">Make the link</button></div>
    <div id="mkout"></div>`, (b) => {
    if (b.dataset.mkall) shown().forEach((g) => MK.picked.add(g.id));
    else if (b.dataset.mkclear) MK.picked.clear();
    else if (b.dataset.mklink) {
      const chosen = terms().filter((g) => MK.picked.has(g.id));
      if (chosen.length < 4) { $("#mkout").innerHTML = `<p class="tt-err">Choose at least four terms.</p>`; return; }
      const url = setLink(MK.title.trim() || "A quiz set", chosen);
      $("#mkout").innerHTML = `<div class="field"><label for="mk-link">The link</label><input id="mk-link" readonly value="${esc(url)}"></div><div class="noteacts"><button class="btn" data-keep="1" data-mkshare="1">Share or copy</button></div>`;
      return;
    } else if (b.dataset.mkshare) return shareLink($("#mk-link").value, MK.title.trim() || "A quiz set");
    $("#mkbox").innerHTML = list();
  });
  const veil = $("#sheetroot .veil");
  veil.addEventListener("input", (e) => { if (e.target.id === "mk-t") MK.title = e.target.value; else if (e.target.id === "mk-q") { MK.q = e.target.value; $("#mkbox").innerHTML = list(); } });
  veil.addEventListener("change", (e) => { const id = e.target.dataset && e.target.dataset.mk; if (!id) return; if (e.target.checked) MK.picked.add(id); else MK.picked.delete(id); $("#mkbox .mkcount").outerHTML = list().match(/^<div class="mkcount">.*?<\/div>/)[0]; });
}
// A link opened in the app: #set=… starts that quiz, #path=… opens that reading path. The address is cleaned up afterwards.
function openFromHash() {
  const h = location.hash; if (!h || h.length < 3) return;
  try { history.replaceState(history.state, "", location.pathname + location.search); } catch {}
  if (h.startsWith("#set=")) { const set = readSet(h.slice(5)); return set ? quizPanel("all", set) : toast("This quiz set link is damaged or incomplete."); }
  if (h.startsWith("#path=")) { const id = decodeURIComponent(h.slice(6)); if (typeof PATHS !== "undefined" && PATHS.some((P) => P.id === id)) return go({ screen: "paths", path: id }); }
}
window.addEventListener("hashchange", openFromHash);
/* ---------- truth tables: is an argument in propositional logic valid? ----------
   Letters stand for sentences; the connectives are ¬ ∧ ∨ → ↔, also typed as ~ & | -> <-> or the words not, and, or, implies, iff
   ("v" between letters is or). Binding, tightest first: ¬, ∧, ∨, →, ↔; → groups to the right. Nothing is stored. */
const TT = { prem: "", concl: "", field: "tt-p" };
const TT_MAX = 6; // 64 rows: about as many as a phone can show
const TT_PREC = { "↔": 1, "→": 2, "∨": 3, "∧": 4 };
// name, premises, conclusion, and the glossary entry about it, if there is one
const TT_EXAMPLES = [
  ["Modus ponens", "P → Q\nP", "Q", "modus"], ["Modus tollens", "P → Q\n¬Q", "¬P", "modus"], ["Disjunctive syllogism", "P ∨ Q\n¬P", "Q"],
  ["Hypothetical syllogism", "P → Q\nQ → R", "P → R"], ["Affirming the consequent", "P → Q\nQ", "P", "affirming-consequent"], ["Denying the antecedent", "P → Q\n¬P", "¬Q", "denying-antecedent"],
];
// Which example an argument is, written any way (letters, symbols or words), so its glossary entry can be offered.
function ttExampleOf(prem, concl) {
  const shape = (p, c) => { try { return JSON.stringify([p.split(/\n|;/).map((x) => x.trim()).filter(Boolean).map((x) => ttShow(ttParse(x))), ttShow(ttParse(c))]).toUpperCase(); } catch { return null; } }; // p and P read alike here
  const mine = shape(prem, concl);
  return mine ? TT_EXAMPLES.find(([, p, c]) => shape(p, c) === mine) || null : null;
}
function ttLex(s) {
  const ops = [["<->", "↔"], ["<=>", "↔"], ["->", "→"], ["=>", "→"], ["↔", "↔"], ["≡", "↔"], ["→", "→"], ["⊃", "→"], ["∧", "∧"], ["&", "∧"], ["^", "∧"], ["·", "∧"],
    ["∨", "∨"], ["|", "∨"], ["¬", "¬"], ["~", "¬"], ["!", "¬"], ["-", "¬"], ["(", "("], [")", ")"], ["[", "("], ["]", ")"]];
  const words = { not: "¬", and: "∧", or: "∨", implies: "→", iff: "↔" };
  const out = []; let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) { i++; continue; }
    const op = ops.find(([k]) => s.startsWith(k, i));
    if (op) { out.push({ op: op[1] }); i += op[0].length; continue; }
    const w = s.slice(i).match(/^\p{L}+/u);
    if (!w) throw new Error(`“${s[i]}” isn't a connective. Use ¬ ∧ ∨ → ↔ and brackets.`);
    const lw = w[0].toLowerCase();
    if (words[lw]) { out.push({ op: words[lw] }); i += w[0].length; continue; }
    if (w[0] === "v") { out.push({ op: "∨" }); i++; continue; }
    if (w[0].length > 1) throw new Error(`“${w[0]}” isn't one sentence letter. Use a single letter (P, Q, R) for each sentence.`);
    const sub = s.slice(i + 1).match(/^[0-9′']*/)[0];
    out.push({ v: w[0] + sub }); i += 1 + sub.length;
  }
  return out;
}
function ttParse(src) {
  const toks = ttLex(src); let k = 0;
  if (!toks.length) throw new Error("Empty.");
  const peek = () => toks[k] && toks[k].op, take = () => toks[k++];
  const bin = (next, op) => () => { let a = next(); while (peek() === op) { take(); a = { op, a, b: next() }; } return a; };
  const atom = () => {
    const t = take();
    if (!t) throw new Error("It ends too soon: a sentence letter or a bracket is missing.");
    if (t.v) return { v: t.v };
    if (t.op === "¬") return { op: "¬", a: atom() };
    if (t.op === "(") { const e = iff(); if (peek() !== ")") throw new Error("A bracket is opened and never closed."); take(); return e; }
    throw new Error(t.op === ")" ? "A closing bracket has no opening one." : `${t.op} needs a sentence on its left.`);
  };
  const and = bin(atom, "∧"), or = bin(and, "∨");
  const imp = () => { const a = or(); if (peek() === "→") { take(); return { op: "→", a, b: imp() }; } return a; };
  const iff = bin(imp, "↔");
  const e = iff();
  if (k < toks.length) throw new Error(toks[k].op === ")" ? "A closing bracket has no opening one." : `Something is missing before ${toks[k].op || toks[k].v}: a connective between two sentences?`);
  return e;
}
function ttVal(n, env) {
  if (n.v) return env[n.v];
  const a = ttVal(n.a, env);
  if (n.op === "¬") return !a;
  const b = ttVal(n.b, env);
  return n.op === "∧" ? a && b : n.op === "∨" ? a || b : n.op === "→" ? !a || b : a === b;
}
// A formula written out again with the app's symbols and only the brackets it needs.
function ttShow(n, outer = 0) {
  if (n.v) return n.v;
  if (n.op === "¬") return "¬" + ttShow(n.a, 9);
  const p = TT_PREC[n.op], s = `${ttShow(n.a, n.op === "→" ? p + 0.5 : p)} ${n.op} ${ttShow(n.b, n.op === "→" ? p : p + 0.5)}`;
  return p < outer ? `(${s})` : s;
}
function ttVars(nodes) {
  const seen = new Set(), walk = (n) => { if (n.v) seen.add(n.v); else { walk(n.a); if (n.b) walk(n.b); } };
  nodes.forEach(walk);
  return [...seen].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}
// Every row of the table, the rows that make each premise true, and the counterexamples among them.
function ttCheck(premText, conclText) {
  const lines = premText.split(/\n|;/).map((x) => x.trim()).filter(Boolean);
  const prem = [];
  for (const [k, x] of lines.entries()) { try { prem.push(ttParse(x)); } catch (e) { return { err: `Premise ${k + 1}: ${e.message}` }; } }
  if (!conclText.trim()) return { err: "" };
  let concl; try { concl = ttParse(conclText); } catch (e) { return { err: `Conclusion: ${e.message}` }; }
  const vars = ttVars([...prem, concl]);
  if (vars.length > TT_MAX) return { err: `This checks up to ${TT_MAX} sentence letters (${2 ** TT_MAX} rows); this argument has ${vars.length}.` };
  const rows = [];
  for (let r = 0; r < 2 ** vars.length; r++) {
    const env = Object.fromEntries(vars.map((v, j) => [v, !((r >> (vars.length - 1 - j)) & 1)])); // the first row is all true, as in textbooks
    const pv = prem.map((p) => ttVal(p, env)), cv = ttVal(concl, env), all = pv.every(Boolean);
    rows.push({ env, pv, cv, all, cx: all && !cv });
  }
  return { prem, concl, vars, rows, cx: rows.filter((x) => x.cx).length, live: rows.filter((x) => x.all).length };
}
function ttHTML() {
  const res = ttCheck(TT.prem, TT.concl);
  if (res.err !== undefined) return res.err ? `<p class="tt-err" role="status">${esc(res.err)}</p>` : `<p class="hint">Write a conclusion to see the table.</p>`;
  const { prem, concl, vars, rows, cx, live } = res, n = rows.length;
  const say = !prem.length
    ? cx === 0 ? `<b>True in every row.</b> The conclusion is a tautology, so it follows from no premises at all.` : `<b>Not valid.</b> With no premises the conclusion would have to be true in every row, and ${n - rows.filter((x) => x.cv).length} of the ${n} rows make it false.`
    : cx ? `<b class="bad">Not valid.</b> ${cx === 1 ? "One row makes" : `${cx} rows make`} every premise true and the conclusion false (marked ✗). Each is a counterexample: a way for the premises to hold while the conclusion fails.`
    : live ? `<b>Valid.</b> In every row where all the premises are true (marked ✓), the conclusion is true too, so there is no counterexample.`
    : `<b>Valid, but only because the premises can never all be true together.</b> They are inconsistent, so no row can be a counterexample. An argument like this is valid and can never be sound.`;
  const tf = (x) => `<td class="${x ? "t" : "f"}">${x ? "T" : "F"}</td>`;
  const ex = ttExampleOf(TT.prem, TT.concl), term = ex && ex[3] && GLOSSARY.find((g) => g.id === ex[3]);
  return `<p class="qz-say" role="status">${say}</p>
    ${term ? `<div class="noteacts"><button class="btn ghost" data-term="${esc(term.id)}" style="padding-left:0">${esc(ex[0])} in the glossary ›</button></div>` : ""}
    <div class="tt-wrap"><table class="tt"><thead><tr>${vars.map((v) => `<th class="tv">${esc(v)}</th>`).join("")}${prem.map((p) => `<th>${esc(ttShow(p))}</th>`).join("")}<th class="tc">∴ ${esc(ttShow(concl))}</th><th class="tm" aria-label="Row"></th></tr></thead>
    <tbody>${rows.map((x) => `<tr class="${x.cx ? "cx" : x.all ? "ok" : ""}">${vars.map((v) => tf(x.env[v])).join("")}${x.pv.map(tf).join("")}${tf(x.cv)}<td class="tm">${x.cx ? "✗" : x.all && prem.length ? "✓" : ""}</td></tr>`).join("")}</tbody></table></div>
    <p class="hint">${n} rows, one for each way of making ${vars.length === 1 ? "the sentence" : `the ${vars.length} sentences`} true or false. An argument is valid when no row makes every premise true and the conclusion false.</p>`;
}
function truthPanel(preset) {
  if (preset) Object.assign(TT, preset);
  const sym = ["¬", "∧", "∨", "→", "↔", "(", ")"].map((s) => `<button type="button" class="segb tt-sym" data-keep="1" data-ttsym="${s}" aria-label="Type ${s}">${s}</button>`).join("");
  const ex = TT_EXAMPLES.map(([name], i) => `<button class="chip" data-keep="1" data-ttex="${i}">${esc(name)}</button>`).join("");
  const inAttrs = `autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false"`;
  openPanel(`<h2>Truth table</h2>
    <p class="hint">Is an argument valid? Write each premise on its own line and the conclusion below, using capital letters for sentences: “If it rains, the street is wet” becomes P → Q.</p>
    <div class="crow"><span class="clabel">Try one</span><div class="chips">${ex}</div></div>
    <div class="field"><label for="tt-p">Premises, one per line</label><textarea id="tt-p" rows="3" ${inAttrs}>${esc(TT.prem)}</textarea></div>
    <div class="field"><label for="tt-c">Conclusion</label><input id="tt-c" ${inAttrs} value="${esc(TT.concl)}"></div>
    <div class="seg tt-syms">${sym}</div>
    <p class="hint">You can also type <span class="tt-ascii">~ &amp; | -&gt; &lt;-&gt;</span> or the words not, and, or, implies, iff.</p>
    <div id="ttout" style="display:grid;gap:10px">${ttHTML()}</div>`, (b) => {
    if (b.dataset.ttex) { const [, p, c] = TT_EXAMPLES[+b.dataset.ttex]; Object.assign(TT, { prem: p, concl: c }); $("#tt-p").value = p; $("#tt-c").value = c; }
    else if (b.dataset.ttsym) {
      const f = $("#" + TT.field) || $("#tt-p");
      const a = f.selectionStart ?? f.value.length, z = f.selectionEnd ?? a, s = b.dataset.ttsym, gap = (c) => !c || /\s/.test(c);
      const two = TT_PREC[s] ? `${gap(f.value[a - 1]) ? "" : " "}${s}${f.value[z] === " " ? "" : " "}` : s; // a connective between two sentences gets spaces
      f.setRangeText(two, a, z, "end"); f.focus();
      TT[f.id === "tt-c" ? "concl" : "prem"] = f.value;
    } else if (b.dataset.term) return openTerm(b.dataset.term);
    $("#ttout").innerHTML = ttHTML();
  });
  const veil = $("#sheetroot .veil");
  // the symbol keys type into the field you were in, without taking the keyboard away from it
  veil.addEventListener("pointerdown", (e) => { if (e.target.closest(".tt-sym")) e.preventDefault(); });
  veil.addEventListener("focusin", (e) => { if (e.target.id === "tt-p" || e.target.id === "tt-c") TT.field = e.target.id; });
  veil.addEventListener("input", (e) => {
    if (e.target.id === "tt-p") TT.prem = e.target.value; else if (e.target.id === "tt-c") TT.concl = e.target.value; else return;
    $("#ttout").innerHTML = ttHTML();
  });
}
// glossary entries that offer the truth table, opening it on one of TT_EXAMPLES where one fits
const TT_TERMS = new Map([["validity", -1], ["soundness", -1], ["deduction", -1], ["modus", 0], ["affirming-consequent", 4], ["denying-antecedent", 5]]);
// Hear a name or term said aloud by the phone's own voice (the Web Speech API); the button only shows where there is one.
// Nothing leaves the device beyond what the phone's voice does itself. Names are read with an English voice.
const CAN_SAY = typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
const sayText = (x) => String(x || "").replace(/\s*\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
function sayBtn(x, cls = "btn ghost") { return CAN_SAY && sayText(x) ? `<button type="button" class="${cls} saybtn" data-keep="1" data-say="${esc(sayText(x))}" aria-label="Hear “${esc(sayText(x))}” said aloud"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="currentColor"/><path d="M13 7a4 4 0 0 1 0 6M15.2 4.8a7 7 0 0 1 0 10.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>Hear it</button>` : ""; }
function sayIt(x) {
  if (!CAN_SAY) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(x); u.lang = "en"; u.rate = 0.85; speechSynthesis.speak(u); } catch {}
}
function termSheet(id, preset) {
  const base = id ? allTerms().find((x) => x.id === id) : null;
  const g = base || { t: "", a: "mine", d: "", x: "", s: "", w: "", ...(preset || {}) };
  openSheet(`<h2>${id ? "Edit term" : "Add a term"}</h2>
    <div class="field"><label for="g-t">Term</label><input id="g-t" name="t" value="${esc(g.t)}" required></div>
    <div class="field"><label for="g-a">Area</label><select id="g-a" name="a">${Object.entries(AREAS).map(([k, v]) => `<option value="${k}"${g.a === k ? " selected" : ""}>${esc(v)}</option>`).join("")}</select></div>
    <div class="field"><label for="g-d">Definition</label><textarea id="g-d" name="d" rows="5">${esc(g.d)}</textarea><span class="hint">Quote the author where you can, in quotation marks, and put the page under Source.</span></div>
    <div class="field"><label for="g-x">More (optional)</label><textarea id="g-x" name="x" rows="5">${esc(g.x)}</textarea><span class="hint">History of the term, how it is used, and where it is disputed.</span></div>
    <div class="field"><label for="g-s">Source</label><input id="g-s" name="s" value="${esc(g.s)}" placeholder="Author, work, page"></div>
    <div class="field"><label for="g-w">Associated with</label><input id="g-w" name="w" value="${esc(g.w)}" placeholder="Thinkers or schools"></div>
    <div class="field"><label for="g-al">Also look up as</label><input id="g-al" name="al" value="${esc(id ? aliasesOf(id).join(", ") : "")}" placeholder="e.g. aufgehoben, sublated" autocomplete="off"><span class="hint">Other words for this term, separated by commas. Selecting one of them in a book and tapping Look up opens this entry.</span></div>
    ${base && base.builtIn ? `<p class="hint">Your version replaces the built-in text. Its links to thinkers and related terms stay, and you can restore the original later.</p>` : ""}`,
  async (fd) => {
    const t = fd.get("t").trim(); if (!t) return "Give the term a name.";
    const d = fd.get("d").trim(); if (!d) return "Write a definition.";
    const rec = { t, a: fd.get("a"), d, x: fd.get("x").trim(), s: fd.get("s").trim(), w: fd.get("w").trim(), updatedAt: Date.now() };
    const tid = id || "u-" + gid();
    S.gOpen.add(tid);
    const al = fd.get("al").split(",").map((x) => x.trim()).filter(Boolean);
    if (al.join("|") !== aliasesOf(tid).join("|")) await setAliases(tid, al);
    // Changing only the aliases of a built-in entry leaves its text as it is.
    const same = base && ["t", "a", "d", "x", "s", "w"].every((k) => (rec[k] || "") === (base[k] || ""));
    if (!same) await put("terms", tid, rec);
  });
}
