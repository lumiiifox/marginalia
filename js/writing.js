// Marginalia: drafts, comparisons, the concordance, search across all books, and exports (including Anki). One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- drafts: notes, headings and your own paragraphs, in order, exported with citations ---------- */
const draftsList = () => [...S.drafts.entries()].sort(([, a], [, b]) => (b.updatedAt || 0) - (a.updatedAt || 0));
const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");
function draftStats(d) {
  const items = d.items || [], notes = items.filter((x) => x.t === "note" && S.notes.has(x.id));
  const texts = new Set(notes.map((x) => S.notes.get(x.id).textId)).size;
  const paras = items.filter((x) => x.t === "p").length;
  return { notes: notes.length, texts, paras, heads: items.filter((x) => x.t === "h").length };
}
function draftsView() {
  const list = draftsList();
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>${banner()}
    <header class="gl-head"><div><h1>Drafts</h1><div class="sub">${list.length} draft${list.length === 1 ? "" : "s"}</div></div><button class="btn primary" id="newdraft">New draft</button></header>
    <p class="hint">Gather notes from any of your texts, put them in order, add headings and your own paragraphs, then export an outline with footnotes and a bibliography in your citation style.</p>
    ${list.length ? `<div class="gl-list">${list.map(([id, d]) => { const st = draftStats(d); return `<button class="thinkrow" data-draft="${esc(id)}"><b>${esc(d.title || "Untitled draft")}</b><span class="ty">${esc(fmtDate(d.updatedAt))}</span><span class="td">${st.notes} note${st.notes === 1 ? "" : "s"}${st.texts ? ` from ${st.texts} text${st.texts === 1 ? "" : "s"}` : ""}${st.paras ? `, ${st.paras} paragraph${st.paras === 1 ? "" : "s"} of your own` : ""}</span></button>`; }).join("")}</div>`
      : `<p class="empty"><b>No drafts yet.</b> Start one here, or use “Add to draft” on any note.</p>`}`;
}
function draftItemHTML(it, k, last) {
  const ctl = `<div class="dctl">
      <button class="btn ghost ricon" data-dmove="${k}:-1" aria-label="Move up"${k === 0 ? " disabled" : ""}>↑</button>
      <button class="btn ghost ricon" data-dmove="${k}:1" aria-label="Move down"${k === last ? " disabled" : ""}>↓</button>
      ${it.t === "note" ? (S.notes.has(it.id) ? `<button class="btn ghost" data-editnote="${esc(it.id)}">Edit note</button>` : "") : `<button class="btn ghost" data-dedit="${k}">Edit</button>`}
      <button class="btn ghost" data-dremove="${k}">Remove</button>
    </div>`;
  if (it.t === "h") return `<div class="ditem dh"><h2>${esc(it.x)}</h2>${ctl}</div>`;
  if (it.t === "p") return `<div class="ditem dp${it.x.startsWith(GUIDE) ? " dguide" : ""}"><p>${esc(it.x)}</p>${ctl}</div>`;
  const n = S.notes.get(it.id);
  if (!n) return `<div class="ditem dmissing"><p class="hint">This note was deleted.</p>${ctl}</div>`;
  const t = S.texts.get(n.textId);
  return `<div class="ditem dnote k-${esc(n.kind)}">
      <div class="meta"><button class="src" data-jump="${esc(it.id)}">${esc(noteWhere(n, false))}</button><span class="chip k-${esc(n.kind)}">${esc(KINDS[n.kind] || "Note")}</span></div>
      ${n.passage ? `<p class="passage"><span>${esc(n.passage)}</span></p>` : ""}
      ${n.original ? `<p class="orig"><span class="olabel">Original</span> ${esc(n.original)}</p>` : ""}
      ${n.kind === "argument" && n.premises && n.premises.length ? `<div class="argbox"><ol class="arg">${n.premises.map((p) => `<li>${esc(p)}</li>`).join("")}</ol><p class="argc"><span aria-hidden="true">∴</span> ${esc(n.conclusion)}</p></div>` : ""}
      ${n.gloss ? `<p class="gloss ${n.passage ? "after" : ""}">${esc(n.gloss)}</p>` : ""}
      ${t ? "" : `<p class="hint">Its text was deleted.</p>`}
      ${ctl}
    </div>`;
}
function draftView() {
  const id = S.draftId, d = S.drafts.get(id); if (!d) return draftsView();
  const items = d.items || [], st = draftStats(d);
  const src = d.from && S.compares.get(d.from);
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Drafts</button></div>${banner()}
    <header class="head">
      <h1>${esc(d.title || "Untitled draft")}</h1>
      ${src ? `<button class="src fromcmp" data-cmp="${esc(d.from)}">Made from the comparison “${esc(src.title || "Untitled comparison")}”</button>` : ""}
      <div class="srcline">${st.notes} note${st.notes === 1 ? "" : "s"}${st.texts ? ` from ${st.texts} text${st.texts === 1 ? "" : "s"}` : ""}, ${st.paras} paragraph${st.paras === 1 ? "" : "s"} of your own. Citations: ${esc(CITE_STYLES[citeStyle])}.</div>
      <div class="actions">
        <button class="btn primary" id="d-addnotes">Add notes</button>
        <button class="btn" id="d-addh">Heading</button>
        <button class="btn" id="d-addp">Paragraph</button>
        <button class="btn" id="d-export">Export</button>
        <button class="btn" id="d-more" aria-haspopup="dialog">More</button>
      </div>
    </header>
    <section class="group"><div class="dlist">${items.map((it, k) => draftItemHTML(it, k, items.length - 1)).join("") || `<p class="empty"><b>Nothing here yet.</b> Add notes from any of your texts, or write a heading or a paragraph of your own.</p>`}</div></section>`;
}
async function saveDraft(id, change) {
  const d = S.drafts.get(id); if (!d) return;
  await put("drafts", id, { ...d, ...change, updatedAt: Date.now() });
}
/* Essay templates for a new draft: headings, each followed by one line of guidance (a paragraph starting with GUIDE) that you
   write over or remove. Plain headings and paragraphs, the draft's usual items. */
const GUIDE = "Guide: ";
const ESSAY_TEMPLATES = [
  { id: "argue", n: "Argue for a thesis", d: "The usual philosophy essay: one claim, defended with reasons, against the strongest objection.", s: [
    ["Introduction", "State the problem and why it is one, then your thesis in a sentence. Skip the warm-up and the dictionary definitions."],
    ["The view at issue", "Explain the position or argument you're answering, accurately and charitably, in your own words, with page references for anything you quote."],
    ["My argument", "Give your reasons a step at a time. Every claim needs support, and the reader should always know which claims are yours and which the author's."],
    ["An objection", "The strongest objection a careful reader, or the author, would raise."],
    ["Reply", "Answer it, or say how your thesis has to change because of it."],
    ["Conclusion", "What you have shown, and what you haven't."]] },
  { id: "reconstruct", n: "Reconstruct an argument", d: "Set out a philosopher's argument as premises and a conclusion, then test it.", s: [
    ["The passage", "Where the argument is (book, chapter, pages) and the question it answers. Add the passage from your notes."],
    ["The argument", "Number the premises and state the conclusion. Add any premise the author assumes without saying, and mark it as yours."],
    ["Its terms", "The key words as the author uses them, where that differs from ordinary use."],
    ["Is it valid?", "If the premises were true, would the conclusion have to be? If not, what would have to be added?"],
    ["Are the premises true?", "Which premise is weakest, and what can be said for and against it?"],
    ["Conclusion", "How strong the argument is, and what it would take to make it stronger."]] },
  { id: "compare", n: "Compare two views", d: "Two answers to one question: what each says, where exactly they part, and which is better supported.", s: [
    ["The question", "The question both views answer, worded so that each side could accept your wording."],
    ["The first view", "Explain it charitably, with its best supporting reason."],
    ["The second view", "Explain it charitably, with its best supporting reason."],
    ["Where they agree", "Shared assumptions, which are often where the real disagreement hides."],
    ["Where they differ", "The exact point of disagreement, and what follows from it."],
    ["Assessment", "Which is better supported, and why; or why the question can't be settled between them."]] },
  { id: "close", n: "Close reading of a passage", d: "One passage read slowly: what it says, the words carrying it, and its place in the book.", s: [
    ["The passage", "Add the passage from your notes, and say where it sits in the book's argument."],
    ["What it says", "Go through it sentence by sentence, in your own words, before interpreting."],
    ["The words doing the work", "Terms, images and turns of phrase the passage depends on, and how they are used elsewhere in the book."],
    ["How it connects", "What it answers from earlier in the book, and what it sets up later."],
    ["What it shows", "Your reading, and what it leaves open."]] },
];
const templateItems = (tp) => tp.s.flatMap(([h, g]) => [{ t: "h", x: h }, { t: "p", x: GUIDE + g }]);
function draftTitleSheet(id, then) {
  const d = id ? S.drafts.get(id) : null;
  const pick = d ? "" : `<fieldset class="field tplpick"><legend>Start from</legend>
      <label class="tplopt"><input type="radio" name="tpl" value="" checked><span><b>A blank draft</b></span></label>
      ${ESSAY_TEMPLATES.map((tp) => `<label class="tplopt"><input type="radio" name="tpl" value="${tp.id}"><span><b>${esc(tp.n)}</b><small>${esc(tp.d)}</small><small class="tplsecs">${tp.s.map(([h]) => esc(h)).join(" · ")}</small></span></label>`).join("")}
      <span class="hint">A template gives you its headings, each with a line of guidance to write over or remove. The structure follows common advice on philosophy essays, such as Jim Pryor's Guidelines on Writing a Philosophy Paper.</span></fieldset>`;
  openSheet(`<h2>${d ? "Rename draft" : "New draft"}</h2>
    <div class="field"><label for="d-title">Title</label><input id="d-title" name="title" value="${esc(d ? d.title : "")}" placeholder="e.g. Conatus and capital" autocomplete="off"></div>${pick}`,
  async (fd) => {
    const tp = ESSAY_TEMPLATES.find((x) => x.id === fd.get("tpl"));
    const title = fd.get("title").trim() || (tp ? tp.n : "Untitled draft");
    if (d) { await saveDraft(id, { title }); return; }
    const nid = gid();
    await put("drafts", nid, { title, items: tp ? templateItems(tp) : [], createdAt: Date.now(), updatedAt: Date.now() });
    return () => (then ? then(nid) : go({ screen: "draft", draftId: nid }));
  });
}
function draftTextSheet(id, k, kind) {
  const d = S.drafts.get(id); if (!d) return;
  const cur = Number.isInteger(k) ? d.items[k] : null, t = cur ? cur.t : kind;
  openSheet(`<h2>${cur ? "Edit" : "Add"} ${t === "h" ? "heading" : "paragraph"}</h2>
    <div class="field"><label for="d-x">${t === "h" ? "Heading" : "Your paragraph"}</label>${t === "h" ? `<input id="d-x" name="x" value="${esc(cur ? cur.x : "")}" autocomplete="off">` : `<textarea id="d-x" name="x" rows="8">${esc(cur ? cur.x : "")}</textarea>`}</div>`,
  async (fd) => {
    const x = fd.get("x").trim(); if (!x) return t === "h" ? "Write the heading." : "Write the paragraph.";
    const items = [...(S.drafts.get(id).items || [])];
    if (cur) items[k] = { ...cur, x }; else items.push({ t, x });
    await saveDraft(id, { items });
  });
}
// Choose notes from anywhere: search, tap to select, then add them in one go.
function notePickerPanel(title, exclude, onDone) {
  const all = [...S.notes.entries()].filter(([id]) => !exclude.has(id)).sort(([, a], [, b]) => {
    const ta = (S.texts.get(a.textId) || {}).title || "", tb = (S.texts.get(b.textId) || {}).title || "";
    return ta.localeCompare(tb) || pnum(a.page) - pnum(b.page) || (a.createdAt || 0) - (b.createdAt || 0);
  });
  const chosen = new Set();
  openPanel(`<h2>${esc(title)}</h2>
    <input class="search" id="pk-q" type="search" placeholder="Search notes, titles and #tags" autocomplete="off" aria-label="Search notes">
    <div class="pk-list" id="pk-list"></div>
    <div class="pk-bar"><button class="btn primary" id="pk-add" disabled>Add notes</button></div>`, (b) => {
    if (b.dataset.pick) {
      const id = b.dataset.pick; if (chosen.has(id)) chosen.delete(id); else chosen.add(id);
      b.setAttribute("aria-pressed", chosen.has(id)); b.classList.toggle("on", chosen.has(id));
      const add = $("#pk-add"); add.disabled = !chosen.size; add.textContent = chosen.size ? `Add ${chosen.size} note${chosen.size === 1 ? "" : "s"}` : "Add notes";
      return;
    }
    if (b.id === "pk-add" && chosen.size) onDone([...all.map(([id]) => id).filter((id) => chosen.has(id))]);
  });
  const root = $("#sheetroot"), list = $("#pk-list", root), q = $("#pk-q", root);
  const draw = () => {
    const f = fold(q.value.trim());
    const rows = all.filter(([, n]) => !f || fold([n.passage, n.gloss, n.original, n.conclusion, n.page, (S.texts.get(n.textId) || {}).title, ...fuTexts(n)].join(" ")).includes(f)).slice(0, 150);
    list.innerHTML = rows.map(([id, n]) => `<button class="pkrow${chosen.has(id) ? " on" : ""}" data-keep="1" data-pick="${esc(id)}" aria-pressed="${chosen.has(id)}"><span class="pkbox" aria-hidden="true"></span><span class="pkt"><b>${esc(noteWhere(n, false))}</b><span>${esc(noteSnippet(n, 110))}</span></span></button>`).join("")
      || `<p class="empty">${all.length ? "No notes match." : exclude.size && S.notes.size ? "Every note is already in this draft." : "You have no notes to add yet."}</p>`;
  };
  q.addEventListener("input", draw);
  draw();
}
function addNotesToDraft(id, ids) {
  const d = S.drafts.get(id); if (!d) return;
  const have = new Set((d.items || []).filter((x) => x.t === "note").map((x) => x.id));
  const add = ids.filter((x) => !have.has(x));
  return saveDraft(id, { items: [...(d.items || []), ...add.map((x) => ({ t: "note", id: x }))] }).then(() => add.length);
}
function addToDraftPanel(ids) {
  const list = draftsList();
  openPanel(`<h2>Add to a draft</h2>
    <div class="menu">${list.map(([id, d]) => `<button class="menuitem" data-draft-add="${esc(id)}">${esc(d.title || "Untitled draft")}</button>`).join("")}
      <button class="menuitem" id="draft-new">New draft…</button></div>`, async (b) => {
    if (b.dataset.draftAdd) {
      const id = b.dataset.draftAdd, n = await addNotesToDraft(id, ids);
      toast(n ? `Added to “${S.drafts.get(id).title}”.` : `Already in “${S.drafts.get(id).title}”.`);
    } else if (b.id === "draft-new") {
      draftTitleSheet(null, async (nid) => { await addNotesToDraft(nid, ids); toast(`Started “${S.drafts.get(nid).title}” with this note.`); });
    }
  });
}
function draftMore(id) {
  const d = S.drafts.get(id); if (!d) return;
  openPanel(`<h2>${esc(d.title || "Untitled draft")}</h2>
    <div class="menu">
      <button class="menuitem" id="dm-rename">Rename</button>
      <button class="menuitem" id="dm-copy">Copy as formatted text</button>
      <button class="menuitem danger" id="dm-delete">Delete this draft</button>
    </div><p class="hint">Deleting a draft leaves its notes where they are.</p>`, (b) => {
    if (b.id === "dm-rename") draftTitleSheet(id);
    else if (b.id === "dm-copy") copyDraft(id);
    else if (b.id === "dm-delete") openPanel(`<h2>Delete “${esc(d.title)}”?</h2><div class="menu"><button class="menuitem danger" id="dm-delete-yes">Delete this draft</button></div>`, async (b2) => {
      if (b2.id !== "dm-delete-yes") return;
      await back();
      try { const tid = await trashAndRemove("draft", d.title || "Untitled draft", [["drafts", id, S.drafts.get(id)]]); render(); delToast("Draft deleted.", tid); } catch (e) { if (!e.noRoom) toast(failMsg(e)); }
    });
  });
}
// The draft as a document: blocks of text plus footnotes (Chicago notes) or parenthetical citations, and a bibliography.
function draftDoc(d, style) {
  const blocks = [], notes = [], cited = new Set();
  const cite = (tid, page) => {
    const t = S.texts.get(tid); if (!t) return null;
    const first = !cited.has(tid); cited.add(tid);
    if (style !== "note") return { inline: " " + citeAt(t, page, style, "plain") };
    notes.push({ t, page, short: !first });
    return { fn: notes.length };
  };
  for (const it of d.items || []) {
    if (it.t === "h") { blocks.push({ k: "h", x: it.x }); continue; }
    if (it.t === "p") { blocks.push({ k: "p", x: it.x }); continue; }
    const n = S.notes.get(it.id); if (!n) continue;
    if (n.passage) {
      const c = cite(n.textId, n.page);
      blocks.push({ k: "q", x: n.passage, orig: n.original || "", c });
    } else if (n.original) blocks.push({ k: "p", x: n.original, em: true });
    if (n.kind === "argument" && n.premises && n.premises.length) blocks.push({ k: "arg", prem: n.premises, conc: n.conclusion });
    if (n.gloss) blocks.push({ k: "p", x: n.gloss, c: n.passage ? null : cite(n.textId, n.page) });
  }
  return { blocks, notes, tids: [...cited] };
}
function draftMarkdown(id, style) {
  const d = S.drafts.get(id); if (!d) return "";
  const { blocks, notes, tids } = draftDoc(d, style);
  const out = [`# ${d.title || "Untitled draft"}`, ""];
  const mark = (c) => (c && c.fn ? `[^${c.fn}]` : c && c.inline ? c.inline : "");
  for (const b of blocks) {
    if (b.k === "h") out.push(`## ${b.x}`, "");
    else if (b.k === "q") {
      const lines = b.x.split(/\n+/);
      lines[lines.length - 1] += mark(b.c);
      out.push(...lines.map((l) => `> ${l}`));
      if (b.orig) out.push(">", ...b.orig.split(/\n+/).map((l) => `> *${l}*`));
      out.push("");
    } else if (b.k === "arg") { b.prem.forEach((p, k) => out.push(`${k + 1}. ${p}`)); out.push("", `**Therefore:** ${b.conc}`, ""); }
    else out.push(`${b.em ? `*${b.x}*` : b.x}${mark(b.c)}`, "");
  }
  if (notes.length) out.push(...notes.map((f, k) => `[^${k + 1}]: ${citeAt(f.t, f.page, "note", "md", f.short)}`), "");
  const bib = bibliography(tids, style, "md");
  if (bib.length) out.push(`## ${BIB_HEAD[style]}`, "", ...bib.flatMap((x) => [x, ""]));
  return out.join("\n");
}
function draftHTMLDoc(id, style) {
  const d = S.drafts.get(id); if (!d) return "";
  const { blocks, notes, tids } = draftDoc(d, style);
  const mark = (c) => (c && c.fn ? `<sup>${c.fn}</sup>` : c && c.inline ? esc(c.inline) : "");
  const body = blocks.map((b) => b.k === "h" ? `<h2>${esc(b.x)}</h2>`
    : b.k === "q" ? `<blockquote><p>${esc(b.x)}${mark(b.c)}</p>${b.orig ? `<p><i>${esc(b.orig)}</i></p>` : ""}</blockquote>`
    : b.k === "arg" ? `<ol>${b.prem.map((p) => `<li>${esc(p)}</li>`).join("")}</ol><p><b>Therefore:</b> ${esc(b.conc)}</p>`
    : `<p>${b.em ? `<i>${esc(b.x)}</i>` : esc(b.x)}${mark(b.c)}</p>`).join("");
  const fns = notes.length ? `<h2>Notes</h2><ol>${notes.map((f) => `<li>${citeAt(f.t, f.page, "note", "html", f.short)}</li>`).join("")}</ol>` : "";
  const bib = bibliography(tids, style, "html");
  return `<h1>${esc(d.title || "Untitled draft")}</h1>${body}${fns}${bib.length ? `<h2>${BIB_HEAD[style]}</h2>${bib.map((x) => `<p>${x}</p>`).join("")}` : ""}`;
}
function exportDraft(id) {
  const d = S.drafts.get(id); if (!d) return;
  if (!(d.items || []).length) return toast("This draft is empty.");
  saveFile(`${slug(d.title)}-draft.md`, draftMarkdown(id, citeStyle), "text/markdown").catch(() => toast("Couldn't export the draft."));
}
async function copyDraft(id) {
  const d = S.drafts.get(id); if (!d) return;
  const ok = await copyRich(draftHTMLDoc(id, citeStyle), draftMarkdown(id, citeStyle));
  toast(ok ? "Copied. Paste it into a document; footnotes come as numbered notes at the end." : "Couldn't copy. Your browser blocked the clipboard.");
}
function moveDraftItem(id, k, dir) {
  const d = S.drafts.get(id); if (!d) return;
  const items = [...(d.items || [])], j = k + dir;
  if (j < 0 || j >= items.length) return;
  [items[k], items[j]] = [items[j], items[k]];
  return saveDraft(id, { items });
}
function removeDraftItem(id, k) {
  const d = S.drafts.get(id); if (!d) return;
  const items = [...(d.items || [])]; items.splice(k, 1);
  return saveDraft(id, { items });
}

/* ---------- comparisons: the same questions put to two to four thinkers, texts or concepts, each answer backed by your notes ---------- */
const CMP_MAX = 4;
const CMP_TEMPLATES = {
  pos: { n: "Two positions: thinkers, texts or arguments", rows: ["What problem is at stake?", "The central claim", "What supports it", "What it takes for granted", "The strongest objection to it", "The key passage"] },
  con: { n: "Two concepts", rows: ["Working definition", "Who uses it, and where", "What it is set against", "An example", "What it struggles to explain"] },
  blank: { n: "Start blank", rows: [] },
};
const ORD = ["First", "Second", "Third", "Fourth"];
let cmpMode = "rows";
try { if (localStorage.getItem("mg-cmpview") === "table") cmpMode = "table"; } catch {}
const cmpList = () => [...S.compares.entries()].sort(([, a], [, b]) => (b.updatedAt || 0) - (a.updatedAt || 0));
const cellKey = (r, col) => `${r}|${col}`;
const cellOf = (c, r, col) => (c.cells || {})[cellKey(r, col)] || null;
const liveNotes = (cell) => ((cell && cell.notes) || []).filter((id) => S.notes.has(id));
const cellHas = (cell) => !!(cell && (String(cell.x || "").trim() || liveNotes(cell).length));
const oneLine = (s) => String(s || "").replace(/\s+/g, " ").trim();
// Your own column is labelled as yours wherever it goes.
const colHead = (col) => (col.own && !/\byour view\b/i.test(col.label) ? `${col.label} (your view)` : col.label);
const isPassage = (n) => !!(n && String(n.passage || "").trim());
// Evidence means a quoted passage. Your own notes can be linked too, but they don't count as evidence.
const cellPassages = (cell) => liveNotes(cell).filter((id) => isPassage(S.notes.get(id)));
const cmpEvidence = (n) => (isPassage(n) ? `“${noteSnippet(n, 150)}”` : noteSnippet(n, 150));
const evWhere = (n) => noteWhere(n, false) + (isPassage(n) ? "" : " · your note");

// A side draws on a text ("t:id"), an author ("a:Name"), one of your tags ("#tag"), or all your notes ("").
function srcName(src) {
  if (!src) return "";
  if (src.startsWith("t:")) { const t = S.texts.get(src.slice(2)); return t ? shortTitleOf(t.title) : "A deleted text"; }
  if (src.startsWith("a:")) return familyName(src.slice(2));
  return src;
}
function srcDesc(src) {
  if (!src) return "All your notes";
  if (src.startsWith("t:")) { const t = S.texts.get(src.slice(2)); return t ? t.title : "A deleted text"; }
  if (src.startsWith("a:")) return `Texts by ${src.slice(2)}`;
  return `Notes tagged ${src}`;
}
function srcFilter(src) {
  if (!src) return () => true;
  if (src.startsWith("t:")) { const tid = src.slice(2); return (n) => n.textId === tid; }
  if (src.startsWith("a:")) {
    const who = fold(src.slice(2));
    const tids = new Set([...S.texts].filter(([, t]) => creatorsOf(t).names.some((x) => fold(x) === who)).map(([id]) => id));
    return (n) => tids.has(n.textId);
  }
  const tg = src.slice(1).toLowerCase();
  return (n) => tagsOf(n).includes(tg);
}
function srcOptions(sel) {
  const o = (v, label) => `<option value="${esc(v)}"${v === sel ? " selected" : ""}>${esc(label)}</option>`;
  const authors = new Map();
  for (const t of S.texts.values()) for (const n of creatorsOf(t).names) if (!authors.has(fold(n))) authors.set(fold(n), n);
  const names = [...authors.values()].sort((a, b) => fold(familyName(a)).localeCompare(fold(familyName(b))));
  const texts = [...S.texts.entries()].sort(([, a], [, b]) => (a.title || "").localeCompare(b.title || ""));
  const tags = allTags();
  const known = !sel || names.some((n) => "a:" + n === sel) || texts.some(([id]) => "t:" + id === sel) || tags.some(([tg]) => "#" + tg === sel);
  return `${o("", "All your notes")}${known ? "" : o(sel, srcDesc(sel))}
    ${names.length ? `<optgroup label="Authors">${names.map((n) => o("a:" + n, n)).join("")}</optgroup>` : ""}
    ${texts.length ? `<optgroup label="Texts">${texts.map(([id, t]) => o("t:" + id, t.title || "Untitled")).join("")}</optgroup>` : ""}
    ${tags.length ? `<optgroup label="Your tags">${tags.map(([tg]) => o("#" + tg, "#" + tg)).join("")}</optgroup>` : ""}`;
}
// Gaps: a question a side hasn't answered, or an answer about a text with no passage behind it. Your own view may stand without one.
function cmpStats(c) {
  const cols = c.cols || [], rows = c.rows || [];
  let answered = 0, backed = 0, unbacked = 0;
  for (const r of rows) for (const col of cols) {
    const cell = cellOf(c, r.id, col.id);
    if (!cellHas(cell)) continue;
    answered++;
    if (cellPassages(cell).length) backed++; else if (!col.own) unbacked++;
  }
  return { total: rows.length * cols.length, answered, backed, unbacked };
}
const cellGap = (c, r, col) => { const cell = cellOf(c, r.id, col.id); return !cellHas(cell) || (!col.own && !cellPassages(cell).length); };
const rowHasGap = (c, r) => (c.cols || []).some((col) => cellGap(c, r, col));
// Each side keeps its colour when sides are moved; your own view is always brass.
function sideVar(c, col) {
  if (col.own) return "--side:var(--s-own)";
  const k = col.hue || (c.cols || []).filter((x) => !x.own).indexOf(col) + 1;
  return `--side:var(--s${((Math.max(1, k) - 1) % 4) + 1})`;
}
const freeHue = (cols) => { const used = new Set(cols.filter((x) => !x.own).map((x) => x.hue)); for (let h = 1; h <= 4; h++) if (!used.has(h)) return h; return 1; };
async function saveCmp(id, change) {
  const c = S.compares.get(id); if (!c) return;
  await put("compares", id, { ...c, ...change, updatedAt: Date.now() });
}

function comparesView() {
  const list = cmpList();
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>${banner()}
    <header class="gl-head"><div><h1>Comparisons</h1><div class="sub">${list.length} comparison${list.length === 1 ? "" : "s"}</div></div><button class="btn primary" id="newcmp">New comparison</button></header>
    <p class="hint">Put two to four thinkers, texts or concepts side by side and answer the same questions for each, backing every answer with passages from your notes. Empty answers, and answers about a text with no passage behind them, show up as gaps.</p>
    ${list.length ? `<div class="gl-list">${list.map(([id, c]) => { const st = cmpStats(c); return `<button class="thinkrow" data-cmp="${esc(id)}"><b>${esc(c.title || "Untitled comparison")}</b><span class="ty">${esc(fmtDate(c.updatedAt))}</span><span class="td">${esc((c.cols || []).map((x) => x.label).join(" · "))}${st.total ? `. ${st.answered} of ${st.total} answered` : ""}</span></button>`; }).join("")}</div>`
      : `<p class="empty"><b>No comparisons yet.</b> ${S.notes.size ? "Start one, choose the sides, and answer each question from your notes." : "Save some notes first: a comparison is built from them."}</p>`}`;
}
function cmpCellHTML(c, r, col) {
  const cell = cellOf(c, r.id, col.id), has = cellHas(cell), ev = liveNotes(cell), gap = !col.own && has && !cellPassages(cell).length;
  return `<div class="cmp-cell${col.own ? " own" : ""}${has ? "" : " empty"}" style="${sideVar(c, col)}">
      <div class="cmp-ch"><span class="cmp-sl">${esc(col.label)}</span>${gap ? `<span class="cmp-flag">No passage yet</span>` : ""}<button class="btn ghost" data-cell="${esc(cellKey(r.id, col.id))}">${has ? "Edit" : "Answer"}</button></div>
      ${cell && cell.x ? `<p class="cmp-x">${esc(cell.x)}</p>` : ""}
      ${ev.map((nid) => { const n = S.notes.get(nid); return `<button class="lrow${isPassage(n) ? "" : " mine"}" data-jump="${esc(nid)}"><b>${esc(evWhere(n))}</b><span>${esc(cmpEvidence(n))}</span></button>`; }).join("")}
    </div>`;
}
function cmpRowsHTML(c, rows) {
  const all = c.rows || [];
  return `<div class="cmp-rows">${rows.map((r) => { const k = all.indexOf(r); return `<article class="cmp-row" data-row="${esc(r.id)}">
    <h2><span class="num">${k + 1}.</span> ${esc(r.q)}</h2>
    ${(c.cols || []).map((col) => cmpCellHTML(c, r, col)).join("")}
    <div class="dctl">
      <button class="btn ghost ricon" data-cmove="${esc(r.id)}:-1" aria-label="Move question up"${k === 0 ? " disabled" : ""}>↑</button>
      <button class="btn ghost ricon" data-cmove="${esc(r.id)}:1" aria-label="Move question down"${k === all.length - 1 ? " disabled" : ""}>↓</button>
      <button class="btn ghost" data-crow="${esc(r.id)}">Edit question</button>
    </div></article>`; }).join("")}</div>`;
}
function cmpTableHTML(c, rows) {
  const cols = c.cols || [], all = c.rows || [];
  return `${cols.length > 2 ? `<p class="hint cmp-swipe">Swipe the table sideways to see all ${cols.length} sides.</p>` : ""}<div class="cmp-wrap"><table class="cmp-table">
    <thead><tr><th class="cmp-corner" scope="col">Question</th>${cols.map((col) => `<th scope="col" class="${col.own ? "own" : ""}" style="${sideVar(c, col)}"><span class="cmp-sl">${esc(col.label)}</span></th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr><th scope="row"><button class="cmp-rq" data-crow="${esc(r.id)}"><span class="num">${all.indexOf(r) + 1}.</span> ${esc(r.q)}</button></th>${cols.map((col) => {
      const cell = cellOf(c, r.id, col.id), has = cellHas(cell), ev = liveNotes(cell), np = cellPassages(cell).length, gap = !col.own && has && !np;
      const counts = [np ? `${np} passage${np === 1 ? "" : "s"}` : "", ev.length - np ? `${ev.length - np} note${ev.length - np === 1 ? "" : "s"} of yours` : ""].filter(Boolean).join(" · ");
      const first = !cell || cell.x || !ev.length ? "" : `<span class="cmp-tx q">${esc(cmpEvidence(S.notes.get(ev[0])))}</span>`;
      return `<td class="${has ? "" : "empty"}" style="${sideVar(c, col)}"><button class="cmp-tc" data-cell="${esc(cellKey(r.id, col.id))}">${has
        ? `${cell.x ? `<span class="cmp-tx">${esc(cell.x)}</span>` : first}${counts ? `<span class="cmp-ev">${counts}</span>` : ""}${gap ? `<span class="cmp-nop">No passage yet</span>` : ""}`
        : `<span class="cmp-plus">Answer</span>`}</button></td>`;
    }).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function compareView() {
  const id = S.cmpId, c = S.compares.get(id); if (!c) return comparesView();
  const cols = c.cols || [], rows = c.rows || [], st = cmpStats(c);
  const gapRows = rows.filter((r) => rowHasGap(c, r)), shown = S.cmpGaps ? gapRows : rows;
  const ready = rows.length && cols.length;
  const statLine = !cols.length ? "Add a side to begin." : !rows.length ? "Add a question to begin."
    : `${st.answered} of ${st.total} answered${st.unbacked ? `. ${st.unbacked} answer${st.unbacked === 1 ? "" : "s"} about the texts ${st.unbacked === 1 ? "has" : "have"} no passage behind ${st.unbacked === 1 ? "it" : "them"} yet` : ""}. Citations: ${CITE_STYLES[citeStyle]}.`;
  const body = !ready ? `<p class="empty"><b>${cols.length ? "No questions yet." : "No sides yet."}</b> ${cols.length ? "Ask something each side can answer on its own terms." : "Add a thinker, a text or one of your tags as a side."}</p>`
    : !shown.length ? `<p class="empty"><b>No gaps.</b> Every side has answered every question, and every answer about the texts has a passage behind it.</p>`
    : cmpMode === "table" ? cmpTableHTML(c, shown) : cmpRowsHTML(c, shown);
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Comparisons</button></div>${banner()}
    <header class="head">
      <h1>${esc(c.title || "Untitled comparison")}</h1>
      ${c.q ? `<p class="cmp-q">${esc(c.q)}</p>` : ""}
      <div class="cmp-sides">${cols.map((col) => `<button class="cmp-side${col.own ? " own" : ""}" style="${sideVar(c, col)}" data-cside="${esc(col.id)}"><span>${esc(col.label)}</span><small>${esc(col.own ? (col.src ? `Yours, drawing on ${srcName(col.src)}` : "Your own position") : srcDesc(col.src))}</small></button>`).join("")}${cols.length < CMP_MAX ? `<button class="btn ghost" id="cmp-addside">+ Side</button>` : ""}</div>
      <div class="srcline" id="cmp-stat">${statLine}</div>
      <div class="actions">
        <button class="btn primary" id="cmp-addrow">Add question</button>
        <button class="btn" id="cmp-export">Export</button>
        <button class="btn" id="cmp-more" aria-haspopup="dialog">More</button>
      </div>
    </header>
    ${ready ? `<div class="cmp-bar"><div class="seg" role="group" aria-label="Layout"><button class="segb${cmpMode === "rows" ? " on" : ""}" data-cmode="rows" aria-pressed="${cmpMode === "rows"}">By question</button><button class="segb${cmpMode === "table" ? " on" : ""}" data-cmode="table" aria-pressed="${cmpMode === "table"}">Table</button></div>
      <button class="chip${S.cmpGaps ? " on" : ""}" id="cmp-gaps" aria-pressed="${S.cmpGaps}">Only gaps<span class="cnt">${gapRows.length}</span></button></div>` : ""}
    <section class="group">${body}</section>
    <section class="group"><div class="notesbar"><div class="label">Your conclusion</div><button class="btn" id="cmp-verdict">${c.verdict ? "Edit" : "Write"}</button></div>
      ${c.verdict ? `<div class="paperpanel summary"><p>${esc(c.verdict)}</p></div>` : `<p class="hint">Once the answers are in: where do the sides meet, where do they part, and where do you stand?</p>`}</section>`;
}

/* sheets */
function cmpNewSheet() {
  openSheet(`<h2>New comparison</h2>
    <div class="row2">
      <div class="field"><label for="cn-a">First side</label><select id="cn-a" name="a">${srcOptions("")}</select></div>
      <div class="field"><label for="cn-b">Second side</label><select id="cn-b" name="b">${srcOptions("")}</select></div>
    </div>
    <p class="hint">A side draws on an author, a text or one of your #tags. Two texts by one author set early and later views against each other; two translations of one work do the same for translators.</p>
    <label class="chkrow"><input type="checkbox" name="own" checked> Add a column for your own view</label>
    <div class="field"><label for="cn-t">Starting questions</label><select id="cn-t" name="tpl">${Object.entries(CMP_TEMPLATES).map(([k, v]) => `<option value="${k}">${esc(v.n)}</option>`).join("")}</select><span class="hint">You can reword, reorder or delete any of them later.</span></div>
    <div class="field"><label for="cn-title">Title</label><input id="cn-title" name="title" placeholder="Filled in from the sides if you leave it empty" autocomplete="off"></div>
    <div class="field"><label for="cn-q">Guiding question (optional)</label><input id="cn-q" name="q" placeholder="e.g. What moves a person to act?" autocomplete="off"></div>`,
  async (fd) => {
    const a = fd.get("a") || "", b = fd.get("b") || "";
    const cols = [{ id: gid(), label: srcName(a) || "First side", src: a, hue: 1 }, { id: gid(), label: srcName(b) || "Second side", src: b, hue: 2 }];
    if (fd.get("own")) cols.push({ id: gid(), label: "Your view", src: "", own: true });
    const tpl = CMP_TEMPLATES[fd.get("tpl")] || CMP_TEMPLATES.blank;
    const title = fd.get("title").trim() || (a || b ? `${cols[0].label} and ${cols[1].label}` : "Untitled comparison");
    const id = gid(), now = Date.now();
    await put("compares", id, { title, q: fd.get("q").trim(), cols, rows: tpl.rows.map((q) => ({ id: gid(), q })), cells: {}, verdict: "", createdAt: now, updatedAt: now });
    return () => go({ screen: "compare", cmpId: id });
  });
}
function cmpTitleSheet(cid) {
  const c = S.compares.get(cid); if (!c) return;
  openSheet(`<h2>Title and guiding question</h2>
    <div class="field"><label for="ct-title">Title</label><input id="ct-title" name="title" value="${esc(c.title)}" autocomplete="off"></div>
    <div class="field"><label for="ct-q">Guiding question (optional)</label><input id="ct-q" name="q" value="${esc(c.q || "")}" placeholder="e.g. What moves a person to act?" autocomplete="off"></div>`,
  async (fd) => { await saveCmp(cid, { title: fd.get("title").trim() || "Untitled comparison", q: fd.get("q").trim() }); });
}
function sideSheet(cid, colId) {
  const c = S.compares.get(cid); if (!c) return;
  const cols = c.cols || [], col = colId ? cols.find((x) => x.id === colId) : null;
  if (colId && !col) return;
  if (!col && cols.length >= CMP_MAX) return toast(`A comparison holds up to ${CMP_MAX} sides.`);
  const slots = cols.length + (col ? 0 : 1), at = col ? cols.indexOf(col) : cols.length;
  const answers = col ? (c.rows || []).filter((r) => cellHas(cellOf(c, r.id, col.id))).length : 0;
  openSheet(`<h2>${col ? "Edit side" : "Add a side"}</h2>
    <div class="field"><label for="sd-src">Draws on</label><select id="sd-src" name="src">${srcOptions(col ? col.src || "" : "")}</select><span class="hint">Its notes are offered first when you answer for this side.</span></div>
    <div class="field"><label for="sd-label">Name</label><input id="sd-label" name="label" value="${esc(col ? col.label : "")}" placeholder="e.g. Spinoza, the later Wittgenstein, #conatus" autocomplete="off"></div>
    <label class="chkrow"><input type="checkbox" name="own" id="sd-own"${col && col.own ? " checked" : ""}> This side is your own view</label>
    ${slots > 1 ? `<div class="field"><label for="sd-pos">Position</label><select id="sd-pos" name="pos">${Array.from({ length: slots }, (_, k) => `<option value="${k}"${k === at ? " selected" : ""}>${ORD[k]} column</option>`).join("")}</select></div>` : ""}
    <p class="hint bad" id="sd-warn" hidden></p>
    ${answers ? `<p class="hint">Removing this side also deletes its ${answers} answer${answers === 1 ? "" : "s"}. Your notes stay where they are.</p>` : ""}`,
  async (fd) => {
    const now = S.compares.get(cid); if (!now) return;
    const src = fd.get("src") || "", own = !!fd.get("own");
    const label = fd.get("label").trim() || srcName(src) || (own ? "Your view" : "Untitled side");
    const list = (now.cols || []).filter((x) => !col || x.id !== col.id);
    if (!col && list.length >= CMP_MAX) return `A comparison holds up to ${CMP_MAX} sides.`;
    const next = { ...(col || { id: gid() }), label, src };
    if (own) next.own = true; else delete next.own;
    if (!own && !next.hue) next.hue = freeHue(list);
    const pos = fd.get("pos") == null ? list.length : Math.max(0, Math.min(list.length, +fd.get("pos") || 0));
    list.splice(pos, 0, next);
    await saveCmp(cid, { cols: list });
  },
  (root) => {
    const sel = $("#sd-src", root), lab = $("#sd-label", root), own = $("#sd-own", root);
    // The name follows the source until you type your own.
    let auto = col ? (col.label === srcName(col.src || "") || (col.own && col.label === "Your view") ? col.label : null) : "";
    const fill = () => {
      const v = srcName(sel.value) || (own.checked ? "Your view" : "");
      if (!lab.value.trim() || lab.value === auto) { lab.value = v; auto = v; }
    };
    sel.addEventListener("change", fill); own.addEventListener("change", fill);
    if (!col) { sel.focus(); return; }
    // A new source keeps the old answers and passages, which may belong to the old subject.
    const warn = $("#sd-warn", root), old = col.src || "";
    const linkedHere = [...new Set((c.rows || []).flatMap((r) => liveNotes(cellOf(c, r.id, col.id))))];
    sel.addEventListener("change", () => {
      const fits = srcFilter(sel.value), outside = sel.value ? linkedHere.filter((id) => !fits(S.notes.get(id))).length : 0;
      // Narrowing (an author to one of their texts) keeps the subject; a source sharing no notes with the old one changes it.
      const was = srcFilter(old), shifted = !!old && ![...S.notes.values()].some((n) => was(n) && fits(n));
      const stale = shifted ? answers : 0;
      const show = sel.value !== old && (stale || outside);
      warn.hidden = !show;
      if (show) warn.textContent = [
        stale ? `This side's ${stale} answer${stale === 1 ? " was" : "s were"} written for ${srcName(old)}.` : "",
        outside ? `${outside} of its linked notes ${outside === 1 ? "comes" : "come"} from outside ${srcName(sel.value)}.` : "",
        "Saving keeps everything as it is. To compare a different subject, add a new side instead.",
      ].filter(Boolean).join(" ");
    });
    $(".formacts", root).insertAdjacentHTML("afterbegin", `<button type="button" class="btn ghost danger sheet-del" id="sd-del">Remove side</button>`);
    const delBtn = $("#sd-del", root);
    delBtn.addEventListener("click", () => arm(delBtn, async () => {
      const now = S.compares.get(cid); if (!now) return;
      const cells = { ...(now.cells || {}) };
      Object.keys(cells).forEach((k) => { if (k.endsWith("|" + col.id)) delete cells[k]; });
      try { await saveCmp(cid, { cols: (now.cols || []).filter((x) => x.id !== col.id), cells }); await closeOverlay(); toast(`Removed “${col.label}”.`); }
      catch (e) { $("#err", root).textContent = failMsg(e); }
    }));
  });
}
function rowSheet(cid, rowId) {
  const c = S.compares.get(cid); if (!c) return;
  const row = rowId ? (c.rows || []).find((r) => r.id === rowId) : null;
  if (rowId && !row) return;
  const answers = row ? (c.cols || []).filter((col) => cellHas(cellOf(c, row.id, col.id))).length : 0;
  openSheet(`<h2>${row ? "Edit question" : "Add a question"}</h2>
    <div class="field"><label for="cr-q">Question</label><input id="cr-q" name="q" value="${esc(row ? row.q : "")}" placeholder="e.g. What part does the body play?" autocomplete="off"><span class="hint">Ask something each side can answer on its own terms.</span></div>
    ${answers ? `<p class="hint">Deleting this question also deletes its ${answers} answer${answers === 1 ? "" : "s"}. Your notes stay where they are.</p>` : ""}`,
  async (fd) => {
    const q = fd.get("q").trim(); if (!q) return "Write the question.";
    const now = S.compares.get(cid); if (!now) return;
    const rows = [...(now.rows || [])];
    if (row) { const k = rows.findIndex((r) => r.id === row.id); if (k >= 0) rows[k] = { ...rows[k], q }; else return; }
    else rows.push({ id: gid(), q });
    await saveCmp(cid, { rows });
  },
  row ? (root) => {
    $(".formacts", root).insertAdjacentHTML("afterbegin", `<button type="button" class="btn ghost danger sheet-del" id="cr-del">Delete question</button>`);
    const delBtn = $("#cr-del", root);
    delBtn.addEventListener("click", () => arm(delBtn, async () => {
      const now = S.compares.get(cid); if (!now) return;
      const cells = { ...(now.cells || {}) };
      Object.keys(cells).forEach((k) => { if (k.startsWith(row.id + "|")) delete cells[k]; });
      try { await saveCmp(cid, { rows: (now.rows || []).filter((r) => r.id !== row.id), cells }); await closeOverlay(); toast("Question deleted."); }
      catch (e) { $("#err", root).textContent = failMsg(e); }
    }));
  } : null);
}
// A fresh comparison with the same sides and questions, in the same order and wording; answers, passages and the conclusion stay behind.
function cmpDupSheet(cid) {
  const c = S.compares.get(cid); if (!c) return;
  openSheet(`<h2>Duplicate the questions</h2>
    <div class="field"><label for="cd-title">Title of the new comparison</label><input id="cd-title" name="title" placeholder="${esc(c.title || "")}" autocomplete="off"></div>
    <p class="hint">Copies the ${(c.cols || []).length} sides, the guiding question and the ${(c.rows || []).length} questions in order. Answers, passages and the conclusion stay with “${esc(c.title)}”. Change a side by tapping it.</p>`,
  async (fd) => {
    const title = fd.get("title").trim();
    if (!title) return "Give the new comparison its own title.";
    if (fold(title) === fold(c.title)) return "Use a title that differs from the original.";
    const now = S.compares.get(cid) || c, id = gid(), t0 = Date.now();
    const cols = (now.cols || []).map((x) => ({ ...x, id: gid() }));
    await put("compares", id, { title, q: now.q || "", cols, rows: (now.rows || []).map((r) => ({ id: gid(), q: r.q })), cells: {}, verdict: "", createdAt: t0, updatedAt: t0 });
    return () => go({ screen: "compare", cmpId: id });
  }, (root) => { $("#cd-title", root).focus(); });
}
function moveCmpRow(cid, rowId, dir) {
  const c = S.compares.get(cid); if (!c) return;
  const rows = [...(c.rows || [])], k = rows.findIndex((r) => r.id === rowId), j = k + dir;
  if (k < 0 || j < 0 || j >= rows.length) return;
  [rows[k], rows[j]] = [rows[j], rows[k]];
  return saveCmp(cid, { rows });
}
// Answer one question for one side: your words, plus the passages that back them, chosen from that side's notes first.
function cellSheet(cid, key) {
  const c = S.compares.get(cid); if (!c) return;
  const [rowId, colId] = String(key).split("|");
  const row = (c.rows || []).find((r) => r.id === rowId), col = (c.cols || []).find((x) => x.id === colId);
  if (!row || !col) return;
  const cell = cellOf(c, rowId, colId) || {};
  let linked = liveNotes(cell);
  const srcLabel = col.src ? srcName(col.src) : "";
  openSheet(`<div class="cmp-sheethead" style="${sideVar(c, col)}"><span class="cmp-sl">${esc(colHead(col))}</span><h2>${esc(row.q)}</h2></div>
    <div class="field"><label for="cc-x">${col.own ? "Your position" : "The answer, in your words"}</label><textarea id="cc-x" name="x" rows="5">${esc(cell.x || "")}</textarea>
      <span class="hint">${col.own ? "Link passages below if your view rests on them." : `What ${esc(col.label)} holds on this question. The passages below are your evidence.`}</span></div>
    <div class="field"><span class="flabel">Passages behind it</span><span class="hint">A note counts as evidence when it quotes a passage. You can link your own notes as well; they are marked as yours and leave the answer flagged until a passage backs it.</span>
      <div class="cmp-linked" id="cc-linked"></div>
      ${col.src ? `<label class="chkrow"><input type="checkbox" id="cc-only" checked> Only notes from ${esc(srcLabel)}</label>` : ""}
      <input id="cc-q" type="search" placeholder="Search your notes" autocomplete="off" aria-label="Search your notes">
      <div class="pk-list cmp-res" id="cc-res"></div>
    </div>`,
  async (fd) => {
    const now = S.compares.get(cid); if (!now) return;
    const x = fd.get("x").trim(), notes = linked.filter((id) => S.notes.has(id));
    const cells = { ...(now.cells || {}) };
    if (x || notes.length) cells[key] = { x, notes }; else delete cells[key];
    await saveCmp(cid, { cells });
  },
  (root) => {
    const box = $("#cc-linked", root), res = $("#cc-res", root), q = $("#cc-q", root), only = $("#cc-only", root);
    const inSrc = srcFilter(col.src || "");
    const pool = [...S.notes.entries()].sort(([, a], [, b]) => {
      const ta = (S.texts.get(a.textId) || {}).title || "", tb = (S.texts.get(b.textId) || {}).title || "";
      return ta.localeCompare(tb) || pnum(a.page) - pnum(b.page) || (a.at ?? 1e9) - (b.at ?? 1e9) || (a.createdAt || 0) - (b.createdAt || 0);
    });
    const rowHTML = (id, n, on) => `<button type="button" class="pkrow${on ? " on" : ""}" data-ctoggle="${esc(id)}" aria-pressed="${on}"><span class="pkbox" aria-hidden="true"></span><span class="pkt"><b>${esc(evWhere(n))}</b><span>${esc(cmpEvidence(n))}</span></span></button>`;
    const draw = () => {
      box.innerHTML = linked.map((id) => rowHTML(id, S.notes.get(id), true)).join("");
      box.hidden = !linked.length;
      const f = fold(q.value.trim()), lim = !!(only && only.checked);
      const hits = pool.filter(([id, n]) => !linked.includes(id) && (!lim || inSrc(n)) && (!f || fold([n.passage, n.gloss, n.original, n.conclusion, ...(n.premises || []), n.page, (S.texts.get(n.textId) || {}).title, ...fuTexts(n)].join(" ")).includes(f)));
      const msg = !S.notes.size ? "You have no notes yet." : f ? "No notes match."
        : lim && !pool.some(([, n]) => inSrc(n)) ? `No notes from ${srcLabel} yet. Untick the box to choose from all your notes.`
        : lim ? `Every note from ${srcLabel} is linked.` : "Every note is linked.";
      res.innerHTML = (hits.slice(0, 80).map(([id, n]) => rowHTML(id, n, false)).join("") || `<p class="hint">${esc(msg)}</p>`)
        + (hits.length > 80 ? `<p class="hint cmp-more">Showing 80 of ${hits.length}. Search to narrow them down.</p>` : "");
    };
    q.addEventListener("input", draw);
    q.addEventListener("keydown", (e) => { if (e.key === "Enter") e.preventDefault(); });
    if (only) only.addEventListener("change", draw);
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ctoggle]"); if (!b) return;
      const id = b.dataset.ctoggle;
      linked = linked.includes(id) ? linked.filter((x) => x !== id) : [...linked, id];
      draw();
    });
    draw();
  });
}
function verdictSheet(cid) {
  const c = S.compares.get(cid); if (!c) return;
  openSheet(`<h2>Your conclusion</h2>
    <div class="field"><label for="cv-x">In your own words</label><textarea id="cv-x" name="x" rows="8">${esc(c.verdict || "")}</textarea>
    <span class="hint">Where do the sides meet, where do they part, and where do you stand? Leave it empty to remove it.</span></div>`,
  async (fd) => { await saveCmp(cid, { verdict: fd.get("x").trim() }); });
}
function cmpMore(cid) {
  const c = S.compares.get(cid); if (!c) return;
  openPanel(`<h2>${esc(c.title || "Untitled comparison")}</h2>
    <div class="menu">
      <button class="menuitem" id="cm-rename">Title and guiding question</button>
      <button class="menuitem" id="cm-draft">Start a draft from it</button>
      <button class="menuitem" id="cm-dup">Duplicate the questions</button>
      <button class="menuitem danger" id="cm-delete">Delete this comparison</button>
    </div><p class="hint">Deleting a comparison leaves its notes where they are.</p>`, (b) => {
    if (b.id === "cm-rename") cmpTitleSheet(cid);
    else if (b.id === "cm-draft") cmpToDraft(cid).catch((e) => toast(failMsg(e)));
    else if (b.id === "cm-dup") cmpDupSheet(cid);
    else if (b.id === "cm-delete") openPanel(`<h2>Delete “${esc(c.title)}”?</h2><div class="menu"><button class="menuitem danger" id="cm-delete-yes">Delete this comparison</button></div>`, async (b2) => {
      if (b2.id !== "cm-delete-yes") return;
      await back();
      try { const tid = await trashAndRemove("comparison", c.title || "", [["compares", cid, S.compares.get(cid)]]); render(); delToast("Comparison deleted.", tid); } catch (e) { if (!e.noRoom) toast(failMsg(e)); }
    });
  });
}

/* exports: a table, an outline, a formatted table for word processors, or a draft to write from */
function cmpDoc(c, style, fmt) {
  const fns = [], cited = new Set();
  const cite = (n) => {
    const t = S.texts.get(n.textId); if (!t) return null;
    const first = !cited.has(n.textId); cited.add(n.textId);
    if (style !== "note") return { inline: citeAt(t, n.page, style, fmt) };
    fns.push({ t, page: n.page, short: !first });
    return { fn: fns.length };
  };
  const cols = c.cols || [];
  const rows = (c.rows || []).map((r) => ({ q: r.q, cells: cols.map((col) => {
    const cell = cellOf(c, r.id, col.id) || {};
    return { x: String(cell.x || "").trim(), ev: liveNotes(cell).map((id) => { const n = S.notes.get(id); return { n, c: cite(n) }; }) };
  }) }));
  return { cols, rows, fns, tids: [...cited] };
}
function cmpMarkdown(id, style, form) {
  const c = S.compares.get(id); if (!c) return "";
  const { cols, rows, fns, tids } = cmpDoc(c, style, "md");
  const mark = (x) => (x && x.fn ? `[^${x.fn}]` : x && x.inline ? ` ${x.inline}` : "");
  const evText = (e) => (isPassage(e.n) ? `“${oneLine(e.n.passage)}”` : `*My note:* ${oneLine(e.n.gloss || e.n.conclusion || e.n.original)}`) + mark(e.c);
  const out = [`# ${c.title || "Untitled comparison"}`, ""];
  if (c.q) out.push(`*${c.q}*`, "");
  if (form === "table") {
    const cellMd = (x) => x.replace(/\|/g, "\\|").replace(/\r?\n+/g, "<br>");
    out.push(`| Question | ${cols.map((col) => cellMd(colHead(col))).join(" | ")} |`, `| --- | ${cols.map(() => "---").join(" | ")} |`);
    for (const r of rows) out.push(`| ${cellMd(r.q)} | ${r.cells.map((cl) => cellMd([cl.x, ...cl.ev.map(evText)].filter(Boolean).join("\n")) || "—").join(" | ")} |`);
    out.push("");
  } else {
    rows.forEach((r, k) => {
      out.push(`## ${k + 1}. ${r.q}`, "");
      if (r.cells.every((cl) => !cl.x && !cl.ev.length)) { out.push("*No answers yet.*", ""); return; }
      r.cells.forEach((cl, j) => {
        out.push(`### ${colHead(cols[j])}`, "");
        if (!cl.x && !cl.ev.length) { out.push("*No answer yet.*", ""); return; }
        if (cl.x) out.push(cl.x, "");
        for (const e of cl.ev) {
          if (isPassage(e.n)) { const lines = e.n.passage.split(/\n+/); lines[lines.length - 1] += mark(e.c); out.push(...lines.map((l) => `> ${l}`), ""); }
          else out.push(evText(e), "");
        }
      });
    });
  }
  if (c.verdict) out.push("## Conclusion", "", c.verdict, "");
  if (fns.length) out.push(...fns.map((f, k) => `[^${k + 1}]: ${citeAt(f.t, f.page, "note", "md", f.short)}`), "");
  const bib = bibliography(tids, style, "md");
  if (bib.length) out.push(`## ${BIB_HEAD[style]}`, "", ...bib.flatMap((x) => [x, ""]));
  return out.join("\n");
}
function cmpHTML(id, style) {
  const c = S.compares.get(id); if (!c) return "";
  const { cols, rows, fns, tids } = cmpDoc(c, style, "html");
  const mark = (x) => (x && x.fn ? `<sup>${x.fn}</sup>` : x && x.inline ? " " + x.inline : "");
  const paras = (s) => String(s).split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("");
  const box = "vertical-align:top;border:1px solid #9a8a74;padding:6px 8px;text-align:left";
  const ev = (e) => `<p>${isPassage(e.n) ? `“${esc(oneLine(e.n.passage))}”` : `<i>My note:</i> ${esc(oneLine(e.n.gloss || e.n.conclusion || e.n.original))}`}${mark(e.c)}</p>`;
  const td = (cl) => `<td style="${box}">${cl.x ? paras(cl.x) : ""}${cl.ev.map(ev).join("") || (cl.x ? "" : "—")}</td>`;
  const table = `<table style="border-collapse:collapse"><thead><tr><th style="${box}">Question</th>${cols.map((col) => `<th style="${box}">${esc(colHead(col))}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr><th style="${box}">${esc(r.q)}</th>${r.cells.map(td).join("")}</tr>`).join("")}</tbody></table>`;
  const bib = bibliography(tids, style, "html");
  return `<h1>${esc(c.title || "Untitled comparison")}</h1>${c.q ? `<p><i>${esc(c.q)}</i></p>` : ""}${table}${c.verdict ? `<h2>Conclusion</h2>${paras(c.verdict)}` : ""}${fns.length ? `<h2>Notes</h2><ol>${fns.map((f) => `<li>${citeAt(f.t, f.page, "note", "html", f.short)}</li>`).join("")}</ol>` : ""}${bib.length ? `<h2>${BIB_HEAD[style]}</h2>${bib.map((x) => `<p>${x}</p>`).join("")}` : ""}`;
}
// A draft to write from: each answered question becomes a heading, each side's answer a paragraph, its passages the notes beneath.
async function cmpToDraft(cid) {
  const c = S.compares.get(cid); if (!c) return;
  const items = [];
  if (c.q) items.push({ t: "p", x: c.q });
  let answered = 0;
  for (const r of c.rows || []) {
    const parts = (c.cols || []).map((col) => [col, cellOf(c, r.id, col.id)]).filter(([, cell]) => cellHas(cell));
    if (!parts.length) continue;
    items.push({ t: "h", x: r.q });
    for (const [col, cell] of parts) {
      answered++;
      const x = String(cell.x || "").trim();
      items.push({ t: "p", x: x ? `${colHead(col)}: ${x}` : `${colHead(col)}:` });
      liveNotes(cell).forEach((id) => items.push({ t: "note", id }));
    }
  }
  if (c.verdict) items.push({ t: "h", x: "Conclusion" }, { t: "p", x: c.verdict });
  if (!answered) return toast("Answer at least one question first.");
  const id = gid(), now = Date.now();
  await put("drafts", id, { title: c.title || "Untitled comparison", items, from: cid, createdAt: now, updatedAt: now });
  go({ screen: "draft", draftId: id });
  toast("Draft started. The passages keep their citations.");
}
function cmpExportPanel(cid) {
  const c = S.compares.get(cid); if (!c) return;
  if (!(c.rows || []).length || !(c.cols || []).length) return toast("Add a side and a question first.");
  const seg = Object.entries(CITE_STYLES).map(([k, v]) => `<button class="segb${citeStyle === k ? " on" : ""}" data-keep="1" data-cstyle="${k}">${v}</button>`).join("");
  openPanel(`<h2>Export comparison</h2>
    <div class="rs-row"><span>Citation style</span><div class="seg segwrap">${seg}</div></div>
    <div class="menu">
      <button class="menuitem" id="ce-outline">Outline, question by question (Markdown)</button>
      <button class="menuitem" id="ce-table">Table (Markdown)</button>
      <button class="menuitem" id="ce-copy">Copy as a formatted table</button>
      <button class="menuitem" id="ce-draft">Start a draft from it</button>
    </div>
    <p class="hint">The outline reads best once answers run long; the table suits short answers. Passages come with citations and a bibliography, and your own view and notes are labelled as yours. A draft turns each question into a heading with every side's answer and passages beneath it, ready to rework into prose.</p>`, async (b) => {
    if (b.dataset.cstyle) { setCiteStyle(b.dataset.cstyle); document.querySelectorAll("#sheetroot [data-cstyle]").forEach((x) => x.classList.toggle("on", x === b)); if (S.screen === "compare") render(); return; }
    try {
      if (b.id === "ce-table") await saveFile(`${slug(c.title)}-comparison.md`, cmpMarkdown(cid, citeStyle, "table"), "text/markdown");
      else if (b.id === "ce-outline") await saveFile(`${slug(c.title)}-comparison-outline.md`, cmpMarkdown(cid, citeStyle, "outline"), "text/markdown");
      else if (b.id === "ce-copy") { const ok = await copyRich(cmpHTML(cid, citeStyle), cmpMarkdown(cid, citeStyle, "table")); toast(ok ? "Copied. Paste it into a document as a table." : "Couldn't copy. Your browser blocked the clipboard."); }
      else if (b.id === "ce-draft") await cmpToDraft(cid);
    } catch (e) { toast(failMsg(e)); }
  });
}

/* ---------- search all books: every loaded text, accents and case ignored ---------- */
const CONC = { q: "", seq: 0, results: [], done: true, books: 0, open: new Set() };
// The words as the reader shows them (as Find searches them): hidden running heads are left out (isHidden) and a
// paragraph carried over a page break is searched across the break, so a phrase split by the break is found.
function hitsIn(blocks, q, max) {
  const f = fold(q.trim()); if (f.length < 2 || !blocks) return [];
  const hits = [];
  const snipOf = (txt, at) => {
    const a = Math.max(0, at - 50), z = Math.min(txt.length, at + f.length + 70);
    return `${a ? "…" : ""}${esc(txt.slice(a, at))}<b>${esc(txt.slice(at, at + f.length))}</b>${esc(txt.slice(at + f.length, z))}${z < txt.length ? "…" : ""}`;
  };
  for (let i = 0; i < blocks.length && hits.length < max; i++) {
    const b = blocks[i]; if (b.k === "pg" || isHidden(b)) continue;
    const txt = shownText(b), ft = fold(txt), at = ft.indexOf(f);
    let count = 0; for (let k = at; k >= 0; k = ft.indexOf(f, k + f.length)) count++;
    let snip = at < 0 ? "" : ft.length === txt.length ? snipOf(txt, at) : esc(txt.slice(0, 120));
    const nx = nextPart(blocks, i);
    if (nx >= 0) { // matches that run from the end of this paragraph into its continuation
      const tail = txt.slice(-(f.length + 50)), join = tail + glueAfter(txt) + shownText(blocks[nx]).slice(0, f.length + 70), fj = fold(join), tb = fold(tail).length;
      for (let k = fj.indexOf(f); k >= 0 && k < tb; k = fj.indexOf(f, k + 1)) {
        if (k + f.length <= tb) continue;
        count++; if (!snip) snip = fj.length === join.length ? snipOf(join, k) : esc(join.slice(0, 120));
      }
    }
    if (count) hits.push({ i, count, snip });
  }
  return hits;
}
const pagesOf = (blocks) => { const out = []; let pg = ""; blocks.forEach((b, i) => { if (b.k === "pg") pg = b.x; out[i] = pg; }); return out; };
function concordView() {
  const books = [...S.texts.values()].filter((t) => t.hasContent).length;
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>${banner()}
    <header class="gl-head"><div><h1>Search all books</h1><div class="sub">${books} loaded text${books === 1 ? "" : "s"}</div></div></header>
    <input class="search" id="cq" type="search" placeholder="A word or phrase" value="${esc(CONC.q)}" autocomplete="off" aria-label="Search the full text of your books">
    <p class="hint">Finds the exact word or phrase in every text you've loaded, ignoring accents and capitals. Type a stem such as “striv” to catch every form of a word. Tap a result to open the book there.</p>
    <div id="cres">${concordResults()}</div>`;
}
function concordResults() {
  const f = fold(CONC.q.trim());
  if (f.length < 2) return "";
  const total = CONC.results.reduce((a, r) => a + r.count, 0);
  const head = `<p class="hint" id="csum">${CONC.done ? (total ? `${total} match${total === 1 ? "" : "es"} in ${CONC.results.length} text${CONC.results.length === 1 ? "" : "s"}.` : "No matches.") : `Searching… ${CONC.results.length ? `${total} so far.` : ""}`}</p>`;
  return head + CONC.results.map((r) => {
    const t = S.texts.get(r.tid); if (!t) return "";
    const open = CONC.open.has(r.tid), shown = open ? r.hits : r.hits.slice(0, 12);
    return `<section class="group"><div class="label"><button class="src grouptitle" data-open="${esc(r.tid)}">${esc(t.title)}</button><span class="cnt">${r.count}</span></div>
      <div class="findres paperpanel">${shown.map((h) => `<button class="findhit" data-conc="${esc(r.tid)}" data-at="${h.i}"><span class="fp">${r.pages[h.i] ? esc(loc(r.pages[h.i])) : ""}</span><span class="fs">${h.snip}</span></button>`).join("")}</div>
      ${r.hits.length > 12 ? `<button class="btn ghost" data-concmore="${esc(r.tid)}">${open ? "Show fewer" : `Show all ${r.hits.length} passages${r.hits.length >= 300 ? " (first 300)" : ""}`}</button>` : ""}</section>`;
  }).join("");
}
function drawConcord() { const el = $("#cres"); if (el && S.screen === "concord") el.innerHTML = concordResults(); }
async function runConcord() {
  const seq = ++CONC.seq, q = CONC.q;
  CONC.results = []; CONC.open = new Set(); CONC.done = false;
  if (fold(q.trim()).length < 2) { CONC.done = true; drawConcord(); return; }
  drawConcord();
  const texts = [...S.texts.entries()].filter(([, t]) => t.hasContent).sort(([, a], [, b]) => a.title.localeCompare(b.title));
  for (const [tid] of texts) {
    let blocks = S.content.get(tid);
    if (!blocks && idb) { try { blocks = await idbGet("content", tid); } catch { blocks = null; } }
    if (seq !== CONC.seq) return;
    const hits = hitsIn(blocks, q, 300);
    if (hits.length) CONC.results.push({ tid, hits, count: hits.reduce((a, h) => a + h.count, 0), pages: pagesOf(blocks) });
    drawConcord();
    await new Promise((r) => setTimeout(r, 0));
  }
  if (seq !== CONC.seq) return;
  CONC.done = true; drawConcord();
}
let concT;
document.addEventListener("input", (e) => {
  if (e.target.id !== "cq") return;
  CONC.q = e.target.value;
  clearTimeout(concT); concT = setTimeout(runConcord, 320);
});

/* ---------- exports for writing elsewhere ---------- */
function exportPanel() {
  const seg = Object.entries(CITE_STYLES).map(([k, v]) => `<button class="segb${citeStyle === k ? " on" : ""}" data-keep="1" data-cstyle="${k}">${v}</button>`).join("");
  openPanel(`<h2>Export for writing</h2>
    <div class="rs-row"><span>Citation style</span><div class="seg segwrap">${seg}</div></div>
    <div class="menu">
      <button class="menuitem" id="x-bib">Bibliography of every text (Markdown)</button>
      <button class="menuitem" id="x-bibtex">BibTeX file for Zotero or LaTeX (.bib)</button>
      <button class="menuitem" id="x-zip">Everything as Markdown files (.zip)</button>
      <button class="menuitem" id="x-anki">Flashcards for Anki: your notes, terms and words (.txt)</button>
      <button class="menuitem" id="x-ankigl">Flashcards for Anki: the whole glossary (.txt)</button>
    </div>
    <p class="hint">The .zip holds one file of notes per text, one per draft and one per comparison, a bibliography and a .bib file, ready for Obsidian, Zotero or Pandoc. The flashcards open in Anki with File → Import, into a deck called Marginalia, tagged by kind and book. To move the app to another device, use Save backup instead.</p>`, async (b) => {
    if (b.dataset.cstyle) { setCiteStyle(b.dataset.cstyle); document.querySelectorAll("#sheetroot [data-cstyle]").forEach((x) => x.classList.toggle("on", x === b)); return; }
    if (b.id === "x-anki" || b.id === "x-ankigl") {
      const rows = ankiRows(b.id === "x-anki" ? "mine" : "glossary");
      if (!rows.length) return toast("There are no notes, terms of your own or looked-up words to make cards from yet.");
      try { await saveFile(`marginalia-${b.id === "x-anki" ? "flashcards" : "glossary-cards"}-${stamp()}.txt`, ankiFile(rows), "text/plain"); }
      catch { toast("Couldn't export the flashcards."); }
      return;
    }
    const tids = [...S.texts.keys()];
    if (!tids.length) return toast("Add a text first.");
    try {
      if (b.id === "x-bib") await saveFile(`bibliography-${stamp()}.md`, `# ${BIB_HEAD[citeStyle]}\n\n${bibliography(tids, citeStyle, "md").join("\n\n")}\n`, "text/markdown");
      else if (b.id === "x-bibtex") await saveFile(`marginalia-${stamp()}.bib`, bibtex(tids), "application/x-bibtex");
      else if (b.id === "x-zip") await exportZip();
    } catch (e) { toast(e instanceof UErr ? e.message : "Couldn't export."); }
  });
}
async function exportZip() {
  toast("Preparing the files…");
  await need("zip", () => !!window.JSZip, "Couldn't load the zip tool. Check your connection and try again.");
  const zip = new window.JSZip(), used = new Set();
  const name = (base) => { let n = base, k = 2; while (used.has(n)) n = `${base}-${k++}`; used.add(n); return n; };
  for (const [tid, t] of S.texts) if (notesFor(tid).length || Object.keys(t.summaries || {}).length) zip.file(`notes/${name(slug(t.title))}.md`, notesMarkdown(tid));
  for (const [id, d] of S.drafts) if ((d.items || []).length) zip.file(`drafts/${name(slug(d.title))}.md`, draftMarkdown(id, citeStyle));
  for (const [id, c] of S.compares) if ((c.rows || []).length && (c.cols || []).length) zip.file(`comparisons/${name(slug(c.title))}.md`, cmpMarkdown(id, citeStyle, "outline"));
  const tids = [...S.texts.keys()];
  zip.file("bibliography.md", `# ${BIB_HEAD[citeStyle]}\n\n${bibliography(tids, citeStyle, "md").join("\n\n")}\n`);
  zip.file("marginalia.bib", bibtex(tids));
  const blob = await zip.generateAsync({ type: "blob" });
  await saveFile(`marginalia-markdown-${stamp()}.zip`, blob, "application/zip");
}

/* ---------- flashcards for Anki: tab-separated text with Anki's import headers (Anki 2.1.54 and later) ----------
   Front, back and tags; fields are HTML (escaped, line breaks as <br>), so quotes and tabs inside them can't split a field. */
const ankiCell = (html) => String(html).replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
const ankiTag = (x) => slug(x).replace(/-/g, "_");
function ankiFile(rows) {
  const head = ["#separator:tab", "#html:true", "#notetype:Basic", "#deck:Marginalia", "#tags column:3", "#columns:Front\tBack\tTags"];
  return [...head, ...rows.map((r) => r.map(ankiCell).join("\t"))].join("\n") + "\n";
}
// "mine": your notes (a passage on the front when there is one, your words and its place on the back), the terms you added or
// edited, and the words you looked up. "glossary": every entry in the app's glossary, with your edits.
function ankiRows(which) {
  const rows = [], small = (x) => `<br><small>${x}</small>`;
  if (which === "glossary") {
    for (const g of allTerms()) if (g.d) rows.push([esc(g.t), esc(g.d) + (g.s ? small(esc(g.s)) : ""), ["marginalia::glossary", `marginalia::area::${ankiTag(AREAS[g.a] || "mine")}`].join(" ")]);
    return rows;
  }
  const books = [...S.texts.entries()].sort(([, a], [, b]) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  for (const [tid, t] of books) for (const [, n] of sortNotes(notesFor(tid), t)) {
    const front = n.passage || n.gloss; if (!front) continue;
    const back = [n.passage && n.gloss ? esc(n.gloss) : "",
      n.premises && n.premises.length ? `<ol>${n.premises.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>Therefore: ${esc(n.conclusion || "")}` : "",
      ...(n.followups || []).map((f) => `<i>Later:</i> ${esc(f.x)}`)].filter(Boolean).join("<br><br>");
    const tags = ["marginalia::note", `marginalia::kind::${n.kind || "passage"}`, `marginalia::book::${ankiTag(t.title)}`, ...tagsOf(n).map(ankiTag)];
    rows.push([esc(front), back + small(citeAt(t, n.page, "note", "html", true)), tags.join(" ")]);
  }
  for (const g of allTerms()) if ((!g.builtIn || g.edited) && g.d) rows.push([esc(g.t), esc(g.d), "marginalia::term"]);
  for (const w of lookedUp()) rows.push([esc(w.word), `<i>${esc(w.pos)}${w.lang !== "English" ? `, ${esc(w.lang)}` : ""}</i><br>${esc(w.sense)}`, "marginalia::word"]);
  return rows;
}
