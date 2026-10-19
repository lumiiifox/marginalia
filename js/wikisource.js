// Marginalia: finding and importing public-domain texts from Wikisource. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- Wikisource: public-domain texts, fetched through its API (the same MediaWiki API Look up uses with Wiktionary) ----------
   A work's chapters are its subpages ("Title/Chapter 1"), linked in reading order from the main page (from its contents, ws-summary, when it
   marks one). Navigation and headers marked ws-noexport are dropped; page numbers become page breaks and references become notes. */
const WS_LANGS = { en: "English", fr: "French", de: "German", la: "Latin", el: "Greek", it: "Italian", es: "Spanish" };
const WS_MAX = 200; // pages fetched for one work at most
const wsApi = (lang, params) => `https://${lang}.wikisource.org/w/api.php?${new URLSearchParams({ ...params, format: "json", formatversion: "2", origin: "*" })}`;
async function wsJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error("http " + r.status); const j = await r.json(); if (j.error) throw new Error(j.error.info || "api"); return j; }
async function wsSearch(lang, q) {
  const j = await wsJSON(wsApi(lang, { action: "query", list: "search", srsearch: q, srnamespace: "0", srlimit: "15", srprop: "snippet" }));
  const text = (h) => clean(new DOMParser().parseFromString(`<body>${h || ""}</body>`, "text/html").body.textContent || "");
  return ((j.query && j.query.search) || []).map((h) => ({ title: h.title, snippet: text(h.snippet) }));
}
async function wsParse(lang, page) {
  const j = await wsJSON(wsApi(lang, { action: "parse", page, prop: "text|displaytitle", redirects: "1", disableeditsection: "1" }));
  return { title: j.parse.title, html: typeof j.parse.text === "string" ? j.parse.text : (j.parse.text && j.parse.text["*"]) || "" };
}
// One page's HTML: its metadata (ws-title, ws-author, ws-translator, ws-year), the subpages it links to in order, and its text made ready
// for the HTML importer.
function wsClean(html, title) {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html"), root = doc.querySelector(".mw-parser-output") || doc.body;
  const pick = (n) => clean((root.querySelector(`#${n}, .${n}`) || {}).textContent || "");
  const meta = { title: pick("ws-title"), author: pick("ws-author"), translator: pick("ws-translator"), year: pick("ws-year") };
  const pre = title.replace(/ /g, "_") + "/", from = root.querySelector(".ws-summary") || root, seen = new Set(), subs = [];
  for (const a of from.querySelectorAll("a[href]")) {
    let h = a.getAttribute("href").split("#")[0]; if (!h.startsWith("/wiki/") || a.closest(".ws-noexport")) continue;
    try { h = decodeURIComponent(h.slice(6)); } catch { continue; }
    if (!h.startsWith(pre)) continue;
    const t = h.replace(/_/g, " "); if (seen.has(t)) continue; seen.add(t); subs.push(t);
  }
  root.querySelectorAll(".ws-noexport, .mw-editsection, .noprint, script, style, link, .mw-cite-backlink, #toc, .toc, .ws-summary, .ws-noinclude").forEach((x) => x.remove());
  root.querySelectorAll(".ws-pagenum, .pagenum").forEach((x) => {
    const n = x.getAttribute("data-page-number") || (/^\d+$/.test(x.id) ? x.id : "") || x.textContent.replace(/[^\dIVXLCivxlc]/g, "");
    const pb = doc.createElement("span"); pb.setAttribute("role", "doc-pagebreak"); pb.setAttribute("aria-label", n); x.replaceWith(pb);
  });
  root.querySelectorAll("sup.reference").forEach((x) => { const n = x.textContent.replace(/\D/g, ""); const s = doc.createElement("sup"); s.textContent = n; x.replaceWith(s); });
  root.querySelectorAll("ol.references").forEach((x) => { const d = doc.createElement("div"); d.setAttribute("role", "doc-endnotes"); x.replaceWith(d); d.appendChild(x); });
  return { meta, subs, body: root.innerHTML };
}
// The whole work as one HTML file for the importer: chapters as headings, the metadata in <meta> tags.
async function wsFile(lang, page, say) {
  say("Fetching the work from Wikisource…");
  const main = await wsParse(lang, page), { meta: m, subs, body } = wsClean(main.html, main.title);
  const parts = [], queue = subs.map((t) => [t, 2]);
  let n = 0;
  // a page's text, its own opening heading (if it has one) taking the chapter's place and level, else the subpage's name above it
  const chapter = (html, name, lv) => {
    const d = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html"), first = [...d.body.querySelectorAll("*")].find((e) => e.textContent.trim() && (/^H[1-6]$/.test(e.tagName) || e.tagName === "P"));
    if (first && /^H[1-6]$/.test(first.tagName)) { const h = d.createElement(`h${lv}`); h.innerHTML = first.innerHTML; first.replaceWith(h); return d.body.innerHTML; }
    return `<h${lv}>${esc(name)}</h${lv}>${html}`;
  };
  const prose = (html) => [...new DOMParser().parseFromString(`<body>${html}</body>`, "text/html").body.querySelectorAll("p, blockquote, dd, .poem")].reduce((k, e) => k + e.textContent.trim().split(/\s+/).filter(Boolean).length, 0);
  if (!queue.length) parts.push(body);
  while (queue.length && n < WS_MAX) {
    const [t, lv] = queue.shift(); n++;
    say(`Fetching ${n} of ${n + queue.length}: ${t.slice(main.title.length + 1)}…`);
    const sub = wsClean((await wsParse(lang, t)).html, t);
    const words = new DOMParser().parseFromString(`<body>${sub.body}</body>`, "text/html").body.textContent.trim().split(/\s+/).length;
    if (sub.subs.length && words < 400 && lv < 4) { queue.unshift(...sub.subs.filter((x) => !queue.some(([q]) => q === x)).map((x) => [x, lv + 1])); parts.push(`<h${lv}>${esc(t.split("/").pop())}</h${lv}>`); continue; } // a contents page: its own chapters, in place
    parts.push(chapter(sub.body, t.split("/").pop(), lv));
  }
  if (queue.length) say(`This work has more than ${WS_MAX} pages; the first ${WS_MAX} were fetched.`);
  const title = m.title || main.title.split("/")[0], ed = m.translator ? `trans. ${m.translator}` : "";
  const head = `<title>${esc(title)}</title><meta name="author" content="${esc(m.author)}"><meta name="marginalia:edition" content="${esc(ed)}"><meta name="marginalia:year" content="${esc(m.year)}"><meta name="marginalia:lang" content="${esc(lang)}">`;
  if (prose(parts.join("")) < 12) throw new UErr("That page has no text to read: it may be a list of editions or an author's page. Choose one of the works it lists.");
  return new File([`<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8">${head}</head><body>${parts.join("\n")}</body></html>`], `${title.replace(/[\\/:*?"<>|]/g, "")} (Wikisource ${lang}).html`, { type: "text/html" });
}

const coverField = (t, url) => `<div class="field">
    <span class="flabel">Cover</span>
    <div class="coverpick">
      <div class="coverprev" id="c-prev">${coverHTML(t, url)}</div>
      <div class="coverctl">
        <span class="btn filebtn">Choose image<input id="c-file" type="file" accept="image/*" aria-label="Choose a cover image"></span>
        <button type="button" class="btn ghost" id="c-remove"${url ? "" : " hidden"}>Remove cover</button>
        <p class="hint" id="c-hint">A photo or image of the cover. PDFs and EPUBs fill this in for you when you load the book.</p>
      </div>
    </div>
  </div>`;
// cover.blob: undefined = leave as is, null = remove, Blob = new cover. cover.auto = it came from the book file.
function wireCover(root, cover, getT) {
  const prev = $("#c-prev", root), rm = $("#c-remove", root), hint = $("#c-hint", root), inp = $("#c-file", root);
  let url = null;
  cover.show = (blob) => {
    if (url) { URL.revokeObjectURL(url); url = null; }
    if (blob) url = URL.createObjectURL(blob);
    const base = blob === undefined ? cover.current : url;
    prev.innerHTML = coverHTML(getT(), base);
    rm.hidden = !base;
    cover.hasImg = !!base;
  };
  cover.hasImg = !!cover.current;
  inp.addEventListener("change", async () => {
    const f = inp.files && inp.files[0]; inp.value = ""; if (!f) return;
    hint.textContent = "Preparing the image…"; hint.classList.remove("bad");
    try { cover.blob = await toCover(f); cover.auto = false; cover.show(cover.blob); hint.textContent = "New cover ready. It's saved when you tap Save."; }
    catch (e) { hint.textContent = e instanceof UErr ? e.message : "That image couldn't be opened. Use a JPEG or PNG."; hint.classList.add("bad"); }
  });
  rm.addEventListener("click", () => { cover.blob = null; cover.auto = false; cover.show(null); hint.textContent = "The cover will be removed when you tap Save."; });
  root.addEventListener("input", (e) => { if ((e.target.id === "f-title" || e.target.id === "f-author") && !cover.hasImg) prev.innerHTML = coverHTML(getT(), null); });
}
async function saveCover(tid, cover) {
  if (cover.blob === undefined) return;
  if (cover.blob) await put("covers", tid, cover.blob); else await del("covers", tid);
}

function textSheet(id) {
  const t = id ? S.texts.get(id) : {};
  let parsed = null; const auto = {};
  const cover = { blob: undefined, auto: false, current: id ? coverURL(id) : null };
  openSheet(`<h2>${id ? "Edit text" : "Add a text"}</h2>
    ${id ? "" : fileField()}
    <div class="field"><label for="f-title">Title</label><input id="f-title" name="title" value="${esc(t.title)}" required></div>
    <div class="row2">
      <div class="field"><label for="f-author">Author</label><input id="f-author" name="author" value="${esc(t.author)}"></div>
      <div class="field"><label for="f-status">Status</label><select id="f-status" name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${(t.status || "reading") === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
    </div>
    <div class="field"><label for="f-edition">Edition or translation</label><input id="f-edition" name="edition" value="${esc(t.edition)}" placeholder="e.g. trans. Edwin Curley"><span class="hint">Page numbers in your notes refer to this edition.</span></div>
    <div class="field"><label for="f-pub">Publisher</label><input id="f-pub" name="publisher" value="${esc(t.publisher)}"></div>
    <div class="field"><label for="f-lang">Language of the text</label><select id="f-lang" name="lang"><option value="">Worked out from the text</option>${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${t.lang === k ? "selected" : ""}>${v}</option>`).join("")}</select><span class="hint">Swipe pages break words at line ends by this language's rules.</span></div>
    <div class="row2">
      <div class="field"><label for="f-year">Year of this edition</label><input id="f-year" name="year" value="${esc(t.year)}" inputmode="numeric" autocomplete="off"></div>
      <div class="field"><label for="f-orig">First published</label><input id="f-orig" name="orig" value="${esc(t.orig)}" inputmode="numeric" autocomplete="off" placeholder="e.g. 1677"></div>
    </div>
    ${coverField(t, cover.current)}
    <div class="field"><label for="f-secs">Sections</label><textarea id="f-secs" name="sections" rows="5">${esc((t.sections || []).map((s) => s.label).join("\n"))}</textarea><span class="hint">One per line: chapters, essays, plateaus, lectures.${id && t.hasContent ? " To set where a chapter starts in the text, select its title in the reader and choose Edit." : ""}</span></div>`,
  async (fd) => {
    const title = fd.get("title").trim(); if (!title) return "Give the text a title.";
    const old = (t.sections && t.sections.length) ? t.sections : parsed ? parsed.sections : [];
    // A line kept as it was keeps its section; with as many lines as before, a renamed line keeps the section in its place.
    const lines = fd.get("sections").split("\n").map((l) => l.trim()).filter(Boolean), used = new Set();
    const byLabel = lines.map((label) => { const p = old.find((s) => s.label === label && !used.has(s.id)); if (p) used.add(p.id); return p; });
    const sections = lines.map((label, k) => {
      let prev = byLabel[k];
      if (!prev && lines.length === old.length && old[k] && !used.has(old[k].id)) { prev = old[k]; used.add(prev.id); }
      return prev ? { ...prev, label } : { id: gid(), label, done: false };
    });
    const tid = id || gid();
    const data = { ...(id ? t : { createdAt: Date.now() }), ...(fd.get("lang") ? { lang: fd.get("lang") } : {}), title, author: fd.get("author").trim(), edition: fd.get("edition").trim(), publisher: fd.get("publisher").trim(), year: fd.get("year").trim(), orig: (fd.get("orig") || "").trim(), status: fd.get("status"), sections, updatedAt: Date.now() };
    if (!fd.get("lang")) delete data.lang; // worked out from the text
    if (id && (t.status || "reading") !== data.status) delete data.rank; // another shelf: its front
    if (parsed) {
      linkHeadings(parsed.blocks, parsed.sections, sections);
      const prog = $("#f-prog"); const say = (m) => { if (prog) prog.textContent = m; };
      await saveContent(tid, parsed.blocks, say);
      Object.assign(data, { hasContent: true, source: { name: parsed.name, kind: parsed.kind, pages: parsed.pages }, pos: 0, total: parsed.blocks.length });
      if (parsed.file && fd.get("keeppdf")) { await keepPdf(tid, parsed.file); data.pdfLabels = parsed.labels; }
      if (!fd.get("lang")) data.lang = parsed.lang;
    }
    await saveCover(tid, cover);
    // A section taken off the list stops being a chapter in the text: its title stays, as a heading.
    const gone = new Set(old.map((s) => s.id).filter((x) => !sections.some((s) => s.id === x)));
    const blocks = id && t.hasContent && gone.size ? await loadContent(tid) : null;
    if (blocks && blocks.some((b) => b.s && gone.has(b.s))) {
      const next = blocks.map((b) => { if (!b.s || !gone.has(b.s)) return b; const c = { ...b }; delete c.s; if (c.st === "chapter") c.st = "heading"; return c; });
      if (idb) await idbTx(["content", "texts"], (st) => { st("content").put(next, tid); st("texts").put(data, tid); });
      S.content.set(tid, next); S.texts.set(tid, data); render();
    } else await put("texts", tid, data);
    if (!S.texts.has(tid)) S.texts.set(tid, data);
    if (!id) return () => { go({ screen: "text", textId: tid }); if (parsed && parsed.marks && parsed.marks.length) offerMarks(tid, parsed.marks, parsed.nPages); };
  },
  (root) => {
    const getT = () => ({ title: $("#f-title", root).value.trim() || "Untitled", author: $("#f-author", root).value.trim() });
    wireCover(root, cover, getT);
    if (id) return;
    wireFile(root, (r) => {
      parsed = r; if (!r) return;
      const fill = (sel, key, val) => { const el = $(sel, root); if (el && (!el.value.trim() || el.value === auto[key])) { el.value = val; auto[key] = val; } };
      fill("#f-title", "title", r.title);
      if (r.author) fill("#f-author", "author", r.author);
      if (r.edition) fill("#f-edition", "edition", r.edition);
      if (r.year) fill("#f-year", "year", r.year);
      fill("#f-secs", "secs", r.sections.map((s) => s.label).join("\n"));
      if (cover.blob === undefined || cover.auto) {
        if (r.cover) { cover.blob = r.cover; cover.auto = true; cover.show(r.cover); }
        else if (cover.auto) { cover.blob = undefined; cover.auto = false; cover.show(undefined); }
        else cover.show(undefined);
      }
    });
  });
}

function fileSheet(tid) {
  const t = S.texts.get(tid); let parsed = null;
  openSheet(`<h2>${t.hasContent ? "Replace the text" : "Load the text"}</h2><p class="sub">${esc(t.title)}</p>${fileField()}
    ${t.hasContent ? `<p class="hint">Your notes stay. Their "Show in text" links may land in the wrong place in the new version.</p>` : ""}`,
  async (fd) => {
    if (!parsed) return "Choose a file first.";
    const cur = S.texts.get(tid) || t;
    const sections = cur.sections && cur.sections.length ? cur.sections : parsed.sections.map((s) => ({ ...s, done: false }));
    linkHeadings(parsed.blocks, parsed.sections, sections);
    const prog = $("#f-prog"); const say = (m) => { if (prog) prog.textContent = m; };
    await saveContent(tid, parsed.blocks, say);
    if (parsed.cover && !S.covers.has(tid)) await put("covers", tid, parsed.cover);
    const next = { ...cur, sections, hasContent: true, source: { name: parsed.name, kind: parsed.kind, pages: parsed.pages }, pos: 0, total: parsed.blocks.length, updatedAt: Date.now() };
    delete next.pdfLabels; await dropPdf(tid);
    if (parsed.file && fd.get("keeppdf")) { await keepPdf(tid, parsed.file); next.pdfLabels = parsed.labels; }
    await put("texts", tid, next);
  },
  (root) => wireFile(root, (r) => { parsed = r; }));
}

// Your note's earlier wording is kept when you change it, unless you wrote it within the last half hour (fixing what you just wrote).
const REWORD_GRACE = 30 * 60 * 1000;
function noteSheet(nid, preset, focus) {
  const n0 = nid ? S.notes.get(nid) : null, tid = n0 ? n0.textId : (preset && preset.textId) || S.textId;
  const t = S.texts.get(tid);
  const n = nid ? n0 : { kind: "passage", sectionId: S.sec !== "all" ? S.sec : "", ...(preset || {}) };
  if (!t || !n) return;
  let links = (n.links || []).filter((x) => x !== nid && S.notes.has(x));
  let fus = (n.followups || []).slice(), was = (n.was || []).slice();
  openSheet(`<h2>${nid ? "Edit note" : preset ? "Save passage" : "Add a note"}</h2>
    <div class="row2">
      <div class="field"><label for="n-page">Page or locator</label><input id="n-page" name="page" value="${esc(n.page)}" placeholder="36, xii, A51/B75, §13" autocomplete="off"></div>
      <div class="field"><label for="n-kind">Kind</label><select id="n-kind" name="kind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}" ${n.kind === k ? "selected" : ""}>${v}</option>`).join("")}</select></div>
    </div>
    ${(t.sections || []).length ? `<div class="field"><label for="n-sec">Section</label><select id="n-sec" name="sectionId"><option value="">None</option>${t.sections.map((s) => `<option value="${esc(s.id)}" ${n.sectionId === s.id ? "selected" : ""}>${esc(s.label)}</option>`).join("")}</select></div>` : ""}
    <div class="field"><label for="n-passage">Passage, word for word</label><textarea id="n-passage" class="verbatim" name="passage">${esc(n.passage)}</textarea><span class="hint">${preset && preset.passage ? "Taken from the text. Fix any stray characters from the file." : "Copy exactly from the page. Keep your interpretation in the next box."}</span></div>
    <details class="optfield"${n.original ? " open" : ""}><summary>Original wording</summary><textarea id="n-orig" name="original" rows="3" aria-label="Original wording">${esc(n.original)}</textarea><span class="hint">For translations: the passage or a key term in the original language, such as Aufhebung or dispositif.</span></details>
    <div class="argfields" id="n-arg"${n.kind === "argument" ? "" : " hidden"}>
      <div class="field"><label for="n-prem">Premises, one per line</label><textarea id="n-prem" name="premises" rows="4" placeholder="Each thing strives to persevere in its being.">${esc((n.premises || []).join("\n"))}</textarea></div>
      <div class="field"><label for="n-conc">Conclusion</label><input id="n-conc" name="conclusion" value="${esc(n.conclusion)}"></div>
      <details class="optfield reconfold"><summary>How to set it out</summary>${reconSteps(false)}<span class="hint">Mark a premise you supplied yourself, for instance with “(mine)”. The full guide, with an example, is in Branches → Logic.</span></details>
    </div>
    <div class="field"><label for="n-gloss">Your note</label><textarea id="n-gloss" name="gloss">${esc(n.gloss)}</textarea><span class="hint">Add #tags anywhere in your note to collect it with related notes, like #naturalization.${nid ? " Changing it keeps what it said before, under Earlier wording, once it is more than half an hour old; changes within half an hour of writing it are treated as corrections and not kept." : ""}</span></div>
    ${nid ? `<div class="field fuedit"><label for="n-fu">Follow up</label><div id="n-fus"></div>
      <textarea id="n-fu" name="fu" rows="3" placeholder="What you think of it now, dated today"></textarea>
      <div id="n-was"></div></div>` : ""}
    <div class="field"><span class="flabel">Linked notes</span><div class="nlinks" id="n-links"></div>
      <input id="n-linkq" type="search" placeholder="Search your notes to link one" autocomplete="off" aria-label="Search your notes to link one"><div class="nlinkres" id="n-linkres"></div></div>`,
  async (fd) => {
    const passage = fd.get("passage").trim(), gloss = fd.get("gloss").trim(), kind = fd.get("kind"), original = (fd.get("original") || "").trim();
    const premises = kind === "argument" ? (fd.get("premises") || "").split("\n").map((x) => x.trim()).filter(Boolean) : [];
    const conclusion = kind === "argument" ? (fd.get("conclusion") || "").trim() : "";
    const fu = (fd.get("fu") || "").trim();
    if (!passage && !gloss && !premises.length && !conclusion && !original && !fu && !fus.length) return "Write a passage, a note, or both.";
    if (kind === "argument" && (!premises.length || !conclusion)) return "An argument needs at least one premise and a conclusion.";
    const data = { ...(nid ? n : { createdAt: Date.now() }), textId: tid, page: fd.get("page").trim(), kind, sectionId: fd.get("sectionId") || "", passage, gloss, updatedAt: Date.now() };
    if (kind === "argument") { data.premises = premises; data.conclusion = conclusion; } else { delete data.premises; delete data.conclusion; }
    if (original) data.original = original; else delete data.original;
    const keep = links.filter((x) => S.notes.has(x));
    if (keep.length) data.links = keep; else delete data.links;
    if (Number.isInteger(n.at)) data.at = n.at;
    if (n.anchor && !nid) data.anchor = n.anchor;
    // what your note said before, when you change it later
    if (nid) {
      const words = (x) => JSON.stringify([x.gloss || "", x.premises || [], x.conclusion || ""]);
      const now = Date.now(), wrote = n.wordAt || n.createdAt || 0;
      if (words(data) !== words(n) && now - wrote > REWORD_GRACE) {
        if (n.gloss || n.conclusion || (n.premises || []).length) {
          const w = { at: wrote }; if (n.gloss) w.gloss = n.gloss; if ((n.premises || []).length) { w.premises = n.premises; w.conclusion = n.conclusion || ""; }
          was.push(w);
        }
        data.wordAt = now; // the new wording's date, and the start of its own half hour
      }
      if (fu) fus.push({ id: gid(), at: now, x: fu });
      if (fus.length) data.followups = fus; else delete data.followups;
      if (was.length) data.was = was; else delete data.was;
    }
    delete data.example;
    await put("notes", nid || gid(), data);
    const cur = S.texts.get(tid);
    if (cur) put("texts", tid, { ...cur, activeAt: Date.now() }).catch(() => {});
  },
  (root) => {
    const kindSel = $("#n-kind", root), argBox = $("#n-arg", root);
    kindSel.addEventListener("change", () => { argBox.hidden = kindSel.value !== "argument"; });
    // linking: search all notes, tap to link, tap a chip to unlink
    const box = $("#n-links", root), q = $("#n-linkq", root), res = $("#n-linkres", root);
    const draw = () => {
      box.innerHTML = links.map((x) => { const m = S.notes.get(x); return m ? `<button type="button" class="chip lchip" data-unlink="${esc(x)}" aria-label="Remove link to ${esc(noteWhere(m, false))}">${esc(noteWhere(m, m.textId === tid))}<span aria-hidden="true"> ✕</span></button>` : ""; }).join("");
      box.hidden = !links.length;
    };
    const search = () => {
      const f = fold(q.value.trim());
      if (f.length < 2) { res.innerHTML = ""; return; }
      const hits = [...S.notes.entries()].filter(([x, m]) => x !== nid && !links.includes(x) && fold([m.passage, m.gloss, m.conclusion, m.original, m.page, (S.texts.get(m.textId) || {}).title, ...fuTexts(m)].join(" ")).includes(f)).slice(0, 6);
      res.innerHTML = hits.map(([x, m]) => `<button type="button" class="lrow" data-link="${esc(x)}"><b>${esc(noteWhere(m, false))}</b><span>${esc(noteSnippet(m, 80))}</span></button>`).join("") || `<p class="hint">No notes match.</p>`;
    };
    q.addEventListener("input", search);
    q.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.link) { links.push(b.dataset.link); q.value = ""; res.innerHTML = ""; draw(); }
      else if (b.dataset.unlink) { links = links.filter((x) => x !== b.dataset.unlink); draw(); }
    });
    draw();
    if (preset) { const g = $("#n-gloss", root); if (g) g.focus(); }
    if (!nid) return;
    // follow-ups and earlier wordings: removed here, gone when you save
    const fuBox = $("#n-fus", root), wasBox = $("#n-was", root);
    const drawFu = () => {
      fuBox.innerHTML = fus.map((f) => `<div class="furow"><p class="fu"><span class="fud">${esc(fmtDate(f.at))}</span>${esc(f.x)}</p><button type="button" class="btn ghost" data-unfu="${esc(f.id)}" aria-label="Remove the follow-up of ${esc(fmtDate(f.at))}">✕</button></div>`).join("");
      wasBox.innerHTML = was.length ? `<details class="earlier"><summary>Earlier wording${was.length > 1 ? `s (${was.length})` : ""}</summary>${was.map((w, k) => `<div class="furow">${wasHTML(w)}<button type="button" class="btn ghost" data-unwas="${k}" aria-label="Remove the wording of ${esc(fmtDate(w.at))}">✕</button></div>`).reverse().join("")}</details>` : "";
    };
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.unfu) { fus = fus.filter((f) => f.id !== b.dataset.unfu); drawFu(); }
      else if (b.dataset.unwas) { was.splice(+b.dataset.unwas, 1); drawFu(); const d = $("#n-was details", root); if (d) d.open = true; }
    });
    drawFu();
    if (focus === "fu") { const f = $("#n-fu", root); f.focus(); f.scrollIntoView({ block: "center" }); }
    const acts = $(".formacts", root);
    acts.insertAdjacentHTML("afterbegin", `<button type="button" class="btn ghost danger sheet-del" id="n-del">Delete note</button>`);
    const delBtn = $("#n-del", root);
    delBtn.insertAdjacentHTML("afterend", `<button type="button" class="btn ghost" id="n-pin">Pin</button>`);
    $("#n-pin", root).addEventListener("click", () => closeOverlay().then(() => pinNote(nid)));
    delBtn.addEventListener("click", () => arm(delBtn, async () => {
      try { const tid = await trashAndRemove("note", (S.texts.get(n.textId) || {}).title || "", [["notes", nid, S.notes.get(nid)]]); render(); await closeOverlay(); delToast("Note deleted.", tid); }
      catch (e) { if (!e.noRoom) $("#err", root).textContent = failMsg(e); }
    }));
  });
}

function summarySheet(tid, secId) {
  const t = S.texts.get(tid), sec = t && (t.sections || []).find((s) => s.id === secId);
  if (!sec) return;
  const cur = (t.summaries || {})[secId] || "";
  openSheet(`<h2>Summary of ${esc(sec.label)}</h2>
    <div class="field"><label for="s-text">In your own words</label><textarea id="s-text" name="summary" rows="7">${esc(cur)}</textarea>
    <span class="hint">What does this section claim, and how does it get there? Leave it empty to remove the summary. Summaries are
    kept with the book and come out with its notes when you export them.</span></div>`,
  async (fd) => {
    const now = S.texts.get(tid); if (!now) return;
    const summaries = { ...(now.summaries || {}) }, v = fd.get("summary").trim();
    if (v) summaries[secId] = v; else delete summaries[secId];
    await put("texts", tid, { ...now, summaries, updatedAt: Date.now() });
  });
}
