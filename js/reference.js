// Marginalia: Look up, thinkers and branches, reading paths and disputations. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- look up: the glossary and your own notes, over the page, without leaving the book ---------- */
// Other forms of the same word: inflections, spellings, and the original-language word an entry translates.
// Nothing here equates two different concepts; links between ideas are yours to make, with tags and aliases.
const LOOKUP_FORMS = {
  aufhebung: ["aufheben", "aufgehoben", "sublate", "sublated", "sublates", "sublating"],
  noumenon: ["noumena", "noumenal", "phenomena", "phenomenal"],
  dialectic: ["dialectics", "dialectical"], teleology: ["teleological"], deontology: ["deontological"],
  phenomenology: ["phenomenological"], hermeneutics: ["hermeneutic"], ontology: ["ontological"], metaphysics: ["metaphysical"],
  existentialism: ["existentialist", "existentialists"],
  skepticism: ["scepticism", "skeptic", "sceptic", "skeptics", "sceptics", "skeptical", "sceptical"],
  sovereignty: ["sovereign"], reification: ["reified", "reify", "reifies"], alienation: ["alienated"],
  "general-will": ["volonte generale"], "species-being": ["species being", "gattungswesen"], lifeworld: ["lebenswelt", "life-world"],
  "being-in-the-world": ["in-der-welt-sein"], anatman: ["anatta"], sunyata: ["shunyata"], eudaimonia: ["eudaemonia"],
  falsifiability: ["falsifiable"], induction: ["inductive"], deduction: ["deductive"], abduction: ["abductive"],
  autonomy: ["autonomous"], consequentialism: ["consequentialist"], transgression: ["transgressive", "transgress"],
  recognition: ["anerkennung"], "will-to-power": ["wille zur macht"], "eternal-recurrence": ["ewige wiederkunft"], sublime: ["sublimity"],
  immanence: ["immanent"], transcendence: ["transcendent"], universals: ["universal"],
  idealism: ["idealist"], materialism: ["materialist"], empiricism: ["empiricist"], rationalism: ["rationalist"], monism: ["monist"],
  dualism: ["dualist"], determinism: ["determinist"], compatibilism: ["compatibilist"], occasionalism: ["occasionalist"],
  foundationalism: ["foundationalist"], coherentism: ["coherentist"], essentialism: ["essentialist"], structuralism: ["structuralist"],
  "post-structuralism": ["post-structuralist", "poststructuralism", "poststructuralist"], genealogy: ["genealogical"],
  interpellation: ["interpellate", "interpellated"], deconstruction: ["deconstruct", "deconstructive"], tautology: ["tautological"],
  hegemony: ["hegemonic"], ideology: ["ideological"], naturalization: ["naturalize", "naturalized", "naturalisation", "naturalise", "naturalised"],
  intersectionality: ["intersectional"], accelerationism: ["accelerationist"], orientalism: ["orientalist"], biopower: ["bio-power"],
};
// Your own aliases live in the glossary store under one record, so they travel with backups.
const ALIAS_KEY = "~aliases";
const aliasMap = () => ((S.terms.get(ALIAS_KEY) || {}).map) || {};
const aliasesOf = (id) => aliasMap()[id] || [];
async function setAliases(id, list) {
  const map = { ...aliasMap() }, clean = [...new Set(list.map((x) => x.trim()).filter((x) => x.length > 1))];
  if (clean.length) map[id] = clean; else delete map[id];
  await put("terms", ALIAS_KEY, { map, updatedAt: Date.now() });
}
// The word itself, its plural or possessive; "base" leaves "based" alone.
const wordRe = (q) => new RegExp(`(^|[^\\p{L}\\p{N}])${reEsc(q)}(s|es|'s|’s)?(?![\\p{L}\\p{N}])`, "u");
const lkNorm = (s) => fold(s).replace(/[’']s\b/g, "").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").replace(/\s+/g, " ").trim();
// A cautious stem, used only to suggest: "sublated" and "sublation" meet at "sublat"; short words are left alone.
function lkStem(w) {
  for (const suf of ["ations", "ation", "ings", "ing", "ions", "ion", "ed", "es", "s"]) if (w.endsWith(suf) && w.length - suf.length >= 5) return w.slice(0, -suf.length);
  return w;
}
// The entry's own name: full title, title without its bracket, the bracketed name ("sublation"), listed forms, your aliases.
function termNames(g) {
  const t = fold(g.t), base = t.replace(/\s*\(.*?\)\s*/g, " ").trim(), par = ((t.match(/\((.*?)\)/) || [])[1] || "").trim();
  const names = [t, base, base.replace(/^the\s+/, ""), par.length >= 4 ? par : ""];
  return [...new Set([...names, ...(LOOKUP_FORMS[g.id] || []), ...aliasesOf(g.id).map(fold)].filter(Boolean))];
}
// Halves of a paired title ("Base and superstructure") are topics the entry covers, which is weaker than a match.
function termParts(g) {
  const base = fold(g.t).replace(/\s*\(.*?\)\s*/g, " ").trim(), and = base.split(" and ");
  return and.length === 2 && and.every((x) => x.trim().length >= 3) ? and.map((x) => x.trim()) : [];
}
// Glossary results in order of certainty: the word itself, a topic the entry covers, a similar spelling, a mention.
function lookupTerms(q) {
  const terms = allTerms(), exact = [], covered = [], similar = [], mentions = [], seen = new Set();
  const add = (list, g, why) => { if (!seen.has(g.id)) { seen.add(g.id); list.push({ g, why }); } };
  const plural = [q, q.endsWith("s") ? q.slice(0, -1) : "", q.endsWith("es") ? q.slice(0, -2) : ""].filter((x) => x.length >= 3);
  for (const g of terms) { const names = termNames(g); if (plural.some((x) => names.includes(x))) add(exact, g, "Match"); }
  for (const g of terms) if ([...(g.k || []).map(fold), ...termParts(g)].includes(q)) add(covered, g, "Covered in this entry");
  if (!/\s/.test(q) && q.length >= 5) {
    const st = lkStem(q);
    for (const g of terms) if (termNames(g).some((n) => !/\s/.test(n) && lkStem(n) === st)) add(similar, g, "Similar spelling: check the sense");
  }
  if (q.length >= 4) {
    const re = wordRe(q);
    for (const g of terms) if (mentions.length < 6 && re.test(fold(`${g.d} ${g.x || ""}`))) add(mentions, g, "Mentions it");
  }
  return [...exact, ...covered, ...similar, ...mentions];
}
// Your notes, by the literal word (or its #tag); this book first.
function lookupNotes(q, tid) {
  const re = wordRe(q), tag = q.replace(/\s+/g, "-");
  const hits = [...S.notes.entries()].filter(([, n]) => re.test(fold([n.passage, n.gloss, n.original, ...(n.premises || []), n.conclusion, ...fuTexts(n)].filter(Boolean).join(" \n "))) || tagsOf(n).includes(tag));
  const here = sortNotes(hits.filter(([, n]) => n.textId === tid), S.texts.get(tid));
  const there = hits.filter(([, n]) => n.textId !== tid).sort(([, a], [, b]) => ((S.texts.get(a.textId) || {}).title || "").localeCompare((S.texts.get(b.textId) || {}).title || "") || pnum(a.page) - pnum(b.page));
  return { here, there };
}
function lookupSel() {
  const s = R.sel; if (!s) return;
  $("#selbar").hidden = true;
  try { window.getSelection().removeAllRanges(); } catch {}
  lookupPanel(s);
}
function lookupPanel(s) {
  const q = lkNorm(s.text); if (!q) return;
  const tid = R.tid, terms = lookupTerms(q), { here, there } = lookupNotes(q, tid);
  const hasExact = terms.some((r) => r.why === "Match");
  const loaded = [...S.texts.values()].filter((t) => t.hasContent).length;
  const card = ({ g, why }, k) => `<details class="lk-term"${k === 0 && why === "Match" ? " open" : ""}>
      <summary><span class="tm">${esc(g.t)}</span><span class="lk-why${why === "Match" ? "" : " soft"}">${esc(why)}</span></summary>
      <div class="tbody">
        <p class="tdef">${esc(g.d)}</p>
        ${parasHTML(g.x)}
        ${g.s ? `<p class="tsrc">${esc(g.s)}</p>` : ""}
        ${thinkerSources(g)}
        ${why === "Match" ? "" : `<button class="linkbtn" data-keep="1" data-lkalias="${esc(g.id)}">Always look up “${esc(s.text)}” here</button>`}
      </div></details>`;
  const row = ([id, n], same) => {
    const jump = same && Number.isInteger(n.at) ? `data-lkjump="${n.at}"` : `data-jump="${esc(id)}"`;
    return `<button class="lrow" ${jump}><b>${esc(same ? noteWhere(n, true) : noteWhere(n, false))}</b><span>${esc(cmpEvidence(n))}</span></button>`;
  };
  openPanel(`<h2 class="lk-q">${esc(s.text)}</h2>
    <section class="lk-sec"><div class="label">Glossary</div>
      ${terms.length ? `<div class="lk-terms">${terms.map(card).join("")}</div>` : ""}
      ${hasExact ? "" : `<p class="hint">${terms.length ? "No entry has this exact name; the ones above are labelled by how they relate to it." : `Nothing in the glossary matches “${esc(s.text)}”.`}</p>`}
    </section>
    ${s.text.split(/\s+/).length <= 3 ? `<section class="lk-sec"><div class="label">Dictionary</div><div id="lk-dict" class="lk-dict"><p class="hint">Looking it up in Wiktionary…</p></div></section>` : ""}
    <section class="lk-sec"><div class="label">Your notes</div>
      ${here.length ? `<div class="lk-sub">In this book</div><div class="links">${here.slice(0, 30).map((e) => row(e, true)).join("")}</div>` : ""}
      ${there.length ? `<div class="lk-sub">In your other books</div><div class="links">${there.slice(0, 30).map((e) => row(e, false)).join("")}</div>` : ""}
      ${here.length || there.length ? "" : `<p class="hint">None of your notes use “${esc(s.text)}”. Look up matches the word itself and its #tag.</p>`}
    </section>
    <div class="lk-acts">
      <button class="btn primary" id="lk-note">Add a note</button>
      ${loaded ? `<button class="btn" id="lk-all">Search all books</button>` : ""}
      ${hasExact ? "" : `<button class="btn ghost" id="lk-add">Add to your glossary</button>`}
    </div>`, async (b) => {
    if (b.dataset.lkalias) {
      const g = allTerms().find((x) => x.id === b.dataset.lkalias); if (!g) return;
      try { await setAliases(g.id, [...aliasesOf(g.id), s.text]); toast(`“${s.text}” now looks up ${g.t}.`); lookupPanel(s); }
      catch (e) { toast(failMsg(e)); }
      return;
    }
    if (b.id === "lk-note") noteSheet(null, { passage: s.text, page: s.page, sectionId: s.sec, at: s.i, kind: "passage", ...(s.anchor && unspace(s.anchor && quoteOf(R.blocks || [], s.anchor)) === unspace(s.text) ? { anchor: s.anchor } : {}) });
    else if (b.dataset.lkjump) jumpTo(+b.dataset.lkjump, true);
    else if (b.dataset.jump) jumpToNote(b.dataset.jump);
    else if (b.id === "lk-all") go({ screen: "concord", q: s.text });
    else if (b.id === "lk-add") termSheet(null, { t: s.text });
  });
  if (s.text.split(/\s+/).length <= 3) dictInto($("#lk-dict"), s.text);
}
/* Wiktionary, read through the MediaWiki API (origin=* allows it from this page). Definitions are kept on this device,
   so a word looked up once can be read again offline. */
const DICT_KEY = "mg-dict";
function dictCache() { try { return JSON.parse(localStorage.getItem(DICT_KEY) || "{}"); } catch { return {}; } }
function dictSave(word, entry) {
  try { const c = dictCache(); c[word] = { ...entry, t: Date.now() }; const keys = Object.keys(c); if (keys.length > 300) keys.sort((a, b) => c[a].t - c[b].t).slice(0, keys.length - 300).forEach((k) => delete c[k]); localStorage.setItem(DICT_KEY, JSON.stringify(c)); } catch {}
}
// Words looked up in Look up (kept on this device by dictSave), newest first, each with one usable definition: English first,
// skipping senses that only point at another word ("plural of", "alternative form of").
const POINTER = /^(?:(?:alternative|obsolete|archaic|dated|rare|nonstandard|misspelling|abbreviation|initialism|synonym|plural|inflection|comparative|superlative)\b.{0,30}\bof\b|(?:simple past|past participle|present participle|third-person|plural form))/i;
function lookedUp() {
  const seen = new Set(), out = [];
  for (const [key, e] of Object.entries(dictCache()).sort((a, b) => (b[1].t || 0) - (a[1].t || 0))) {
    if (!e || !Array.isArray(e.defs)) continue;
    const word = e.title || key; if (seen.has(word.toLowerCase())) continue;
    const defs = [...e.defs].sort((a, b) => (b.lang === "English") - (a.lang === "English"));
    let use = null; for (const d of defs) { const sense = (d.senses || []).find((x) => x && !POINTER.test(x)); if (sense) { use = { lang: d.lang, pos: d.pos, sense }; break; } }
    if (!use) continue;
    seen.add(word.toLowerCase()); out.push({ word, key, ...use });
  }
  return out;
}
function dictForget(key) { try { const c = dictCache(); delete c[key]; localStorage.setItem(DICT_KEY, JSON.stringify(c)); } catch {} }
function wordsPanel() {
  const draw = () => { const list = lookedUp(); return `<p class="hint">${list.length ? `${list.length} word${list.length === 1 ? "" : "s"} you've looked up while reading, newest first. They're kept on this device for Look up to show offline; Remove drops one, offline definition included.` : "Words you look up while reading appear here."}</p>
    ${list.length >= 4 ? `<div class="noteacts"><button class="btn primary" data-wquiz="1">Quiz on these words</button></div>` : ""}
    <div class="wlist">${list.map((x) => `<div class="witem"><div class="wh"><b>${esc(x.word)}</b><span>${esc(x.pos)}${x.lang !== "English" ? `, ${esc(x.lang)}` : ""}</span><button class="linkbtn" data-keep="1" data-wforget="${esc(x.key)}">Remove</button></div><p>${esc(x.sense)}</p></div>`).join("")}</div>`; };
  openPanel(`<h2>Words you've looked up</h2><div id="wbox" style="display:grid;gap:12px">${draw()}</div>`, (b) => {
    if (b.dataset.wforget) { dictForget(b.dataset.wforget); $("#wbox").innerHTML = draw(); }
    else if (b.dataset.wquiz) quizPanel("words");
  });
}
// The definitions in a Wiktionary page: [{ lang, pos, senses: [...] }], from the parsed page's HTML.
function dictParse(html) {
  const doc = new DOMParser().parseFromString(html, "text/html"), root = doc.querySelector(".mw-parser-output") || doc.body, out = [];
  let lang = "", pos = "";
  const head = (el) => { const h = el.matches("h2, h3, h4, h5") ? el : el.matches(".mw-heading") ? el.querySelector("h2, h3, h4, h5") : null; return h ? [h.tagName, (h.querySelector(".mw-headline") || h).textContent.replace(/\[edit\]/g, "").trim()] : null; };
  for (const el of root.children) {
    const h = head(el);
    if (h) { if (h[0] === "H2") { lang = h[1]; pos = ""; } else pos = h[1]; continue; }
    if (el.tagName !== "OL" || el.classList.contains("references") || !lang || !pos || /etymology|pronunciation|references|see also|anagrams|translations|derived|related|descendants/i.test(pos)) continue;
    const senses = [...el.children].filter((li) => li.tagName === "LI").map((li) => { const c = li.cloneNode(true); c.querySelectorAll("ul, ol, dl, sup, .HQToggle, .nyms, .citation-whole, .h-usage-example, style, .maintenance-line").forEach((x) => x.remove()); return c.textContent.replace(/\s+/g, " ").trim(); }).filter(Boolean);
    if (senses.length) out.push({ lang, pos, senses });
  }
  return out;
}
async function dictFetch(word) {
  const url = (w) => `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(w)}&prop=text&format=json&formatversion=2&redirects=1&origin=*`;
  for (const w of [...new Set([word, word.toLowerCase()])]) {
    const r = await fetch(url(w)); if (!r.ok) throw new Error("http " + r.status);
    const j = await r.json(); if (j.error) continue;
    const html = j.parse && (typeof j.parse.text === "string" ? j.parse.text : j.parse.text && j.parse.text["*"]);
    if (html) return { title: j.parse.title || w, defs: dictParse(html) };
  }
  return { title: word, defs: [] };
}
async function dictInto(el, text) {
  if (!el) return;
  const word = text.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "").trim(); if (!word) { el.innerHTML = ""; return; }
  const draw = (e) => {
    if (!el.isConnected) return;
    const langs = [...new Set(e.defs.map((d) => d.lang))].sort((a, b) => (b === "English") - (a === "English")).slice(0, 3);
    el.innerHTML = e.defs.length ? langs.map((L) => `<div class="dl"><div class="lk-sub">${esc(L)}</div>${e.defs.filter((d) => d.lang === L).slice(0, 2).map((d) => `<p class="dpos">${esc(d.pos)}</p><ol>${d.senses.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join("")}</ol>`).join("")}</div>`).join("") + `<p class="hint"><a href="https://en.wiktionary.org/wiki/${encodeURIComponent(e.title)}" target="_blank" rel="noopener">More in Wiktionary</a></p>`
      : `<p class="hint">Wiktionary has no entry for “${esc(word)}”.</p>`;
  };
  const cached = dictCache()[word];
  if (cached) { draw(cached); return; }
  if (navigator.onLine === false) { el.innerHTML = `<p class="hint">You're offline. Words you've looked up before are kept here.</p>`; return; }
  try { const e = await dictFetch(word); dictSave(word, e); draw(e); }
  catch { if (el.isConnected) el.innerHTML = `<p class="hint">Couldn't reach Wiktionary just now.</p>`; }
}

/* ---------- thinkers, branches, and the facts that connect them ---------- */
// THINKERS is in data/thinkers.js.
const THINKER = new Map(THINKERS.map((p) => [p.id, p]));

// BRANCHES is in data/branches.js.
const BRANCH = new Map(BRANCHES.map((b) => [b.id, b]));
// Which branch or tradition a term belongs to: its own list (br), or else its area's default.
const AREA_BRANCH = { meta: ["metaphysics"], know: ["epistemology"], logic: ["logic"], ethics: ["ethics"], aes: ["aesthetics"], phen: ["phenomenology"], crit: ["critical-theory"], mine: [] };

/* ---------- branches ---------- */
function termBranches(g) { return (Array.isArray(g.br) ? g.br : AREA_BRANCH[g.a] || []).filter((b) => BRANCH.has(b)); }
/* ---------- reading paths (PATHS, in data/branches.js): routes through the classics that come with the app ----------
   Each step opens its book at its first chapter, or where you are if you're already inside those chapters; a step is done once
   you've ticked all its chapters as read on the book's page. A classic you deleted can be added back. Nothing else is stored. */
const pathsFor = (bid) => (typeof PATHS === "undefined" ? [] : PATHS.filter((x) => (x.br || []).includes(bid)));
function stepState(st) {
  const t = S.texts.get(st.book); if (!t) return { t: null, secs: [], done: false, started: false };
  const by = new Map((t.sections || []).map((x) => [x.id, x])), secs = st.secs.map((id) => by.get(id)).filter(Boolean);
  return { t, secs, done: secs.length > 0 && secs.every((x) => x.done), started: secs.some((x) => x.done) || (t.pos || 0) > 0 };
}
function pathsView() {
  const list = typeof PATHS === "undefined" ? [] : PATHS;
  const tmap = termMap();
  const path = (P) => {
    const states = P.steps.map(stepState), done = states.filter((x) => x.done).length;
    const step = (st, k) => {
      const s = states[k], t = s.t, title = t ? t.title : (CLASSIC_TITLES[st.book] || "A classic");
      const ch = s.secs.length ? s.secs.map((x) => x.label).join(" · ") : "";
      return `<li class="pstep${s.done ? " done" : ""}"><span class="pn" aria-hidden="true">${s.done ? "✓" : k + 1}</span><div class="pbody">
        <div class="pt"><b>${esc(title)}</b>${t && t.author ? `<span>${esc(t.author)}</span>` : ""}</div>
        ${ch ? `<div class="pch">${esc(ch)}</div>` : ""}
        <p>${esc(st.why)}</p>
        ${readQsHTML(P, k, !!t)}
        <div class="noteacts">${t ? `<button class="btn${s.done ? "" : " primary"}" data-pathread="${esc(st.book)}|${esc(st.secs.join(","))}">${s.done ? "Read again" : progressIn(st) ? "Continue" : "Read these chapters"}</button><button class="btn ghost" data-open="${esc(st.book)}">The book's page</button>`
          : `<span class="hint">Not on your shelf: you deleted it.</span><button class="btn" data-pathadd="${esc(st.book)}">Add it back</button>`}</div>
      </div></li>`;
    };
    return `<section class="path group" data-path-id="${esc(P.id)}">
      <div class="sec-head"><div><h2>${esc(P.n)}</h2><div class="sub">${P.steps.length} books${done ? `, ${done} done` : ""}</div></div><button class="btn ghost" data-pathshare="${esc(P.id)}">Share</button></div>
      <p class="pd">${esc(P.d)}</p>
      <div class="pbar" aria-hidden="true">${P.steps.map((_, k) => `<i class="${states[k].done ? "on" : ""}"></i>`).join("")}</div>
      <ol class="psteps">${P.steps.map(step).join("")}</ol>
      ${chipRow("Terms along the way", termChips(P.terms || [], tmap))}
      ${P.next ? `<p class="hint">Then: ${esc(P.next)}</p>${P.ws ? `<div class="noteacts"><button class="btn" data-wsfind="${esc(P.ws.lang)}|${esc(P.ws.q)}">Find it on Wikisource</button></div>` : ""}` : ""}
    </section>`;
  };
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>
    <header class="gl-head"><div><h1>Reading paths</h1><div class="sub">${list.length} routes through the classics that come with the app</div></div></header>
    <p class="hint">Each path reads a few chapters from each book, in an order where each answers the one before. A step is done once you tick its chapters as read on the book's page.</p>
    ${list.map(path).join("") || `<p class="empty">No paths yet.</p>`}`;
}
// Questions to read a step with: folded on the path, open in Where you left off; each can become a Question note on the book.
function readQsHTML(P, k, canAsk, open) {
  const st = P.steps[k], qs = st.q || []; if (!qs.length) return "";
  const have = new Set(notesFor(st.book).filter(([, n]) => n.kind === "question").map(([, n]) => n.gloss));
  const list = `<ol class="readqs">${qs.map((q, i) => `<li><span>${esc(q)}</span>${canAsk ? (have.has(q) ? `<small>In your questions</small>` : `<button class="linkbtn" data-askq="${esc(P.id)}|${k}|${i}">Add to my questions</button>`) : ""}</li>`).join("")}</ol>`;
  return open ? list : `<details class="readqd"><summary>Questions to read with</summary>${list}</details>`;
}
// The path step whose chapters hold a place in a book, if any (the first, where two paths share chapters).
function stepAt(tid, B, pos) {
  if (typeof PATHS === "undefined" || !B) return null;
  for (const P of PATHS) for (const [k, st] of P.steps.entries()) {
    if (st.book !== tid || !(st.q || []).length) continue;
    const r = stepRange(B, st.secs); if (r && pos >= r[0] && pos < r[1]) return { P, k };
  }
  return null;
}
async function askQuestion(ref) {
  const [pid, k, i] = ref.split("|"), P = PATHS.find((x) => x.id === pid), st = P && P.steps[+k], q = st && (st.q || [])[+i];
  if (!q || !S.texts.has(st.book)) return;
  if (notesFor(st.book).some(([, n]) => n.kind === "question" && n.gloss === q)) return toast("That's already in your questions.");
  try {
    const B = await loadContent(st.book), r = B ? stepRange(B, st.secs) : null;
    const note = { textId: st.book, kind: "question", passage: "", gloss: q, page: r ? pagesOf(B)[r[0]] || "" : "", sectionId: st.secs[0], createdAt: Date.now(), updatedAt: Date.now() };
    if (r) note.at = r[0];
    await put("notes", gid(), note);
    toast(`Added to your questions on “${S.texts.get(st.book).title}”.`);
  } catch (e) { toast(failMsg(e)); }
}
// A classic's primer (PRIMERS in data/branches.js) on its page: open until you've started reading or taken a note, then folded.
function primerHTML(id, t) {
  const p = typeof PRIMERS !== "undefined" && PRIMERS[id]; if (!p) return "";
  const fresh = !(t.pos > 0) && !notesFor(id).length;
  const paths = (typeof PATHS === "undefined" ? [] : PATHS).flatMap((P) => P.steps.map((st, k) => [P, k, st]).filter(([, , st]) => st.book === id));
  return `<section class="group"><details class="primer"${fresh ? " open" : ""}><summary class="label">Before you start</summary><div class="paperpanel primerbody">
    <p class="tdef">${esc(p.about)}</p>
    <div class="crow"><span class="clabel">How it's built</span><p class="tdef">${esc(p.built)}</p></div>
    ${chipRow("Words to know", termChips(p.terms || [], termMap()))}
    ${paths.length ? chipRow("Read it in a path", paths.map(([P, k]) => `<button class="chip" data-path="${esc(P.id)}">${esc(P.n)} · step ${k + 1}</button>`).join("")) : ""}
    ${thinkerSources(p)}
  </div></details></section>`;
}
// Titles for steps whose book isn't in the library: the classics' own titles (tests/study_tools.py checks them against data/books/).
const CLASSIC_TITLES = { "classic-plato-socrates": "Euthyphro, Apology, Crito, Phaedo", "classic-aristotle-ethics": "Nicomachean Ethics", "classic-descartes-meditations": "Discourse on the Method and Meditations on First Philosophy",
  "classic-hobbes-leviathan": "Leviathan", "classic-hume-enquiry": "An Enquiry Concerning Human Understanding", "classic-rousseau-social-contract": "The Social Contract",
  "classic-kant-groundwork": "Fundamental Principles of the Metaphysic of Morals", "classic-wollstonecraft-vindication": "A Vindication of the Rights of Woman",
  "classic-marx-engels-manifesto": "The Communist Manifesto", "classic-nietzsche-genealogy": "The Genealogy of Morals", "classic-cooper-voice": "A Voice from the South", "classic-du-bois-souls": "The Souls of Black Folk",
  "classic-plato-republic": "The Republic", "classic-mill-liberty": "On Liberty", "classic-russell-problems": "The Problems of Philosophy" };
// Whether your place in the book is inside a step's chapters (known once the book's text has been loaded).
function progressIn(st) {
  const t = S.texts.get(st.book), B = S.content.get(st.book); if (!t || !B || !(t.pos > 0)) return false;
  const r = stepRange(B, st.secs); return !!r && t.pos >= r[0] && t.pos < r[1];
}
// The blocks a step covers: from its first chapter's heading to the start of the chapter after its last.
function stepRange(B, secs) {
  const heads = B.map((b, i) => [b, i]).filter(([b]) => b.s && !b.stj && roleOf(b) === "chapter");
  const k0 = heads.findIndex(([b]) => b.s === secs[0]), k1 = heads.findIndex(([b]) => b.s === secs[secs.length - 1]);
  if (k0 < 0 || k1 < 0) return null;
  return [heads[k0][1], k1 + 1 < heads.length ? heads[k1 + 1][1] : B.length];
}
async function readStep(tid, secs) {
  const t = S.texts.get(tid); if (!t) return;
  const B = await loadContent(tid); if (!B) return go({ screen: "text", textId: tid });
  const r = stepRange(B, secs);
  if (!r) { toast("Those chapters aren't marked in this copy of the book, so it opens where you left off."); return go({ screen: "reader", textId: tid }); }
  if (t.pos >= r[0] && t.pos < r[1]) return go({ screen: "reader", textId: tid }); // already inside them: carry on from your place
  return go({ screen: "reader", textId: tid, at: r[0] });
}
async function readdClassic(id) {
  if (S.texts.has(id)) return render();
  try {
    const rec = await putClassic(id, Date.now());
    if (!rec) return toast("Couldn't fetch the book just now. Check your connection and try again.");
    render(); toast(`“${rec.title}” is back on your Queued shelf.`);
  } catch (e) { toast(failMsg(e)); }
}
/* ---------- disputations (DISPUTES, in data/branches.js): answer an argument from the classics, then compare with the classic objection ----------
   What you write is kept only while the app is open (DSP), until you save it as an Objection note on the book, tagged #disputation. */
const DSP = { text: {}, shown: new Set() };
const disputeNotes = (d) => notesFor(d.book).filter(([, n]) => n.kind === "objection" && n.sectionId === d.sec && /#disputation\b/.test(n.gloss || ""));
function disputesView() {
  const list = typeof DISPUTES === "undefined" ? [] : DISPUTES;
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>
    <header class="gl-head"><div><h1>Disputations</h1><div class="sub">${list.length} arguments from the classics on your shelf</div></div></header>
    <p class="hint">Read the argument, write the strongest objection you can, then compare it with the classic objection from the history of the debate. Save yours as an Objection note on the book if you want to keep it.</p>
    <div class="gl-list">${list.map((d) => { const k = disputeNotes(d).length; return `<button class="thinkrow" data-dispute="${esc(d.id)}"><b>${esc(d.n)}</b><span class="ty">${esc(d.where)}</span><span class="td">${k ? `Your objection${k === 1 ? "" : "s"} saved: ${k}.` : "Not answered yet."}</span></button>`; }).join("")}</div>`;
}
async function disputeBlock(d) {
  const B = await loadContent(d.book); if (!B) return -1;
  const want = unspace(d.find); return B.findIndex((b) => b.x && unspace(plain(b.x)).includes(want));
}
function disputePanel(id) {
  const d = DISPUTES.find((x) => x.id === id); if (!d) return;
  const t = S.texts.get(d.book), tmap = termMap(), saved = disputeNotes(d);
  const draw = () => {
    const mine = DSP.text[id] || "", shown = DSP.shown.has(id);
    return `<div class="noteacts"><textarea id="dsp-x" rows="5" aria-label="Your strongest objection" placeholder="The strongest objection you can make, in a few sentences.">${esc(mine)}</textarea></div>
      ${shown ? `<div class="paperpanel dspclassic"><div class="label">${esc(d.label)}</div><p class="dspwho">${esc(d.who)}</p>${parasHTML(d.x)}${thinkerSources(d)}</div>` : ""}
      <div class="noteacts">${shown ? "" : `<button class="btn primary" data-keep="1" data-dspshow="1"${mine.trim().length < 20 ? " disabled" : ""}>Compare with the ${d.label.includes("reply") ? "classic reply" : "classic objection"}</button><button class="btn ghost" data-keep="1" data-dspshow="1">Just show me</button>`}
        ${t && mine.trim() ? `<button class="btn${shown ? " primary" : ""}" data-keep="1" data-dspsave="1">Save mine as an Objection note</button>` : ""}</div>
      ${saved.length ? `<p class="hint">You've saved ${saved.length} objection${saved.length === 1 ? "" : "s"} to this argument, on the book's page under Notes.</p>` : ""}`;
  };
  openPanel(`<h2>${esc(d.n)}</h2><p class="hint">${esc(d.where)}${t ? "" : " · not on your shelf"}</p>
    <span class="qz-arg">${d.prem.map((x, i) => `<span>${i + 1}. ${esc(x)}</span>`).join("")}<span class="qz-c">∴ ${esc(d.concl)}</span></span>
    <p class="hint">The argument as set out here is a reconstruction; read it in the text before you answer it.</p>
    <div class="noteacts">${t ? `<button class="btn" data-dspread="1">Read the passage</button>` : `<button class="btn" data-pathadd="${esc(d.book)}">Add the book back</button>`}${(d.terms || []).length ? termChips(d.terms, tmap) : ""}</div>
    <div class="label">Your objection</div>
    <div id="dspbox" style="display:grid;gap:12px">${draw()}</div>`, async (b) => {
    if (b.dataset.dspshow) { DSP.shown.add(id); $("#dspbox").innerHTML = draw(); return; }
    if (b.dataset.dspsave) {
      const x = (DSP.text[id] || "").trim(); if (!x || !S.texts.get(d.book)) return;
      try {
        const at = await disputeBlock(d), B = S.content.get(d.book) || [];
        const note = { textId: d.book, kind: "objection", passage: "", gloss: `${x}\n\n#disputation`, page: at >= 0 ? pagesOf(B)[at] || "" : "", sectionId: d.sec, createdAt: Date.now(), updatedAt: Date.now() };
        if (at >= 0) note.at = at;
        await put("notes", gid(), note);
        delete DSP.text[id]; toast(`Saved to “${S.texts.get(d.book).title}”, with the book's open questions and objections.`);
        closeOverlay();
      } catch (e) { toast(failMsg(e)); }
      return;
    }
    if (b.dataset.dspread) { const at = await disputeBlock(d); return go({ screen: "reader", textId: d.book, ...(at >= 0 ? { at, flash: true } : {}) }); }
    if (b.dataset.pathadd) return readdClassic(b.dataset.pathadd);
    if (b.dataset.term) return openTerm(b.dataset.term);
  });
  const veil = $("#sheetroot .veil");
  veil.addEventListener("input", (e) => {
    if (e.target.id !== "dsp-x") return; DSP.text[id] = e.target.value;
    const cmp = $("#dspbox [data-dspshow]"); if (cmp && !cmp.classList.contains("ghost")) cmp.disabled = e.target.value.trim().length < 20;
    const has = !!$("#dspbox [data-dspsave]"); if (has !== !!e.target.value.trim()) { const pos = e.target.selectionStart; $("#dspbox").innerHTML = draw(); const ta = $("#dsp-x"); ta.focus(); ta.setSelectionRange(pos, pos); }
  });
}
// The fallacies in the glossary (fal), formal then informal, each opening its entry: shown in the Logic branch.
function fallacyCatalogHTML(terms) {
  const cut = (x, n = 130) => (x.length > n ? x.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : x);
  const group = (kind, title, hint) => {
    const list = terms.filter((g) => g.fal === kind).sort((a, b) => a.t.localeCompare(b.t));
    return list.length ? `<div class="falgroup"><div class="crow"><span class="clabel">${title} <span class="cnt">${list.length}</span></span></div><p class="hint">${hint}</p>
      <div class="reflist">${list.map((g) => `<button class="refrow" data-term="${esc(g.id)}"><span class="rr-n">${esc(g.t)}</span><span class="rr-d">${esc(cut(g.d))}</span></button>`).join("")}</div></div>` : "";
  };
  const body = group("formal", "Formal fallacies", "Wrong by their form alone, whatever the argument is about. A truth table shows the counterexample.")
    + group("informal", "Informal fallacies", "Wrong because of what is said or how, which form alone can't show. Several name patterns that are sometimes good reasoning; each entry says when.");
  return body ? `<div class="label">Fallacies</div><div class="falcat">${body}</div>` : "";
}
// Safe inline cross-references for the Metaphysics article.
function branchLinks(text, terms, thinkers) {
  const candidates = [
    ...thinkers.filter((p) => p && p.n).flatMap((p) => [p.n, p.s].filter((name) => name && name.length >= 5).map((name) => ({ name, id: p.id, kind: "thinker" }))),
    ...terms.filter((g) => g.t && g.t.length >= 7 && !/^(identity|reality|existence|substance|knowledge|causation)$/i.test(g.t)).map((g) => ({ name: g.t, id: g.id, kind: "term" }))
  ].sort((a, b) => b.name.length - a.name.length);
  const hits = [];
  for (const c of candidates) {
    const pos = text.toLocaleLowerCase().indexOf(c.name.toLocaleLowerCase());
    if (pos < 0) continue;
    const end = pos + c.name.length;
    if ((pos && /[\\p{L}\\p{N}]/u.test(text[pos - 1])) || (end < text.length && /[\\p{L}\\p{N}]/u.test(text[end]))) continue;
    if (hits.some((h) => pos < h.end && end > h.pos)) continue;
    hits.push({ pos, end, ...c });
  }
  hits.sort((a, b) => a.pos - b.pos);
  let html = "", cursor = 0;
  for (const h of hits) {
    html += esc(text.slice(cursor, h.pos)) + '<button type="button" class="branch-inline-link" data-' + h.kind + '="' + esc(h.id) + '">' + esc(text.slice(h.pos, h.end)) + '</button>';
    cursor = h.end;
  }
  return html + esc(text.slice(cursor));
}
function branchesView() {
  const all = allTerms();
  const rel = new Map(BRANCHES.map((b) => [b.id, new Set(b.rel || [])]));
  BRANCHES.forEach((b) => (b.rel || []).forEach((r) => rel.get(r) && rel.get(r).add(b.id)));
  const sec = (k, title, intro) => `<section class="group"><div class="label">${title}</div><p class="hint">${intro}</p><div class="gl-list">${BRANCHES.filter((b) => b.k === k).map((b) => {
    const terms = all.filter((g) => termBranches(g).includes(b.id));
    return `<details class="term branch" data-branch-id="${esc(b.id)}"${S.bOpen.has(b.id) ? " open" : ""}>
      <summary><span class="tm">${esc(b.n)}</span><span class="ta">${terms.length} glossary term${terms.length === 1 ? "" : "s"}, ${b.p.length} thinker${b.p.length === 1 ? "" : "s"}</span></summary>
      <div class="tbody">
        <p class="tdef">${esc(b.d)}</p>
        ${figHTML(b.img)}
        ${b.id === "metaphysics" ? b.x.split(/\n\n/).map((part) => { const at = part.indexOf("\n"); const link = (v) => branchLinks(v, terms, [...THINKER.values()]); return at < 0 ? `<p>${link(part)}</p>` : `<section class="branch-article-section"><h3>${esc(part.slice(0, at))}</h3><p>${link(part.slice(at + 1))}</p></section>`; }).join("") : parasHTML(b.x)}${thinkerSources(b)}
        ${b.id === "logic" ? `<div class="noteacts"><button class="btn" data-truth="-1">Check an argument with a truth table</button><button class="btn" data-argquiz="fallacy">Name the fallacy</button><button class="btn" data-argquiz="valid">Valid or not?</button><button class="btn" data-argquiz="missing">Missing premise</button><button class="btn" data-steps="1">Put the steps in order</button><button class="btn" data-recon="1">How to reconstruct an argument</button></div>${fallacyCatalogHTML(all)}` : ""}
        <div class="label">Questions it asks</div>
        <ul class="bq-list">${b.q.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
        <div class="tconn">
          ${chipRow("Key terms", terms.map((g) => `<button class="chip tchip" data-term="${esc(g.id)}">${esc(g.t)}</button>`).join(""))}
          ${chipRow("Thinkers", thinkerChips(b.p))}
          ${chipRow("Connected branches and traditions", branchChips([...rel.get(b.id)]))}
        </div>
        ${pathsFor(b.id).length ? `<div class="crow"><span class="clabel">Reading path</span><div class="chips">${pathsFor(b.id).map((x) => `<button class="chip" data-path="${esc(x.id)}">${esc(x.n)}</button>`).join("")}</div></div>` : ""}
        <div class="label">Where to start</div>
        <ul class="bq-list">${b.st.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      </div></details>`; }).join("")}</div></section>`;
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>
    <header class="gl-head"><div><h1>Branches of philosophy</h1><div class="sub">${BRANCHES.filter((b) => b.k === "branch").length} branches and ${BRANCHES.filter((b) => b.k === "tradition").length} traditions</div></div></header>
    ${sec("branch", "Branches by subject", "The main fields of philosophy, defined by the questions they ask.")}
    ${sec("tradition", "Traditions and approaches", "Schools and lineages, defined by shared methods, problems and texts. They cut across the branches above.")}`;
}
