// Marginalia: citations, tags and the Markdown export of notes. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- citations: Chicago notes, Chicago author–date, MLA ---------- */
// Chicago follows its 18th edition (2024), which no longer asks for the place of publication.
const CITE_STYLES = { note: "Chicago notes", ad: "Chicago author–date", mla: "MLA" };
const BIB_HEAD = { note: "Bibliography", ad: "References", mla: "Works Cited" };
let citeStyle = "note";
try { const v = localStorage.getItem("mg-cite"); if (CITE_STYLES[v]) citeStyle = v; } catch {}
function setCiteStyle(v) { if (!CITE_STYLES[v]) return; citeStyle = v; try { localStorage.setItem("mg-cite", v); } catch {} }

// Page numbers (36, xii, 36–37) are shown as "p." or "pp."; standard references (A51/B75, §13, ¶178, 1094a1, H. 12) stand as written.
const PAGE_RE = /^\s*[0-9ivxlcdm]+(?:\s*[-–—]\s*[0-9ivxlcdm]+)?\s*$/i;
function loc(p) {
  const s = String(p || "").trim(); if (!s) return "";
  if (!PAGE_RE.test(s)) return s;
  return /[-–—]/.test(s) ? `pp. ${s.replace(/\s*[-–—]\s*/, "–")}` : `p. ${s}`;
}
const pageOnly = (p) => String(p || "").trim().replace(/\s*[-–—]\s*/, "–");

// Names: "Benedict de Spinoza" → Spinoza, Benedict de; "W. E. B. Du Bois" → Du Bois, W. E. B.; "bell hooks" → hooks, bell.
const LOW_PARTICLES = new Set(["de", "da", "di", "du", "del", "della", "des", "der", "den", "van", "von", "la", "le", "ten", "ter", "zu", "y", "dos", "das"]);
const JOIN_PARTICLES = new Set(["De", "Du", "Da", "Di", "Van", "Von", "Le", "La", "Del", "Della", "Des", "St.", "Ibn", "ibn", "Abu", "Abū", "bin", "bint"]);
function parseName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  let suffix = "";
  if (parts.length > 2 && /^(Jr\.?|Sr\.?|II|III|IV)$/.test(parts[parts.length - 1])) suffix = parts.pop().replace(/^(Jr|Sr)$/, "$1.");
  if (parts.length < 2) return { family: parts.join(" "), given: "", particle: "", suffix };
  let i = parts.length - 1;
  while (i > 0 && JOIN_PARTICLES.has(parts[i - 1])) i--;
  if (i === 0) return { family: parts.join(" "), given: "", particle: "", suffix };
  let j = i;
  while (j > 1 && LOW_PARTICLES.has(parts[j - 1])) j--;
  return { family: parts.slice(i).join(" "), particle: parts.slice(j, i).join(" "), given: parts.slice(0, j).join(" "), suffix };
}
const invertName = (name) => { const p = parseName(name); return p.given ? `${p.family}, ${p.given}${p.particle ? " " + p.particle : ""}${p.suffix ? ", " + p.suffix : ""}` : p.family; };
const familyName = (name) => parseName(name).family;
// The author field may hold several people ("A & B", "A and B", "A; B") and may end in ", ed." or "(eds.)".
function creatorsOf(t) {
  let s = String((t && t.author) || "").trim(), editors = false;
  const m = s.match(/,?\s*\(?\b(eds?|editors?)\.?\)?\s*$/i);
  if (m && m.index > 0) { editors = true; s = s.slice(0, m.index).trim(); }
  const names = s ? s.split(/\s*(?:&|;|\band\b)\s*/).map((x) => x.replace(/^,|,$/g, "").trim()).filter(Boolean) : [];
  return { names, editors };
}
const andList = (a) => (a.length <= 1 ? a.join("") : a.length === 2 ? `${a[0]} and ${a[1]}` : `${a.slice(0, -1).join(", ")}, and ${a[a.length - 1]}`);
const shortTitleOf = (title) => { const s = String(title || "Untitled").split(/[:?.]\s/)[0].trim(); return s.length > 2 ? s : String(title || "Untitled"); };
// Edition text such as "trans. Edwin Curley, ed. Jane Doe" becomes sentences for bibliographies.
function editionParts(edition) {
  return String(edition || "").split(/\s*[;,]\s*(?=(?:trans|translated|eds?|edited|intro|introduction|rev|with|foreword)\b)/i).map((x) => x.trim()).filter(Boolean).map((x) => {
    const y = x.replace(/^trans(?:lated)?\.?(?:\s+by)?\s+/i, "Translated by ").replace(/^eds?\.?(?:\s+by)?\s+(?=\p{Lu})/u, "Edited by ").replace(/^edited\s+by\s+/i, "Edited by ").replace(/^intro(?:duction)?\.?(?:\s+by)?\s+/i, "Introduction by ");
    return y.charAt(0).toUpperCase() + y.slice(1);
  });
}
// "trans. A, B and C" → ["A", "B", "C"]
function translatorsOf(edition) {
  const m = String(edition || "").match(/\btrans(?:lated)?\.?(?:\s+by)?\s+(.+?)(?:\s*[;,]\s*(?:eds?|edited|intro|introduction|rev|with|foreword)\b.*)?$/i);
  return m ? m[1].split(/\s*,\s*(?:and\s+)?|\s+and\s+|\s*&\s*/).map((x) => x.trim()).filter(Boolean) : [];
}
const tidyDots = (s) => s.replace(/\.\./g, ".").replace(/\s+([,.])/g, "$1").replace(/,\s*\./g, ".");

// fmt: "plain" for the clipboard's text, "md" for Markdown, "html" for previews and rich copying (escaped).
function citeParts(t, fmt) {
  const E = fmt === "html" ? esc : (x) => String(x ?? "");
  const I = (x) => (fmt === "html" ? `<i>${esc(x)}</i>` : fmt === "md" ? `*${x}*` : x);
  const { names, editors } = creatorsOf(t);
  return { E, I, names, editors, title: (t && t.title) || "Untitled", edition: (t && t.edition) || "", publisher: (t && t.publisher) || "", year: (t && t.year) || "", orig: (t && t.orig) || "" };
}
function inTextNames(names) { const f = names.map(familyName); return f.length >= 3 ? `${f[0]} et al.` : f.join(" and "); }
// A citation for one place in a text. style: note (full or short), ad, mla.
function citeAt(t, page, style, fmt, short) {
  if (!t) return "";
  const c = citeParts(t, fmt), pg = pageOnly(page);
  if (style === "ad") {
    const who = c.names.length ? c.E(inTextNames(c.names)) : c.I(shortTitleOf(c.title));
    const date = `${c.orig && c.orig !== c.year ? `[${c.E(c.orig)}] ` : ""}${c.E(c.year || "n.d.")}`;
    return `(${who} ${date}${pg ? ", " + c.E(pg) : ""})`;
  }
  if (style === "mla") {
    const who = c.names.length ? c.E(inTextNames(c.names)) : c.I(shortTitleOf(c.title));
    return `(${who}${pg ? " " + c.E(pg) : ""})`;
  }
  if (short) {
    const who = c.names.length ? c.E(inTextNames(c.names)) + ", " : "";
    return `${who}${c.I(shortTitleOf(c.title))}${pg ? ", " + c.E(pg) : ""}.`;
  }
  const who = c.names.length ? `${c.E(andList(c.names.length > 3 ? [c.names[0] + " et al."] : c.names))}${c.editors ? (c.names.length > 1 ? ", eds." : ", ed.") : ""}, ` : "";
  const py = [c.publisher, c.year].filter(Boolean).map(c.E).join(", ");
  return tidyDots(`${who}${c.I(c.title)}${c.edition ? ", " + c.E(c.edition) : ""}${py ? ` (${py})` : ""}${pg ? ", " + c.E(pg) : ""}.`);
}
// A bibliography entry for a whole text.
function bibEntry(t, style, fmt) {
  if (!t) return "";
  const c = citeParts(t, fmt);
  const inv = c.names.length ? [invertName(c.names[0]), ...c.names.slice(1)] : [];
  const eds = c.editors ? (c.names.length > 1 ? (style === "mla" ? ", editors" : ", eds.") : (style === "mla" ? ", editor" : ", ed.")) : "";
  const who = !inv.length ? "" : style === "mla" && inv.length >= 3 ? `${inv[0]}, et al.` : inv.length === 2 ? `${inv[0]}, and ${inv[1]}` : andList(inv);
  const lead = who ? `${c.E(who)}${eds}. ` : "";
  const ed = editionParts(c.edition);
  if (style === "mla") {
    const tail = [ed.length ? c.E(ed.join(", ")) : "", c.E(c.publisher), c.E(c.year)].filter(Boolean).join(", ");
    return tidyDots(`${lead}${c.I(c.title)}. ${c.orig && c.orig !== c.year ? c.E(c.orig) + ". " : ""}${tail ? tail + "." : ""}`).trim();
  }
  const edS = ed.length ? ed.map(c.E).join(". ") + ". " : "";
  if (style === "ad") {
    const date = `${c.orig && c.orig !== c.year ? `(${c.E(c.orig)}) ` : ""}${c.E(c.year || "n.d.")}`;
    // With no author, the title takes the author's place.
    return tidyDots(lead ? `${lead}${date}. ${c.I(c.title)}. ${edS}${c.publisher ? c.E(c.publisher) + "." : ""}` : `${c.I(c.title)}. ${date}. ${edS}${c.publisher ? c.E(c.publisher) + "." : ""}`).trim();
  }
  const py = [c.publisher, c.year].filter(Boolean).map(c.E).join(", ");
  return tidyDots(`${lead}${c.I(c.title)}. ${edS}${py ? py + "." : ""}`).trim();
}
const bibSortKey = (t) => { const { names } = creatorsOf(t); return fold(names.length ? familyName(names[0]) + " " + names[0] : t.title) + " " + (t.year || "") + " " + fold(t.title); };
function bibliography(tids, style, fmt) {
  return [...new Set(tids)].map((id) => S.texts.get(id)).filter(Boolean).sort((a, b) => bibSortKey(a).localeCompare(bibSortKey(b))).map((t) => bibEntry(t, style, fmt));
}
// BibTeX for Zotero, LaTeX and biblatex.
function bibtex(tids) {
  const keys = new Set(), out = [];
  const tex = (s) => String(s || "").replace(/[{}]/g, "").replace(/([&%$#_])/g, "\\$1");
  for (const id of tids) {
    const t = S.texts.get(id); if (!t) continue;
    const { names, editors } = creatorsOf(t);
    const base = (fold(names.length ? familyName(names[0]) : "anon").replace(/[^a-z]/g, "") || "anon") + (t.year || "") + (fold(shortTitleOf(t.title)).split(/\s+/).find((w) => w.length > 3 && !/^(the|and|with|from|into)$/.test(w)) || "").replace(/[^a-z]/g, "");
    let key = base, k = 1; while (keys.has(key)) key = base + String.fromCharCode(97 + k++); keys.add(key);
    const f = [];
    if (names.length) f.push([editors ? "editor" : "author", names.map(invertName).join(" and ")]);
    f.push(["title", t.title || "Untitled"]);
    const tr = translatorsOf(t.edition); if (tr.length) f.push(["translator", tr.map(invertName).join(" and ")]);
    if (t.edition && !tr.length) f.push(["note", t.edition]);
    if (t.publisher) f.push(["publisher", t.publisher]);
    if (t.year) f.push(["year", t.year]);
    if (t.orig && t.orig !== t.year) f.push(["origdate", t.orig]);
    out.push(`@book{${key},\n${f.map(([k2, v]) => `  ${k2} = {${tex(v)}}`).join(",\n")}\n}`);
  }
  return out.join("\n\n") + "\n";
}
// A passage with its citation, ready to paste.
function quoteWithCite(n, t, style, fmt) {
  const E = fmt === "html" ? esc : (x) => x, br = fmt === "html" ? "<br>" : "\n";
  const q = n.passage ? `“${E(n.passage)}”` : "";
  if (style === "note") return q ? `${q}${br}— ${citeAt(t, n.page, "note", fmt)}` : citeAt(t, n.page, "note", fmt);
  const c = citeAt(t, n.page, style, fmt);
  return q ? `${q} ${c}${style === "mla" ? "." : ""}` : c;
}
async function copyText(str) {
  try { await navigator.clipboard.writeText(str); return true; } catch {}
  try {
    const ta = document.createElement("textarea"); ta.value = str; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok;
  } catch { return false; }
}
// Rich copy keeps the italics when pasted into a word processor; plain text is the fallback.
async function copyRich(html, plain) {
  try {
    if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([plain], { type: "text/plain" }) })]);
      return true;
    }
  } catch {}
  return copyText(plain);
}
function citePanel(opts) {
  // opts: { title, make(style, fmt) }
  const rows = Object.keys(CITE_STYLES).map((st) => [st, opts.make(st, "html"), opts.make(st, "plain")]);
  openPanel(`<h2>${esc(opts.title)}</h2>
    <p class="hint">Tap a style to copy it. Drafts and exports use the style you chose last. Chicago follows its 18th edition, which leaves out the place of publication.</p>
    <div class="menu cites">${rows.map(([st, html]) => `<button class="menuitem citeopt${st === citeStyle ? " on" : ""}" data-keep="1" data-style="${st}"><b>${CITE_STYLES[st]}</b><span>${html}</span></button>`).join("")}</div>`,
  async (b) => {
    if (!b.dataset.style) return;
    const row = rows.find((r) => r[0] === b.dataset.style); if (!row) return;
    setCiteStyle(row[0]);
    document.querySelectorAll("#sheetroot .citeopt").forEach((x) => x.classList.toggle("on", x === b));
    const ok = await copyRich(row[1], row[2]);
    toast(ok ? `Copied in ${CITE_STYLES[row[0]]} style.` : "Couldn't copy. Your browser blocked the clipboard.");
  });
}
function copyCitation(nid) {
  const n = S.notes.get(nid); if (!n) return;
  const t = S.texts.get(n.textId);
  citePanel({ title: n.passage ? "Copy with citation" : "Copy the citation", make: (st, fmt) => quoteWithCite(n, t, st, fmt) });
}
function citeTextPanel(tid) {
  const t = S.texts.get(tid); if (!t) return;
  citePanel({ title: "Cite this text", make: (st, fmt) => bibEntry(t, st, fmt) });
}
/* ---------- tags and Markdown ---------- */
const TAG_RE = /(^|[^\p{L}\p{N}_&/])#([\p{L}\p{N}][\p{L}\p{N}_-]*)/gu;
// A note's follow-ups, as text; and its earlier wordings, for search only (their tags no longer collect it).
const fuTexts = (n) => (n.followups || []).map((f) => f.x);
const wasTexts = (n) => (n.was || []).flatMap((w) => [w.gloss, ...(w.premises || []), w.conclusion]).filter(Boolean);
function tagsOf(n) {
  const out = new Set(), src = [n.gloss, ...(n.premises || []), n.conclusion, ...fuTexts(n)].filter(Boolean).join(" ");
  for (const m of src.matchAll(TAG_RE)) out.add(m[2].toLowerCase());
  return [...out];
}
function allTags() {
  const m = new Map();
  for (const [, n] of S.notes) for (const tg of tagsOf(n)) m.set(tg, (m.get(tg) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
const withTags = (html) => html.replace(TAG_RE, (all, pre, tg) => `${pre}<button class="tag" data-tag="${tg.toLowerCase()}">#${tg}</button>`);
function noteMarkdown(n, t, withSource) {
  const out = [];
  const head = [withSource && t ? `*${t.title}*` : "", loc(n.page), n.page && t ? concLabel(t, n.page) : "", KINDS[n.kind] || "Note", n.resolved ? "resolved" : ""].filter(Boolean).join(", ");
  out.push(`**${head}**`, "");
  if (n.passage) {
    out.push(...n.passage.split(/\n+/).map((l) => `> ${l}`));
    if (n.original) out.push(">", ...n.original.split(/\n+/).map((l) => `> *${l}*`));
    out.push(">", `> — ${citeAt(t, n.page, citeStyle, "md")}`, "");
  } else if (n.original) out.push(`*${n.original}*`, "");
  if (n.premises && n.premises.length) { n.premises.forEach((x, k) => out.push(`${k + 1}. ${x}`)); out.push("", `**Therefore:** ${n.conclusion}`, ""); }
  if (n.gloss) out.push(n.gloss, "");
  for (const f of n.followups || []) out.push(`*Follow-up, ${fmtDate(f.at)}.* ${f.x}`, "");
  return out;
}
function notesMarkdown(tid) {
  const t = S.texts.get(tid); if (!t) return "";
  const list = sortNotes(notesFor(tid), t);
  const secName = new Map((t.sections || []).map((s) => [s.id, s.label]));
  const out = [`# ${t.title}`, ""];
  out.push(`Source: ${bibEntry(t, citeStyle, "md")}`, "");
  const sums = t.summaries || {}, groups = new Map();
  list.forEach(([id, n]) => { const k = secName.has(n.sectionId) ? n.sectionId : ""; if (!groups.has(k)) groups.set(k, []); groups.get(k).push([id, n]); });
  for (const sec of t.sections || []) {
    const notes = groups.get(sec.id) || [];
    if (!notes.length && !sums[sec.id]) continue;
    out.push(`## ${sec.label}`, "");
    if (sums[sec.id]) out.push(`*Summary.* ${sums[sec.id]}`, "");
    notes.forEach(([, n]) => out.push(...noteMarkdown(n, t, false)));
  }
  const loose = groups.get("") || [];
  if (loose.length && (t.sections || []).length) out.push("## Other notes", "");
  loose.forEach(([, n]) => out.push(...noteMarkdown(n, t, false)));
  return out.join("\n");
}
function quoteBankMarkdown(title, list) {
  const out = [`# ${title}`, "", `*${list.length} note${list.length === 1 ? "" : "s"}, exported ${new Date().toLocaleDateString()}*`, ""];
  const byText = new Map();
  list.forEach(([id, n]) => { if (!byText.has(n.textId)) byText.set(n.textId, []); byText.get(n.textId).push([id, n]); });
  for (const [tid, notes] of byText) {
    const t = S.texts.get(tid);
    out.push(`## ${t ? t.title : "Unknown text"}`, "");
    sortNotes(notes, t).forEach(([, n]) => out.push(...noteMarkdown(n, t, false)));
  }
  const bib = bibliography([...byText.keys()], citeStyle, "md");
  if (bib.length) out.push(`## ${BIB_HEAD[citeStyle]}`, "", ...bib.flatMap((b) => [b, ""]));
  return out.join("\n");
}
