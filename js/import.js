// Marginalia: bringing books in: PDF (and highlights made in another app), EPUB, Word, HTML, plain text and Markdown. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- parsing: shared ---------- */
function finalize(blocks) {
  const out = [];
  for (const b of blocks) {
    const nb = { k: b.k, x: b.k === "pg" ? clean(b.x) : tidy(fixLig(b.x || "")) };
    if (b.l) nb.l = b.l;
    if (b.s) nb.s = b.s;
    if (b.k === "front") { if (Number.isFinite(b.size)) nb.size = b.size; if (Number.isFinite(b.space)) nb.space = b.space; if (b.heading) nb.heading = true; }
    if (nb.k !== "pg" && !plain(nb.x)) continue;
    if (nb.k === "pg" && out.length && out[out.length - 1].k === "pg") { out[out.length - 1] = nb; continue; }
    if (nb.x.length > 40000) {
      let rest = nb.x, first = true;
      while (rest.length) {
        let cut = rest.length > 40000 ? rest.lastIndexOf(" ", 40000) : rest.length;
        if (cut < 20000) cut = Math.min(40000, rest.length);
        out.push({ k: first ? nb.k : nb.k === "p" ? "c" : nb.k, x: rest.slice(0, cut).trim() });
        rest = rest.slice(cut); first = false;
      }
      continue;
    }
    out.push(nb);
  }
  while (out.length && out[out.length - 1].k === "pg") out.pop();
  return out;
}
function dedupe(secs) {
  const seen = new Map();
  return secs.map((s) => { const k = s.label.toLowerCase(); const c = (seen.get(k) || 0) + 1; seen.set(k, c); return c > 1 ? { ...s, label: `${s.label} (${c})` } : s; });
}
// The language of a book's text, from how often its commonest little words appear (hyphenation depends on it).
const LANGS = { en: "English", fr: "French", de: "German", it: "Italian", es: "Spanish", la: "Latin", pt: "Portuguese", nl: "Dutch" };
const STOPS = {
  en: "the of and to in is that it as for with this which be by not are from or",
  fr: "le la les de des et est que qui dans une un pour pas ne se il en au du sur",
  de: "der die das und ist nicht zu den von mit sich des auf ein eine dem als auch",
  it: "il di che la per non una sono della del le gli si nel anche come più",
  es: "el la de que y los las en un una por con para del se no es su al",
  la: "et in est non ad quod cum ut sed qui quae esse enim etiam vel atque autem",
  pt: "o a de que e os as do da em um uma para com não se por mais",
  nl: "de het een en van is dat niet te op zijn met voor die er aan ook",
};
function guessLang(blocks) {
  const sets = Object.fromEntries(Object.entries(STOPS).map(([k, v]) => [k, new Set(v.split(" "))])), score = Object.fromEntries(Object.keys(STOPS).map((k) => [k, 0]));
  let n = 0;
  for (const b of blocks) {
    if (b.k !== "p" && b.k !== "c") continue;
    for (const w of plain(b.x || "").toLowerCase().match(/\p{L}+/gu) || []) { for (const k in sets) if (sets[k].has(w)) score[k]++; if (++n > 6000) break; }
    if (n > 6000) break;
  }
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 20 ? best[0] : "en";
}
function makeSections(blocks) {
  if (blocks.some((b) => b.s)) return dedupe(blocks.filter((b) => b.s).map((b) => ({ id: b.s, label: plain(b.x).slice(0, 90) || "Untitled" })));
  const byL = new Map();
  blocks.forEach((b) => { if (b.k === "h") byL.set(b.l || 2, (byL.get(b.l || 2) || 0) + 1); });
  const lv = [...byL.keys()].sort((a, b) => a - b).find((l) => byL.get(l) >= 3 && byL.get(l) <= 80);
  if (lv == null) return [];
  const out = [];
  blocks.forEach((b) => { if (b.k === "h" && (b.l || 2) === lv) { b.s = gid() + out.length; out.push({ id: b.s, label: plain(b.x).slice(0, 90) || "Untitled" }); } });
  return dedupe(out);
}
function linkHeadings(blocks, parsedSecs, finalSecs) {
  const byLabel = new Map(finalSecs.map((s) => [norm(s.label), s.id]));
  const idMap = new Map(parsedSecs.map((p) => [p.id, byLabel.get(norm(p.label))]));
  blocks.forEach((b) => { if (b.s) { const id = idMap.get(b.s); if (id) b.s = id; else delete b.s; } });
}

/* ---------- parsing: PDF ---------- */
// Marks a place in a line where text is missing: OCR leaves a wide blank where it couldn't read a word.
// parsePDF turns it into "[…]" or drops it (see there).
const GAP = "\uE000";
function linesOf(items) {
  const its = [];
  for (const it of items) {
    const t = it.transform;
    if (!it.str || !it.str.trim()) {
      const z = Math.hypot(t[2], t[3]) || it.height || 10;
      if (it.str && it.width > z * 2.8) its.push({ s: GAP, x: t[4], y: t[5], z: 0, w: it.width, gap: true });
      continue;
    }
    // Ligatures resolved here; soft hyphens are kept until the line is assembled, since one ending a line marks a word broken across lines.
    its.push({ s: it.str.replace(/[ﬀ-ﬆ]/g, (c) => LIG[c]), x: t[4], y: t[5], z: Math.hypot(t[2], t[3]) || it.height || 10, w: it.width || 0 });
  }
  its.sort((a, b) => b.y - a.y || a.x - b.x);
  const lines = [];
  for (const it of its) {
    const L = lines[lines.length - 1];
    if (L && Math.abs(L.y - it.y) <= Math.max(1.5, 0.5 * Math.max(L.z, it.z || L.z))) { L.items.push(it); if (it.z > L.z) { L.z = it.z; L.y = it.y; } }
    else lines.push({ y: it.y, z: it.z, items: [it] });
  }
  return lines.map((L) => {
    L.items.sort((a, b) => a.x - b.x);
    let txt = "", prev = null;
    for (const it of L.items) {
      if (it.gap) { if (prev) { txt += ` ${GAP} `; prev = it; } continue; }
      let s = it.s;
      const sup = it.z < 0.8 * L.z && it.y > L.y + 0.12 * L.z && /^[\s\d*†‡,]+$/.test(s);
      if (sup) s = toSup(s.replace(/\s/g, ""));
      if (prev && !sup) { const gap = it.x - (prev.x + prev.w); if (gap > 2.8 * L.z && !prev.gap) txt += ` ${GAP} `; else if (gap > 0.15 * L.z && !/\s$/.test(txt) && !/^\s/.test(s)) txt += " "; }
      txt += s; prev = it;
    }
    const real = L.items.filter((it) => !it.gap);
    if (!real.length) return { t: "" };
    const a = real[0], b = real[real.length - 1];
    return { t: unmerge(txt.replace(/\s+/g, " ").trim().replace(/[\u00AD\u2010\u2011]$/u, "-").replace(/\u00AD/g, "")), x: a.x, xe: b.x + b.w, y: L.y, z: L.z };
  }).filter((l) => l.t);
}
// Scanned books often lose the space after a short word ("ofselection", "inDeleuze's", "ofthe").
// Only splits no English word can be: no word begins "of" except off-, oft and often ("ofa" is "of a"),
// none begins "inthe", "tothe" and so on, and "in" before a capital letter is always two words.
const MERGED_THE = /\b(of|in|to|on|at|by|for|and|is|that|from|with|into|as)the\b/gi;
function unmerge(s) {
  return s.replace(MERGED_THE, "$1 the")
    .replace(/(^|[^\p{L}])([Oo]f)(\p{L}{2,})/gu, (m, pre, of, rest) => (/^(f|t$|ten)/i.test(rest) ? m : `${pre}${of} ${rest}`))
    .replace(/(^|[^\p{L}])([Oo]f)(a)(?!\p{L})/gu, "$1$2 $3")
    .replace(/(^|[^\p{L}])([Ii]n)(\p{Lu}\p{Ll})/gu, "$1$2 $3")
    // a lowercase word run into a capitalised name ("courseDeleuze's"); four letters or more, so names like
    // "deVries" or "McDonald" are left alone
    .replace(/(^|[^\p{L}])(\p{Ll}{4,})(\p{Lu}\p{Ll}{2,})/gu, "$1$2 $3");
}

/* Repairs for books read by OCR. The book's own words are the dictionary: counts holds every word the
   PDF uses (lowercase) and how often. Run only when the book shows OCR damage (see ocrSigns). */
const OCR_JUNK = /[\uFFFD€£¥©®°§¶^~`|\\{}<>]/u;
const ILLEGIBLE = "[illegible]";
// Signs of OCR in a line: unreadable characters, a digit or a comma inside a word, a first letter split off.
function ocrSigns(t) {
  return (t.match(/\uFFFD|[€£¥©®°¶^~`|\\{}<>]|\p{L}\d+\p{L}|\p{Ll}[,;]\p{Ll}|(?:^|\s)[B-HJ-NP-Z] \p{Ll}{2,}/gu) || []).length;
}
// Edit distance in which a misread mark (digit, punctuation, unreadable character) costs half a letter.
function ocrDist(a, b, max) {
  if (Math.abs(a.length - b.length) > max + 1) return Infinity;
  const odd = (c) => !/\p{L}/u.test(c);
  let row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const ca = a[i - 1], w = odd(ca) ? 0.5 : 1, nx = [row[0] + w];
    for (let j = 1; j <= b.length; j++) nx[j] = Math.min(row[j] + w, nx[j - 1] + 1, row[j - 1] + (ca === b[j - 1] ? 0 : w));
    if (Math.min(...nx) > max) return Infinity;
    row = nx;
  }
  return row[b.length];
}
// A dash typed as "--", or read as a hyphen before a word no compound ends in ("required-a shock").
const DASH_NEXT = new Set(["a", "an", "the", "this", "that", "these", "those", "which", "whose", "but", "is", "not", "its", "their"]);
const NOT_DASH = new Set(["one", "all", "day", "man", "get", "has", "had"]);
const REF_ABBR = /(?:^|[^\p{L}])(?:pp?|vols?|nos?|chs?|figs?|eds?|sec|art|cf|ibid)$/iu;
function ocrRepair(blocks, counts) {
  const has = (w) => counts.get(w.toLowerCase()) || 0;
  const vocab = new Map();
  for (const [w, c] of counts) if (c >= 2 && w.length >= 3 && /^\p{L}+$/u.test(w)) { const L = w.length; if (!vocab.has(L)) vocab.set(L, []); vocab.get(L).push(w); }
  // The book's one word closest to a misread one, if there is exactly one close enough.
  // A capitalised word (often a name) is corrected only where a mark was misread, never by changing
  // its letters: "Fran<;ois" must not become "Francis".
  const correct = (core) => {
    const low = core.toLowerCase(), L = low.length, marks = (low.match(/[^\p{L}]/gu) || []).length * 0.5;
    const max = Math.min(L >= 8 ? 2 : 1.5, /^\p{Lu}/u.test(core) ? marks : marks + 1);
    let best = Infinity, bestW = null, tie = false;
    for (let n = L - 2; n <= L + 2; n++) for (const w of vocab.get(n) || []) {
      const d = ocrDist(low, w, max);
      if (d < best) { best = d; bestW = w; tie = false; } else if (d === best) tie = true;
    }
    if (best > max || tie || !bestW) return null;
    const lettersOnly = core.replace(/[^\p{L}]/gu, "");
    if (lettersOnly.length > 1 && lettersOnly === lettersOnly.toUpperCase()) return bestW.toUpperCase();
    return /^\p{Lu}/u.test(core) ? bestW[0].toUpperCase() + bestW.slice(1) : bestW;
  };
  const ENDINGS = ["", "s", "es", "ed", "d", "ing", "er", "ers", "ly", "ion", "ions", "al", "ive", "ity"];
  const byStem = (core) => {
    const re = new RegExp("^" + core.toLowerCase().replace(/[^\p{L}]/gu, "\\p{L}") + "$", "u"), found = new Set();
    // every unreadable mark must fall inside the stem, so the ending is read, not guessed ("Spinoza\uFFFDr" is no "Spinozaer")
    const lastOdd = core.search(/[^\p{L}][\p{L}]*$/u);
    for (const [w, c] of counts) if (c >= 1 && w.length >= 4 && w.length > lastOdd && /^\p{L}+$/u.test(w)) for (const e of ENDINGS) if (w.length + e.length === core.length && re.test(w + e)) found.add(w + e);
    if (found.size !== 1) return null;
    const w = [...found][0];
    return /^\p{Lu}/u.test(core) ? w[0].toUpperCase() + w.slice(1) : w;
  };
  const OPEN = /^[("“‘'\[]+/u, CLOSE = /[.,;:!?)"”’'\]]+$/u;
  const fixToken = (t) => {
    const pre = (t.match(OPEN) || [""])[0], rest = t.slice(pre.length), post = (rest.match(CLOSE) || [""])[0], core = rest.slice(0, rest.length - post.length);
    if (core.length < 3) return t.includes("\uFFFD") ? ILLEGIBLE : t;
    const abbrev = /^(?:\p{L}\.){1,4}\p{L}?$/u.test(core);
    const odd = OCR_JUNK.test(core) || /\p{L}\d+\p{L}/u.test(core) || (!abbrev && /\p{L}[,;:!"]\p{L}|\p{Ll}\.\p{Ll}/u.test(core));
    if (!odd) return t;
    const letters = (core.match(/\p{L}/gu) || []).length;
    if (core.includes("-") && !/^-|-$/.test(core)) { const parts = core.split("-").map((x) => (x.length >= 4 && /[^\p{L}]/u.test(x) && correct(x)) || x); if (parts.join("-") !== core) return pre + parts.join("-") + post; }
    // Often the mark is simply extra ("fic,tions", "rela,tions"): without it, a word the book uses.
    const bare = core.replace(/[^\p{L}]/gu, "");
    if (bare.length >= 4 && /^\p{L}+[^\p{L}]\p{L}+$/u.test(core) && (has(bare) || (/s$/.test(bare) && has(bare.slice(0, -1))))) return pre + bare + post;
    if (core.length >= 4 && letters >= core.length * 0.6) { const c = correct(core); if (c) return pre + c + post; }
    // A missing space after a comma or full stop ("empiricism,Deleuze", "science.The"); not "e,g." for "e.g.",
    // nor a semicolon, which inside a word is a misread letter ("Franc;ois").
    const spaced = core.replace(/(\p{L}{2}),(?=\p{L}{2})/gu, "$1, ").replace(/(\p{Ll}{2})\.(?=\p{Lu}\p{Ll})/gu, "$1. ");
    if (spaced !== core && !OCR_JUNK.test(core)) return pre + spaced + post;
    // Stray marks after a word or number ("being.>!", "1950\uFFFD,", "342ff}") are dropped. Not before one:
    // a mark there is usually a misread letter ("}jfe" for "life").
    const trimmed = core.replace(/[^\p{L}\d.,;:!?]+$/u, "").replace(/([.,;:!?])[^\p{L}\d\s]+$/u, "$1");
    if (trimmed !== core && /^(?:\d+(?:ff)?|\p{L}+[.,;:!?]?)$/u.test(trimmed) && (/^\d/.test(trimmed) || has(trimmed.replace(/[.,;:!?]$/, "")) >= 3)) return pre + trimmed + post;
    // A misread word whose stem the book uses, with a common ending ("contr\uFFFDsted": "contrast" + "ed").
    if (/^\p{L}*[^\p{L}]{1,2}\p{L}*$/u.test(core) && letters >= 4 && core.includes("\uFFFD")) { const c = byStem(core); if (c) return pre + c + post; }
    // Beyond reading: mostly marks, or letters no word is made of (no vowel; capitals scattered inside lowercase).
    const lett = core.replace(/[^\p{L}]/gu, "");
    const gibberish = !/[aeiouAEIOU]/.test(lett) || (lett.slice(1).match(/\p{Lu}/gu) || []).length >= 2 && /\p{Ll}/u.test(lett);
    if (OCR_JUNK.test(core) && (letters < core.length * 0.75 || gibberish)) return ILLEGIBLE;
    if ((core.match(/[^\p{L}]/gu) || []).length >= 3 && !/[aeiouAEIOU]/.test(lett)) return ILLEGIBLE;
    // Only a word that is mostly marks is beyond reading; one with a single bad letter stays as it is.
    return t;
  };
  const repair = (x) => {
    x = x.replace(/\s*-{2,}\s*/g, "—")
      .replace(/(\p{L}{3,})-(\p{L}+)(?![\p{L}-])/gu, (m, a, b) => (DASH_NEXT.has(b.toLowerCase()) && !NOT_DASH.has(a.toLowerCase()) ? `${a}—${b}` : m))
      // page references whose "ff" was misread ("142ft'.", "96f£")
      .replace(/(\d)f(?:t'|t|£)/g, "$1ff").replace(/\b(\d) (\d{1,3})ff/g, "$1$2ff")
      // a note number read as letters ("explore.l1" for 11, "problems.s" for 5), run into the next word
      // ("structuralism.6Deleuze") or into a dash ("Melville43-it")
      .replace(/(\p{L}{3,})([.,;:!?]["”’)]*)([lIoOsS1-9][lIoOsS0-9]?)(?=(\s+\S)?)/gu, (m, w, p, d, nx, off, str) => {
        if (/^\d+$/.test(d) || !/^(?:[lI][lI0-9oOsS]?|[1-9][lIoOsS]|[sS]|[oO]\d)$/.test(d) || REF_ABBR.test(w)) return m;
        const after = str.slice(off + m.length);
        if (/^\p{L}/u.test(after)) return m;
        if (/^(is|so|os|io)$/i.test(d) && !/^\s+["“(]?\p{Lu}|^\s*$/u.test(after)) return m;
        return w + p + toSup(d.replace(/[lI]/g, "1").replace(/[oO]/g, "0").replace(/[sS]/g, "5"));
      })
      .replace(/(\p{L}{3,}[.,;:!?]["”’)]*)(\d{1,3})(?=\p{Lu}\p{Ll})/gu, (m, w, d) => w + toSup(d) + " ")
      .replace(/(\p{L}{3,}[.,;:!?"”’)]*)(\d{1,3})-(?=\p{Ll})/gu, (m, w, d) => w + toSup(d) + "—")
      // after a comma, semicolon or colon a run-on number is always a note, whatever follows ("professor;16 and")
      .replace(/(\p{L}{3,})([,;:]["”’)]*)(\d{1,3})(?=\s|$)/gu, (m, w, p, d) => (REF_ABBR.test(w) ? m : w + p + toSup(d)))
      // a capital letter ending a lowercase word: a misread lowercase letter ("HegeL", "itselP"), or else a full
      // stop and note number read as one letter ("mired.¹¹" read as "miredY")
      .replace(/(\p{Ll}{3,})(\p{Lu})(?=\s+["“]?\p{Lu}|\s*$)/gu, (m, w, c) => {
        // (the word's own lowercase form counts itself once, so it must occur again elsewhere)
        if (has(w + c.toLowerCase()) >= 2) return w + c.toLowerCase();
        const alt = { P: "f", I: "l", L: "l" }[c];
        if (alt && has(w + alt)) return w + alt;
        // "L" or "I" for "l" where the word then has a common ending ("reprisaL", "HegeL")
        if ((c === "L" || c === "I") && /(?:a|e|i|u|ul|l)$/.test(w)) return w + "l";
        return w + ".";
      })
      // a note number printed at full size after the end of a phrase ("image.8 To", "door,"3 The")
      .replace(/(\p{L}+)([.,;:!?]["”’)]*|["”’)]+)(\d{1,3})(?=\s+["“(]?\p{Lu}|\s*$)/gu, (m, w, p, d) => (REF_ABBR.test(w) ? m : w + p + toSup(d)))
      // numbers split by spaces: years, page references, a note's own number
      // (a year: "1 998", "1 9 5 3", or "197 1)" closing a reference; not two numbers side by side, "15 31")
      .replace(/\b([12])( ?)(\d) ?(\d) ?(\d)\b(?=([),.;]?))/g, (m, a, sp, b, c, d, close) => { const y = +(a + b + c + d); return / /.test(m) && y >= 1500 && y <= 2099 && (sp || close) ? a + b + c + d : m; })
      .replace(/\b(pp?\.\s*)([\d][\d ,\-–ff]*\d)/g, (m, p, n) => p + n.replace(/(\d) (?=\d)/g, "$1"))
      .replace(/^(\d) (\d) ?\./, "$1$2.");
    const toks = x.split(" "), out = [];
    for (let i = 0; i < toks.length; i++) {
      let t = toks[i]; const nx = toks[i + 1];
      if (nx != null) {
        // a first letter split off ("T hus", "W hitehead", "B ergson")
        const cap = t.match(/^([("“‘]?)([B-HJ-NP-Z])$/u), low = nx.match(/^(\p{Ll}+)(.*)$/u);
        if (cap && low && (has(cap[2] + low[1]) || !has(low[1]))) { out.push(cap[1] + cap[2] + low[1] + low[2]); i++; continue; }
        // a space inside a word ("si ngularity", "im manence"): the halves rarely occur alone, the whole does
        const a = t.match(/^([("“‘]?)(\p{L}+)$/u), b = nx.match(/^(\p{Ll}+)([^\p{L}]*)$/u);
        if (a && b && has(a[2] + b[1]) && (has(a[2]) <= 2 || has(b[1]) <= 2) && !(has(a[2]) >= 3 && has(b[1]) >= 3)) { out.push(a[1] + a[2] + b[1] + b[2]); i++; continue; }
      }
      out.push(fixToken(t));
    }
    return out.join(" ").replace(/(?:\[illegible\]\s*){2,}/g, ILLEGIBLE + " ");
  };
  return blocks.map((b) => (b.k === "pg" || !b.x ? b : { ...b, x: repair(b.x) }));
}

// PDF.js on a PDF, in a background worker so long books don't freeze the page: { pdf, stop }. stop() ends the worker.
async function pdfOpen(buf) {
  await need("pdf", () => !!window.pdfjsLib);
  const lib = window.pdfjsLib;
  let wk = null, pw = null;
  try {
    wk = new Worker(URL.createObjectURL(new Blob([`importScripts(${JSON.stringify(LIBS.pdfw[0])});`], { type: "text/javascript" })));
    pw = lib.PDFWorker.fromPort({ port: wk });
  } catch { wk = null; pw = null; }
  if (!pw) { try { await need("pdfw", () => !!window.pdfjsWorker); } catch {} try { lib.GlobalWorkerOptions.workerSrc = LIBS.pdfw[0]; } catch {} }
  const stop = () => { try { if (pw) pw.destroy(); } catch {} try { if (wk) wk.terminate(); } catch {} };
  const wkFail = new Promise((_, rej) => { if (wk) wk.addEventListener("error", () => rej(new UErr("Couldn't start the PDF reader. Check your connection and try again."))); });
  let pdf;
  try { pdf = await Promise.race([lib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, ...(pw ? { worker: pw } : {}) }).promise, wkFail]); }
  catch (e) { stop(); if (e && e.name === "PasswordException") throw new UErr("This PDF is password-protected. Remove the password, then load it again."); throw e; }
  return { pdf, stop };
}
/* ---------- highlights made in another app: Highlight, Underline and Squiggly annotations, with their comments ----------
   The words under each one are read from the page's text items (whole words, line by line), then found in the book's own text. */
const MARK_TYPES = new Set(["Highlight", "Underline", "Squiggly"]);
function quadsOf(a) {
  const q = a.quadPoints, box = (xs, ys) => [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  if (!q || !q.length) return a.rect ? [box([a.rect[0], a.rect[2]], [a.rect[1], a.rect[3]])] : [];
  if (typeof q[0] === "number") { const out = []; for (let i = 0; i + 7 < q.length; i += 8) out.push(box([q[i], q[i + 2], q[i + 4], q[i + 6]], [q[i + 1], q[i + 3], q[i + 5], q[i + 7]])); return out; }
  return q.map((pts) => box(pts.map((p) => p.x), pts.map((p) => p.y)));
}
function marksOnPage(anns, items) {
  const out = [];
  for (const a of anns || []) {
    if (!MARK_TYPES.has(a.subtype)) continue;
    const lines = [];
    for (const [x0, y0, x1, y1] of quadsOf(a)) {
      const line = [];
      for (const it of items) {
        if (!it.str || !it.transform || !it.width) continue;
        const [, , c, d, e, f] = it.transform, h = it.height || Math.hypot(c, d) || 10, w = it.width;
        const iy0 = f - 0.25 * h, iy1 = f + 0.85 * h;
        if (Math.min(iy1, y1) - Math.max(iy0, y0) < 0.4 * Math.min(iy1 - iy0, y1 - y0)) continue; // not this line
        if (Math.min(e + w, x1) - Math.max(e, x0) <= Math.min(2, w / 4)) continue; // not under the mark
        const str = it.str, n = str.length;
        let i0 = Math.max(0, Math.round(((x0 - e) / w) * n)), i1 = Math.min(n, Math.round(((x1 - e) / w) * n));
        while (i0 > 0 && /\S/.test(str[i0 - 1]) && /\S/.test(str[i0] || "")) i0--; // whole words: a mark rarely ends inside one
        while (i1 > 0 && i1 < n && /\S/.test(str[i1]) && /\S/.test(str[i1 - 1])) i1++;
        const part = str.slice(i0, i1).trim(); if (part) line.push([e + (w * i0) / n, part]);
      }
      if (line.length) lines.push(line.sort((p, q) => p[0] - q[0]).map((p) => p[1]).join(" "));
    }
    const text = lines.join("\n").trim(), comment = clean((a.contentsObj && a.contentsObj.str) || (typeof a.contents === "string" ? a.contents : "") || "");
    if (text) out.push({ text, comment });
  }
  return out;
}
// Every mark in a PDF: [{ text, comment, p (page index) }], and its number of pages.
async function readPdfMarks(buf, say = () => {}) {
  say("Loading the PDF reader…");
  const { pdf, stop } = await pdfOpen(buf), marks = [];
  try {
    for (let p = 1; p <= pdf.numPages; p++) {
      if (p === 1 || p % 10 === 0) { say(`Looking for highlights, page ${p} of ${pdf.numPages}…`); await new Promise((r) => setTimeout(r, 0)); }
      const page = await pdf.getPage(p), anns = await page.getAnnotations().catch(() => []);
      if (anns.some((a) => MARK_TYPES.has(a.subtype))) marks.push(...marksOnPage(anns, (await page.getTextContent()).items).map((m) => ({ ...m, p: p - 1 })));
      page.cleanup();
    }
    return { marks, pages: pdf.numPages };
  } finally { try { await pdf.destroy(); } catch {} stop(); }
}
// The book's text without spaces, each character remembering its block and place (as placeNote counts them), with typographic
// variants made alike: curly quotes, dashes, ligatures and soft hyphens.
const MARK_NORM = { "’": "'", "‘": "'", "“": '"', "”": '"', "–": "-", "—": "-", "\u00AD": "" };
const markNorm = (ch) => (ch in MARK_NORM ? MARK_NORM[ch] : ch.normalize("NFKC"));
function bookIndex(B) {
  let txt = ""; const blk = [], off = [];
  for (let k = 0; k < B.length; k++) {
    if (!markable(B[k])) continue;
    const x = plain(B[k].x || "");
    for (let c = 0; c < x.length; c++) { if (/\s/.test(x[c])) continue; for (const ch of markNorm(x[c])) { txt += ch; blk.push(k); off.push(c); } }
  }
  return { txt, blk, off };
}
// Where a mark's words are in the book: { a, ao, b, bo } or null. near is the block range [lo, hi) its page covers (or one block):
// a place inside it wins, then the nearest outside it.
function findMark(I, text, near) {
  const [lo, hi] = Array.isArray(near) ? near : [near, near + 1], dist = (k) => (k < lo ? lo - k : k >= hi ? k - hi + 1 : 0);
  const flat = (x) => [...unspace(x)].map(markNorm).join("");
  const lines = text.split("\n"), wants = [...new Set([flat(lines.join("")), flat(lines.map((l, k) => (k < lines.length - 1 ? l.replace(/[-\u00AD]$/, "") : l)).join(""))])];
  const span = (p, len) => ({ a: I.blk[p], ao: I.off[p], b: I.blk[p + len - 1], bo: I.off[p + len - 1] + 1 });
  const nearest = (w) => { let best = -1; for (let p = I.txt.indexOf(w); p >= 0; p = I.txt.indexOf(w, p + 1)) if (best < 0 || dist(I.blk[p]) < dist(I.blk[best])) best = p; return best; };
  for (const w of wants) { if (!w) continue; const p = nearest(w); if (p >= 0) return span(p, w.length); }
  // the start and the end, with something between that reads differently (a footnote number, a repaired word)
  const w = wants[wants.length - 1]; if (w.length < 50) return null;
  const p = nearest(w.slice(0, 30)); if (p < 0) return null;
  const q = I.txt.indexOf(w.slice(-20), p + 30); if (q < 0 || q - p > w.length * 1.3 + 40) return null;
  return span(p, q + 20 - p);
}
// Notes from marks: a passage note each, the comment as your note; ones already in your notes are left out.
async function addMarks(tid, marks, pages) {
  const t = S.texts.get(tid), B = await loadContent(tid); if (!t || !B) throw new UErr("This book's text isn't here, so its highlights can't be placed.");
  const I = bookIndex(B), pgs = pagesOf(B), starts = B.map((b, i) => (b.k === "pg" ? i : -1)).filter((i) => i >= 0);
  const have = new Set(notesFor(tid).map(([, n]) => unspace(n.passage))), now = Date.now(), add = [];
  let missed = 0, dup = 0;
  for (const [k, m] of marks.entries()) {
    // the blocks of the mark's page: between its page marker and the next, when the book kept one per page; else its share of the book
    const near = starts.length >= pages * 0.6 ? [starts[Math.min(m.p, starts.length - 1)], m.p + 1 < starts.length ? starts[m.p + 1] : B.length]
      : [Math.floor((m.p / Math.max(1, pages)) * B.length), Math.ceil(((m.p + 1) / Math.max(1, pages)) * B.length)];
    const A = findMark(I, m.text, near); if (!A) { missed++; continue; }
    const passage = quoteOf(B, A), key = unspace(passage);
    if (have.has(key)) { dup++; continue; } have.add(key);
    const xa = plain(B[A.a].x || ""), xb = plain(B[A.b].x || "");
    const note = { textId: tid, kind: "passage", passage, gloss: m.comment || "", page: pgs[A.a] || "", at: A.a, anchor: { ...A, pre: xa.slice(Math.max(0, A.ao - 32), A.ao), suf: xb.slice(A.bo, A.bo + 32) }, createdAt: now + k, updatedAt: now + k };
    const sec = placeIn(B, t, A.a).sec; if (sec) note.sectionId = sec;
    add.push([gid() + k, note]);
  }
  if (add.length) {
    if (idb) await idbTx(["notes"], (st) => { for (const [id, n] of add) st("notes").put(n, id); });
    for (const [id, n] of add) S.notes.set(id, n);
    render();
  }
  return { added: add.length, missed, dup };
}
function marksSaid(r) {
  return `${r.added ? `Added ${r.added} highlight${r.added === 1 ? "" : "s"} as notes.` : "No new highlights to add."}${r.dup ? ` ${r.dup} ${r.dup === 1 ? "was" : "were"} already in your notes.` : ""}${r.missed ? ` ${r.missed} couldn't be found in the book's text.` : ""}`;
}
function offerMarks(tid, marks, pages) {
  const k = marks.length;
  toast(`This PDF has ${k} highlight${k === 1 ? "" : "s"}.`, { label: "Add as notes", run: () => addMarks(tid, marks, pages).then((r) => toast(marksSaid(r))).catch((e) => toast(e instanceof UErr ? e.message : failMsg(e))) });
}
function marksSheet(tid) {
  const t = S.texts.get(tid); if (!t) return;
  openSheet(`<h2>Highlights from a PDF</h2><p class="sub">${esc(t.title)}</p>
    <p class="hint">Choose a copy of this book you marked up in another app (Acrobat, Preview, Xodo, Drive). Each highlight, underline or squiggle becomes a passage note, found in the book's own text, with its comment as your note. Ones already in your notes are left out.</p>
    <div class="field"><label for="h-file">The marked-up PDF</label><input id="h-file" name="file" type="file" accept="application/pdf,.pdf"></div>
    <p class="hint" id="h-prog" role="status"></p>`, async (fd) => {
    const f = fd.get("file"); if (!f || !f.size) return "Choose the PDF with your highlights.";
    const say = (m) => { const el = $("#h-prog"); if (el) el.textContent = m; };
    const { marks, pages } = await readPdfMarks(await f.arrayBuffer(), say);
    if (!marks.length) return "This PDF has no highlights, underlines or squiggles.";
    say("Finding them in the book…");
    const r = await addMarks(tid, marks, pages);
    return () => toast(marksSaid(r));
  });
}
async function parsePDF(buf, say) {
  say("Loading the PDF reader…");
  const { pdf, stop: stopWorker } = await pdfOpen(buf);
  const n = pdf.numPages, marks = [];
  let title = "", author = "";
  try { const m = await pdf.getMetadata(); title = clean(m?.info?.Title || ""); author = clean(m?.info?.Author || ""); } catch {}
  if (/^(microsoft|untitled)|\.(pdf|docx?|indd|tex)$/i.test(title)) title = "";
  let labels = null; try { labels = await pdf.getPageLabels(); } catch {}
  const pages = [];
  try {
    for (let p = 1; p <= n; p++) {
      if (p === 1 || p % 10 === 0) { say(`Reading page ${p} of ${n}…`); await new Promise((r) => setTimeout(r, 0)); }
      const page = await pdf.getPage(p);
      const vb = page.getViewport({ scale: 1 }).viewBox;
      const tc = await page.getTextContent();
      pages.push({ lines: linesOf(tc.items), y0: vb[1], y1: vb[3] });
      try { const anns = await page.getAnnotations(); if (anns.some((a) => MARK_TYPES.has(a.subtype))) marks.push(...marksOnPage(anns, tc.items).map((m) => ({ ...m, p: p - 1 }))); } catch {}
      page.cleanup();
    }
  } catch (e) { try { await pdf.destroy(); } catch {} stopWorker(); throw e; } // a page that can't be read doesn't leave the worker running
  let outline = [];
  try {
    let ol = await pdf.getOutline();
    if (ol && ol.length === 1 && ol[0].items && ol[0].items.length > 1) ol = ol[0].items;
    for (const o of ol || []) {
      let dest = o.dest;
      if (typeof dest === "string") dest = await pdf.getDestination(dest);
      if (!Array.isArray(dest) || dest[0] == null) continue;
      const idx = typeof dest[0] === "number" ? dest[0] : await pdf.getPageIndex(dest[0]);
      const t = clean(o.title);
      if (t) outline.push({ title: t, page: idx, id: gid() + outline.length });
    }
  } catch { outline = []; }
  if (outline.length > 120) outline = [];
  // Picture of the first page, used as the cover unless you choose your own.
  let cover = null;
  try {
    say("Making a cover from page 1…");
    const p1 = await pdf.getPage(1);
    const v1 = p1.getViewport({ scale: 1 });
    const vp = p1.getViewport({ scale: Math.min(2, 600 / v1.height, 400 / v1.width) });
    const cv = document.createElement("canvas"); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const ctx = cv.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height);
    await p1.render({ canvasContext: ctx, viewport: vp }).promise;
    cover = await new Promise((res) => cv.toBlob(res, "image/jpeg", 0.85));
    p1.cleanup();
  } catch { cover = null; }
  try { await pdf.destroy(); } catch {}
  stopWorker();

  say("Rebuilding paragraphs…");
  const all = pages.flatMap((pg) => pg.lines);
  if (all.reduce((a, l) => a + l.t.length, 0) / n < 40) throw new UErr("This PDF has no text layer, so it's a scanned image. Run OCR on it first (OCRmyPDF or Acrobat), then load it again.");
  // A scan read by OCR shows itself in its text: unreadable characters, digits and commas inside words,
  // first letters split off. Repairs that rely on that (ocrRepair, marking missing words) run only then.
  const nWords = all.reduce((a, l) => a + l.t.split(" ").length, 0);
  const signs = all.reduce((a, l) => a + ocrSigns(l.t), 0);
  const scanned = signs >= 5 && signs * 3000 >= nWords;
  // Where OCR left a wide blank, words are missing: shown as "[…]" so the gap can be checked against the
  // printed page. Not on a page where many lines have such gaps (a table, a contents page, two columns),
  // nor before a page number at the end of a line.
  pages.forEach((pg) => {
    const withGap = pg.lines.filter((l) => l.t.includes(GAP)).length, table = withGap > Math.max(2, pg.lines.length * 0.3);
    // (a blank beside a number is a column gap in a list: "1: Connections  3")
    for (const l of pg.lines) if (l.t.includes(GAP)) l.t = l.t.replace(/(^|\s)([\divxlc]+[:.)]?)\s*\uE000|\uE000\s*(?=[\divxlc]+[:.)]?(\s|$))/gi, "$1$2 ").replace(/\s*\uE000\s*/g, scanned && !table ? " […] " : " ").replace(/\s+/g, " ").trim();
  });
  const body = wmedian(all.map((l) => [l.z, l.t.length]));
  // Body size is measured page by page: scans are often enlarged or reduced a little from page to page,
  // and against one size for the whole book every line of an enlarged page looks like a heading.
  // A page with too little text to measure takes the size of the nearest page that has enough. Scans enlarge
  // pages, they don't shrink them much: a page measuring smaller is one made mostly of quotation or notes,
  // and keeps the book's size.
  const own = pages.map((pg) => (pg.lines.reduce((a, l) => a + l.t.length, 0) >= 300 ? Math.max(body, wmedian(pg.lines.map((l) => [l.z, l.t.length]))) : 0));
  pages.forEach((pg, p) => {
    pg.body = body;
    for (let d = 0; d < n; d++) { const q = [p - d, p + d].find((i) => i >= 0 && i < n && own[i]); if (q != null) { pg.body = own[q]; break; } }
  });
  const near = (z, B) => Math.abs(z - B) <= B * 0.08;
  const gaps = [];
  pages.forEach((pg) => { const L = pg.lines, B = pg.body; for (let i = 1; i < L.length; i++) if (near(L[i].z, B) && near(L[i - 1].z, B)) { const d = L[i - 1].y - L[i].y; if (d > B * 0.6 && d < B * 3) gaps.push(d / B); } });
  const leadR = median(gaps) || 1.3; // line spacing, as a multiple of the body size

  // running heads and folios
  const inEdge = (l, pg) => { const h = pg.y1 - pg.y0; return l.y > pg.y1 - h * 0.13 || l.y < pg.y0 + h * 0.11; };
  const edgeSet = (pg) => { const k = pg.lines.length; return new Set([0, 1, k - 2, k - 1].filter((i) => i >= 0 && i < k)); };
  // Allows stray marks in and around the number, as scans read "19" as "1.9" and "109" as ":1.09";
  // a misread digit is corrected from the neighbouring pages below.
  const FOLIO = /^[\[(\-–—:;.,'·\s]*([0-9]{1,4}|[0-9][.,'·][0-9]{1,2}|[ivxlcdm]{1,7})[\])\-–—:;.,'·\s]*$/i;
  const headKey = (t) => t.toLowerCase().replace(/[0-9]+/g, "#").replace(/\b[ivxlcdm]+\b/g, "#").replace(/[^\p{L}#]+/gu, " ").trim();
  const hc = new Map();
  // Scans misread running heads a little differently on each page ("Chapter 2", "Chapten!", "(hapten3",
  // "Multiplicltv"), so a short line at the page's edge also counts as a running head when its letters are
  // within a couple of misreadings of one that recurs.
  const skel = (t) => t.toLowerCase().replace(/[^\p{L}]+/gu, "");
  const lev = (a, b, max) => {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let row = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const nx = [i];
      for (let j = 1; j <= b.length; j++) nx[j] = Math.min(row[j] + 1, nx[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (Math.min(...nx) > max) return max + 1;
      row = nx;
    }
    return row[b.length];
  };
  let common = null;
  const isHead = (t) => {
    if ((hc.get(headKey(t)) || 0) >= 3) return true;
    const k = skel(t);
    if (k.length < 5 || t.split(/\s+/).length > 5) return false;
    if (!common) { const sc = new Map(); for (const [key, c] of hc) { const sk = skel(key); if (sk.length >= 5) sc.set(sk, (sc.get(sk) || 0) + c); } common = [...sc].filter(([, c]) => c >= 3).map(([sk]) => sk); }
    const max = k.length >= 6 ? 2 : 1;
    return common.some((f) => lev(k, f, max) <= max);
  };
  pages.forEach((pg) => edgeSet(pg).forEach((i) => { const l = pg.lines[i]; if (!inEdge(l, pg)) return; const k = headKey(l.t); if (k.replace(/[#\s]/g, "").length >= 3) hc.set(k, (hc.get(k) || 0) + 1); }));
  const printed = new Array(n).fill(null);
  pages.forEach((pg, p) => {
    const E = edgeSet(pg);
    // A line that is only a number is the page number; a number inside a running head ("Chapter 2") is used
    // only when the page has no such line.
    let fromHead = null;
    pg.lines = pg.lines.filter((l, i) => {
      if (!E.has(i) || !inEdge(l, pg)) return true;
      if (FOLIO.test(l.t)) { if (printed[p] == null) printed[p] = l.t.replace(/[^0-9A-Za-z]/g, ""); return false; }
      if (isHead(l.t)) { const m = l.t.match(/^\s*(\d{1,4})\b|\b(\d{1,4})\s*$/); if (m && fromHead == null) fromHead = m[1] || m[2]; return false; }
      return true;
    });
    if (printed[p] == null) printed[p] = fromHead;
  });
  // A page number that disagrees with the pages around it (a misread number, a chapter number taken for
  // the page's) is replaced by the one its neighbours agree on.
  const offs = printed.map((v, p) => (/^\d+$/.test(v || "") ? +v - p : null));
  offs.forEach((o, p) => {
    if (o == null) return;
    const votes = new Map();
    for (let q = Math.max(0, p - 4); q <= Math.min(n - 1, p + 4); q++) if (q !== p && offs[q] != null) votes.set(offs[q], (votes.get(offs[q]) || 0) + 1);
    const [best, c] = [...votes].sort((a, b) => b[1] - a[1])[0] || [null, 0];
    // Where the numbering really jumps (a page of plates, a missing page), the page keeps its number:
    // the pages on its own side of the jump agree with it.
    if (best != null && best !== o && c >= 3 && c >= (votes.get(o) || 0) + 2 && p + best > 0) printed[p] = String(p + best);
  });
  const meaningful = Array.isArray(labels) && labels.length === n && labels.some((l, i) => l && l !== String(i + 1));
  const det = printed.filter((v) => v != null).length;
  let lab, pageSource;
  if (meaningful) { lab = labels.slice(); pageSource = "labels"; }
  else if (det >= n * 0.4) {
    pageSource = "printed"; lab = printed.slice();
    for (let p = 0; p < n; p++) {
      for (let d = 1; d <= 6 && lab[p] == null; d++) for (const q of [p - d, p + d]) {
        if (q >= 0 && q < n && /^\d+$/.test(printed[q] || "")) { const v = +printed[q] + (p - q); if (v > 0) { lab[p] = String(v); break; } }
      }
      if (lab[p] == null) lab[p] = "";
    }
  } else { lab = pages.map((_, i) => String(i + 1)); pageSource = "index"; }

  // dehyphenation dictionary
  const counts = new Map(), WORD = /\p{L}+(?:-\p{L}+)*/gu;
  all.forEach((l) => { const ws = l.t.match(WORD) || []; const cut = /\p{L}-$/u.test(l.t); ws.forEach((w, i) => { if (i === 0 || (cut && i === ws.length - 1)) return; const k = w.toLowerCase(); counts.set(k, (counts.get(k) || 0) + 1); }); });
  // lost: the line ended where a hyphen would have been printed but the text has none (see the page loop).
  const joinLine = (a, b, lost) => {
    a = a.replace(/[­‐‑]$/u, "-");
    const m = a.match(/(\p{L}+)-$/u);
    if (m) {
      const nx = b.match(/^(\p{L}+)/u);
      if (!nx) return a + b;
      const ch = counts.get((m[1] + "-" + nx[1]).toLowerCase()) || 0, cj = counts.get((m[1] + nx[1]).toLowerCase()) || 0;
      return ch > cj || /^\p{Lu}/u.test(nx[1]) ? a + b : a.slice(0, -1) + b;
    }
    if (lost) {
      const w1 = a.match(/(\p{L}+)$/u), w2 = b.match(/^(\p{Ll}+)/u);
      // Kept apart only when both halves are words found elsewhere in the book and the joined word is not.
      if (w1 && w2 && !(!counts.get((w1[1] + w2[1]).toLowerCase()) && (counts.get(w1[1].toLowerCase()) || 0) >= 2 && (counts.get(w2[1]) || 0) >= 2)) return a + b;
    }
    return /[—–\/]$/.test(a) ? a + b : a + " " + b;
  };

  const hasOutline = outline.length > 0;
  const byPage = new Map();
  outline.forEach((o) => { if (!byPage.has(o.page)) byPage.set(o.page, []); byPage.get(o.page).push(o); });
  const blocks = [];
  let cur = null, curK = "p", carry = false, last = null;
  const flush = () => { if (cur && cur.trim()) blocks.push({ k: curK, x: cur }); cur = null; };
  const END = /[.!?:]["”’)\]]?$/;
  // Front matter (title pages, copyright, contents, dedications) is typeset, not prose: its lines and their spacing are kept.
  // Evidence for it, on the opening pages only, before the reading text has begun:
  //   - a copyright page's lines (ISBN, ©, cataloguing data), a line that is only "Contents" or "Copyright", or a page
  //     whose lines mostly end in page numbers (a contents page, its second page included);
  //   - otherwise a sparse page (under 18 lines) with no running prose: fewer than two lines at the body size that fill
  //     the book's line width and don't end in a page number (a contents entry does), or fewer than four beside display
  //     type (a title page's subtitle can run across the page at the body size).
  // A page where the PDF's outline starts a section of the book (Preface, Chapter 1, but not Contents or Copyright),
  // or whose first line is a heading such as "Preface" or "Introduction", begins the reading text: from there on only
  // the copyright and contents cues make front matter. So a short preface or a chapter's last short page reads as prose.
  const widths = []; pages.forEach((pg) => pg.lines.forEach((l) => { if (near(l.z, pg.body) && l.t.length >= 30) widths.push(l.xe - l.x); }));
  const measure = widths.length ? pct(widths, 0.6) : Infinity;
  const FRONT_META = /^(?:(?:e-?)?isbn\b|copyright\s*(?:©|\(c\)|\d{4})|©|all rights reserved|library of congress|british library cataloguing|cataloging[- ]in[- ]publication)/i;
  const FRONT_HEAD = /^(?:table of )?contents$|^copyright$/i;
  const FRONT_OUTLINE = /^(?:(?:front )?cover|title(?: page)?|half[- ]?title(?: page)?|copyright(?: page)?|imprint|(?:table of )?contents|dedication|epigraphs?|frontispiece|also by\b.*|other books by\b.*|praise\b.*|about the (?:authors?|publisher|book))$/i;
  const READ_HEAD = /^(?:preface|foreword|introduction|prologue|acknowledge?ments|(?:author|translator)['’]?s (?:note|preface|introduction))$/i;
  const bare0 = (x) => String(x).trim().replace(/[\s.:]+$/, "");
  const bookTitle = norm(title);
  let textBegun = false;
  pages.forEach((pg, p) => {
    const L = pg.lines;
    blocks.push({ k: "pg", x: lab[p] });
    const outs = byPage.get(p) || [];
    const reading = (p > 0 && outs.some((o) => { const t = norm(o.title); return !FRONT_OUTLINE.test(bare0(o.title)) && !(bookTitle && (t.startsWith(bookTitle) || bookTitle.startsWith(t))); }))
      || (L.length > 0 && READ_HEAD.test(bare0(L[0].t)));
    const entry = (l) => /(?:^|[\s.])(?:\d{1,4}|[ivxlcdm]{1,7})$/i.test(l.t.trim()); // ends in a page number
    const entries = L.filter(entry).length;
    const cue = entries >= Math.max(5, L.length * 0.6) || L.some((l) => FRONT_META.test(l.t.trim()) || FRONT_HEAD.test(bare0(l.t)));
    const prose = L.filter((l) => near(l.z, pg.body) && l.xe - l.x >= measure * 0.8 && !entry(l)).length;
    const display = L.some((l) => l.z >= pg.body * 1.5);
    const front = p < 10 && L.length > 0 && !reading && (cue || (!textBegun && L.length < 18 && prose < (display ? 4 : 2)));
    if (!front && (reading || prose >= 2)) textBegun = true;
    if (front) {
      // a section the PDF's outline starts here keeps its heading (and the same title printed on the page isn't repeated)
      const titled = new Set(outs.map((o) => norm(o.title)));
      outs.forEach((o) => blocks.push({ k: "h", x: o.title, l: 1, s: o.id }));
      let previous = null;
      for (const line of L) {
        if (titled.has(norm(line.t))) continue;
        // Approximate the original vertical distances without locking text to PDF coordinates.
        const gap = previous ? Math.max(0, previous.y - line.y - Math.max(previous.z, line.z) * 1.2) : 0;
        const space = Math.min(5, Math.round(gap / Math.max(1, pg.body) * 10) / 10);
        const ratio = line.z / Math.max(1, pg.body);
        const kind = ratio >= 1.3 ? "h" : "p";
        blocks.push({ k: "front", x: line.t, size: Math.max(0.78, Math.min(1.65, ratio)), space, heading: kind === "h" });
        previous = line;
      }
      carry = false; last = null; cur = null;
      return;
    }
    const B = pg.body, lead = leadR * B;
    // This page's own line spacing, measured directly (on scans it doesn't always follow the type size).
    const pitch = median(L.slice(1).map((l, i) => L[i].y - l.y).filter((d) => d > B * 0.6 && d < B * 3)) || lead;
    const bl = L.filter((l) => near(l.z, B));
    const left = bl.length ? pct(bl.map((l) => l.x), 0.15) : 0;
    const right = bl.length ? pct(bl.map((l) => l.xe), 0.9) : Infinity;
    // Justified text: most lines end at the right margin, so a line that stops one hyphen's width short
    // and runs on in lowercase lost its hyphen (common in scans).
    // (In unjustified text only about one line in ten happens to end at the margin; in justified text most do,
    // fewer when many hyphens are lost, so two in five is the line between them.)
    const justified = bl.length >= 8 && bl.filter((l) => Math.abs(l.xe - right) < B * 0.3).length >= bl.length * 0.4;
    let lastBody = -1; L.forEach((l, i) => { if (l.z >= B * 0.93) lastBody = i; });
    let fnStart = L.length;
    const nx = L[lastBody + 1];
    if (nx && nx.y < pg.y0 + (pg.y1 - pg.y0) * 0.5) fnStart = lastBody + 1;
    if (outs.length) { carry = false; last = null; }
    outs.forEach((o) => blocks.push({ k: "h", x: o.title, l: 1, s: o.id }));
    const drops = outs.map((o) => norm(o.title)).filter((s) => s.length >= 3);
    // The same title printed on the page, perhaps numbered differently ("I: Connections" for "1: Connections").
    const bare = (x) => norm(String(x).replace(/^\s*(?:\d+|[ivxlcdm]+)(?![\p{L}])[\s.:)–—-]*/iu, ""));
    const bareDrops = outs.map((o) => bare(o.title)).filter((x) => x.length >= 4);
    // A line is the printed title when it is part of it (a title broken over two lines) or the title with only a label or
    // number beside it ("Chapter 1: Connections"); a line of the text that only uses the title's word ("In this preface…") stays.
    const LABEL = /^(?:chapter|part|book|section|lecture|essay|\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)*$/;
    const isTitleLine = (nl, d) => d.includes(nl) || (nl.includes(d) && LABEL.test(nl.replace(d, "")));
    let prev = null, headOpen = false;
    // A block quote set at body size: two or more lines indented together (one of them also short of the right margin),
    // or three or more. A paragraph's indented first line is followed by a line at the margin, so it isn't one.
    const qline = (m) => m.x > left + B * 1.2 && m.x < left + B * 8 && m.z >= B * 0.92 && m.z < B * 1.18;
    const inQ = new Array(L.length).fill(false);
    for (let i = 0; i < fnStart;) {
      if (!qline(L[i])) { i++; continue; }
      let j = i; while (j + 1 < fnStart && qline(L[j + 1]) && Math.abs(L[j + 1].x - L[j].x) < B * 0.4 && L[j].y - L[j + 1].y < pitch * 1.6) j++;
      // the last indented line, run straight on by a line at the margin, is the first line of a paragraph
      const nx = L[j + 1];
      if (j > i && nx && j + 1 < fnStart && nx.x < left + B * 0.5 && L[j].y - nx.y < pitch * 1.25) j--;
      const run = L.slice(i, j + 1);
      if (run.length >= 3 || (run.length === 2 && run.some((m) => m.xe < right - B * 1.2))) for (let k = i; k <= j; k++) inQ[k] = true;
      i = Math.max(i + 1, j + 1);
    }
    for (let i = 0; i < fnStart; i++) {
      const l = L[i];
      if (drops.length && i < 5) { const nl = norm(l.t), bl = bare(l.t); if ((nl.length >= 2 && drops.some((d) => isTitleLine(nl, d))) || (bl.length >= 4 && bareDrops.includes(bl))) continue; }
      const words = l.t.split(" ").length;
      // Large type alone doesn't make a heading: one doesn't start in lowercase, break into an unfinished
      // sentence, or fill a justified line from margin to margin.
      const plausible = headOpen || (!/^\p{Ll}/u.test(l.t) && !(last && !/[.!?:;]["”’)\]]*[0-9⁰¹²³⁴⁵⁶⁷⁸⁹*†‡]*$/u.test(last.t)) && !(words >= 6 && l.x <= left + B * 0.5 && l.xe >= right - B * 0.5));
      // ...and it has extra space above or below it. The top or bottom of a page doesn't count: a heading
      // there still has space before the text it introduces.
      const above = i > 0 && L[i - 1].y - l.y > pitch * 1.35, below = i + 1 < L.length && l.y - L[i + 1].y > pitch * 1.35;
      if (l.z >= B * 1.18 && words <= 16 && plausible && (headOpen || above || below)) {
        flush(); carry = false; last = null;
        // A second line of the same heading has the same size and follows closely; anything else
        // (a chapter title, then a section title) is a heading of its own.
        if (headOpen && Math.abs(l.z - prev.z) <= prev.z * 0.1 && prev.y - l.y <= prev.z * 1.8) blocks[blocks.length - 1].x = joinLine(blocks[blocks.length - 1].x, l.t);
        else blocks.push({ k: "h", x: l.t, l: hasOutline ? 3 : l.z >= B * 1.6 ? 1 : 2 });
        headOpen = true; prev = l; continue;
      }
      headOpen = false;
      const kind = l.z < B * 0.92 || inQ[i] ? "q" : "p";
      const indented = l.x > left + B * 0.8 && l.x < left + B * 6;
      const prevInd = prev && prev.x > left + B * 0.8 && Math.abs(prev.x - l.x) < B * 0.5;
      const shortPrev = !!last && last.xe < last.right - B * 2.2 && END.test(last.t);
      const lost = justified && !!last && last.right - last.xe > B * 0.15 && last.right - last.xe < B * 0.9 && /^\p{Ll}/u.test(l.t);
      let start;
      if (!cur) start = !carry || indented || kind !== "p" || shortPrev;
      else start = kind !== (curK === "c" ? "p" : curK) || (prev && prev.y - l.y > lead * 1.5) || (indented && !prevInd) || shortPrev;
      if (start) { flush(); cur = l.t; curK = kind; }
      else if (!cur) { cur = l.t; curK = "c"; }
      else cur = joinLine(cur, l.t, lost);
      carry = false; prev = l; last = { t: l.t, xe: l.xe, right };
    }
    carry = !!cur; flush();
    let fn = null;
    for (let i = fnStart; i < L.length; i++) {
      const l = L[i];
      const st = /^([0-9¹²³⁴⁵⁶⁷⁸⁹⁰]+|[*†‡§])/.test(l.t) && l.x < left + B * 3;
      if (!fn || st) { if (fn) blocks.push({ k: "fn", x: fn }); fn = l.t; } else fn = joinLine(fn, l.t);
    }
    if (fn) blocks.push({ k: "fn", x: fn });
  });
  flush();
  return { title, author, kind: "PDF", blocks: scanned ? ocrRepair(blocks, counts) : blocks, pageSource, cover, labels: lab, marks, nPages: n };
}

/* ---------- parsing: EPUB / Word / HTML ---------- */
const BLOCK = new Set("address article aside blockquote body dd details div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr li main nav ol p pre section table tbody thead tfoot tr td th ul".split(" "));
const SKIP = new Set(["script", "style", "head", "title", "meta", "link", "svg", "img", "picture", "video", "audio"]);
const ITAL = new Set(["i", "em", "cite", "var", "dfn"]);
function domToBlocks(root, blocks) {
  let buf = "", kind = "p";
  const attr = (el, a) => (el.getAttribute && el.getAttribute(a)) || "";
  const isPB = (el) => /pagebreak/.test(attr(el, "epub:type")) || attr(el, "role") === "doc-pagebreak";
  const pbLabel = (el) => clean(attr(el, "aria-label") || attr(el, "title") || el.textContent || attr(el, "id").replace(/^\D+/, ""));
  const isFn = (el) => /footnote|endnote|rearnote/.test(`${attr(el, "epub:type")} ${attr(el, "role")} ${attr(el, "class")}`);
  const name = (el) => (el.localName || "").toLowerCase();
  const flush = () => { const x = tidy(buf); if (plain(x)) blocks.push({ k: kind, x }); buf = ""; };
  function inl(nd) {
    if (nd.nodeType === 3) { buf += nd.nodeValue; return; }
    if (nd.nodeType !== 1) return;
    const tag = name(nd);
    if (SKIP.has(tag)) return;
    if (isPB(nd)) { const had = !!plain(tidy(buf)), save = kind; flush(); blocks.push({ k: "pg", x: pbLabel(nd) }); kind = had && save === "p" ? "c" : save; return; }
    if (BLOCK.has(tag)) { const save = kind === "c" ? "p" : kind; flush(); walk(nd, save); kind = save; return; }
    if (tag === "br") { buf += " "; return; }
    if (tag === "sup") { const t = nd.textContent.trim(); buf += /^\d+$/.test(t) ? toSup(t) : t; return; }
    const it = ITAL.has(tag);
    if (it) buf += I0;
    for (const c of nd.childNodes) inl(c);
    if (it) buf += I1;
  }
  function walk(el, k) {
    const tag = name(el);
    if (SKIP.has(tag)) return;
    if (isPB(el)) { flush(); blocks.push({ k: "pg", x: pbLabel(el) }); return; }
    if (/^h[1-6]$/.test(tag)) {
      flush(); kind = "h";
      for (const c of el.childNodes) inl(c);
      const x = tidy(buf); buf = "";
      if (plain(x)) blocks.push({ k: "h", x, l: +tag[1] });
      kind = k; return;
    }
    const myK = isFn(el) ? "fn" : tag === "blockquote" ? "q" : k;
    flush(); kind = myK;
    for (const c of el.childNodes) {
      if (c.nodeType === 1 && BLOCK.has(name(c)) && !isPB(c)) { flush(); walk(c, myK); kind = myK; }
      else inl(c);
    }
    flush(); kind = k;
  }
  walk(root, "p");
}
function resolvePath(base, rel) {
  const out = [];
  for (const seg of (base + rel).split("/")) { if (seg === "..") out.pop(); else if (seg && seg !== ".") out.push(seg); }
  return out.join("/");
}
async function parseEPUB(buf, say) {
  say("Opening the EPUB…");
  await need("zip", () => !!window.JSZip);
  const zip = await window.JSZip.loadAsync(buf);
  const xml = (s) => new DOMParser().parseFromString(s, "application/xml");
  const cf = zip.file("META-INF/container.xml");
  if (!cf) throw new UErr("This EPUB is damaged: its container file is missing.");
  const opfPath = xml(await cf.async("text")).getElementsByTagName("rootfile")[0]?.getAttribute("full-path");
  const opfFile = opfPath && zip.file(opfPath);
  if (!opfFile) throw new UErr("This EPUB is damaged: its package file is missing.");
  const opf = xml(await opfFile.async("text"));
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const first = (tag) => clean(opf.getElementsByTagNameNS("*", tag)[0]?.textContent || "");
  const man = new Map();
  for (const it of opf.getElementsByTagNameNS("*", "item")) man.set(it.getAttribute("id"), it.getAttribute("href") || "");
  const spine = [...opf.getElementsByTagNameNS("*", "itemref")].filter((r) => r.getAttribute("linear") !== "no").map((r) => man.get(r.getAttribute("idref"))).filter(Boolean);
  const blocks = [];
  for (let i = 0; i < spine.length; i++) {
    say(`Reading part ${i + 1} of ${spine.length}…`);
    let href = spine[i].split("#")[0]; try { href = decodeURIComponent(href); } catch {}
    const f = zip.file(resolvePath(base, href)); if (!f) continue;
    const src = await f.async("text");
    let doc = new DOMParser().parseFromString(src, "application/xhtml+xml");
    if (doc.getElementsByTagName("parsererror").length) doc = new DOMParser().parseFromString(src, "text/html");
    const b = doc.getElementsByTagName("body")[0];
    if (b) domToBlocks(b, blocks);
  }
  // The cover image the publisher packed into the EPUB, if there is one.
  let cover = null;
  try {
    const items = [...opf.getElementsByTagNameNS("*", "item")];
    const metaCover = [...opf.getElementsByTagNameNS("*", "meta")].find((m) => m.getAttribute("name") === "cover");
    let it = items.find((i) => /(^|\s)cover-image(\s|$)/.test(i.getAttribute("properties") || ""));
    if (!it && metaCover) it = items.find((i) => i.getAttribute("id") === metaCover.getAttribute("content"));
    if (!it) it = items.find((i) => /^image\//.test(i.getAttribute("media-type") || "") && /cover/i.test(`${i.getAttribute("id") || ""} ${i.getAttribute("href") || ""}`));
    if (it) {
      let href = it.getAttribute("href") || ""; try { href = decodeURIComponent(href); } catch {}
      const f = zip.file(resolvePath(base, href));
      if (f) cover = await toCover(new Blob([await f.async("arraybuffer")], { type: it.getAttribute("media-type") || "image/jpeg" }));
    }
  } catch { cover = null; }
  return { title: first("title"), author: first("creator"), kind: "EPUB", blocks, cover };
}
async function parseDOCX(buf, say) {
  say("Opening the Word file…");
  await need("docx", () => !!window.mammoth);
  const r = await window.mammoth.convertToHtml({ arrayBuffer: buf });
  const doc = new DOMParser().parseFromString(r.value, "text/html");
  const blocks = []; domToBlocks(doc.body, blocks);
  return { title: "", author: "", kind: "Word", blocks };
}
function parseHTML(src) {
  const doc = new DOMParser().parseFromString(src, "text/html");
  const blocks = []; domToBlocks(doc.body, blocks);
  const meta = (n) => clean(doc.querySelector(`meta[name="${n}"]`)?.getAttribute("content") || "");
  const r = { title: clean(doc.title || ""), author: meta("author"), kind: "HTML", blocks };
  if (meta("marginalia:edition")) r.edition = meta("marginalia:edition"); // a text from Wikisource carries its translator and year
  if (meta("marginalia:year")) r.year = meta("marginalia:year");
  if (meta("marginalia:lang")) r.lang = meta("marginalia:lang");
  return r;
}

/* ---------- parsing: plain text / Markdown ---------- */
function parsePlain(src, md) {
  src = src.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const blocks = [];
  const joinP = (a, b) => (/\p{L}-$/u.test(a) && /^\p{Ll}/u.test(b) ? a.slice(0, -1) + b : a + " " + b);
  const ital = (s) => s.replace(/(^|[\s(“"'])[*_]([^*_\n]+?)[*_](?=[\s).,;:!?”"']|$)/g, `$1${I0}$2${I1}`);
  const inlineMd = (s) => ital(s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1").replace(/`([^`]+)`/g, "$1"));
  const HEAD = /^(chapter|part|book|section|lecture|essay|preface|foreword|introduction|conclusion|appendix|afterword|notes)\b/i;
  for (const chunk of src.split(/\n[ \t]*\n/)) {
    const lines = chunk.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim());
    if (!lines.length) continue;
    if (md) {
      let acc = "", ak = "p";
      const fl = () => { const x = tidy(inlineMd(acc)); if (plain(x)) blocks.push({ k: ak, x }); acc = ""; ak = "p"; };
      for (const ln of lines) {
        const h = ln.match(/^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/);
        if (h) { fl(); blocks.push({ k: "h", x: tidy(inlineMd(h[2])), l: h[1].length }); continue; }
        const q = ln.match(/^\s*>\s?(.*)$/);
        if (q) { if (ak !== "q") fl(); ak = "q"; acc = acc ? joinP(acc, q[1].trim()) : q[1].trim(); continue; }
        if (ak === "q") fl();
        const li = ln.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
        if (li) { fl(); acc = li[1].trim(); continue; }
        if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(ln)) { fl(); continue; }
        acc = acc ? joinP(acc, ln.trim()) : ln.trim();
      }
      fl(); continue;
    }
    const one = lines.length === 1 ? lines[0].trim() : null;
    if (one && one.length < 90 && (HEAD.test(one) || /^[IVXLC]+\.?$/.test(one) || (/\p{Lu}{2}/u.test(one) && !/\p{Ll}/u.test(one) && one.split(/\s+/).length <= 10))) {
      blocks.push({ k: "h", x: one, l: /^(part|book)\b/i.test(one) ? 1 : 2 }); continue;
    }
    const indentedAll = lines.length > 1 && lines.every((l) => /^\s{2,}/.test(l));
    const x = ital(lines.map((l) => l.trim()).reduce((a, b) => (a ? joinP(a, b) : b), ""));
    blocks.push({ k: indentedAll ? "q" : "p", x });
  }
  return { title: "", author: "", blocks };
}

async function parseFile(file, say) {
  const fname = file.name || "file";
  const ext = (fname.includes(".") ? fname.split(".").pop() : "").toLowerCase();
  let r;
  if (ext === "pdf") r = await parsePDF(await file.arrayBuffer(), say);
  else if (ext === "epub") r = await parseEPUB(await file.arrayBuffer(), say);
  else if (ext === "docx") r = await parseDOCX(await file.arrayBuffer(), say);
  else if (ext === "html" || ext === "htm" || ext === "xhtml") r = parseHTML(await file.text());
  else if (ext === "md" || ext === "markdown") r = { ...parsePlain(await file.text(), true), kind: "Markdown" };
  else if (ext === "txt" || ext === "text" || (file.type || "").startsWith("text/")) r = { ...parsePlain(await file.text(), false), kind: "Text" };
  else throw new UErr("This file type isn't supported. Use PDF, EPUB, Word (.docx), .txt or .md.");
  r.blocks = finalize(r.blocks);
  if (!r.blocks.some((b) => b.k !== "pg")) throw new UErr("No readable text was found in this file.");
  r.sections = makeSections(r.blocks);
  r.name = fname;
  r.pages = r.blocks.filter((b) => b.k === "pg").length;
  r.title = r.title ? tidyTitle(r.title, false) : tidyTitle(fname, true);
  r.lang = r.lang || guessLang(r.blocks);
  if (r.kind === "PDF") r.file = file;
  return r;
}
// A readable title from a file name or PDF metadata: drops download-site tags, ISBNs, hashes and
// "(Publisher, 1995)" tails; a file name written like the-bataille-reader becomes The Bataille Reader.
const SITE_TAGS = /\b(?:dokumen\.(?:pub|tips)|ebin\.pub|vdoc\.pub|epdf\.(?:pub|tips)|epub\.pub|pdfcoffee\.com|pdfdrive(?:\.com)?|oceanofpdf(?:\.com)?|z-?lib(?:rary)?(?:\.org)?|1lib(?:\.[a-z]+)?|b-ok(?:\.[a-z]+)?|libgen(?:\.[a-z]+)?|annas?-archive(?:\.[a-z]+)?)\b/gi;
const SMALL_WORDS = new Set(["a", "an", "and", "the", "of", "in", "on", "to", "for", "or", "nor", "but", "at", "by", "with", "from", "as", "vs", "de", "du", "la", "le", "et", "und", "der", "die", "das"]);
function tidyTitle(s, fromFile) {
  const raw = String(s || "").trim();
  let x = fromFile ? raw.replace(/\.[a-z0-9]{1,5}$/i, "") : raw;
  const base = x;
  x = x.replace(/(\S)_ /g, "$1: ").replace(/_+/g, " ")
    .replace(/[[(][^\])]*(?:z-?lib|libgen|anna)[^\])]*[\])]/gi, " ")
    .replace(SITE_TAGS, " ")
    .replace(/\b(?:97[89][-\s]?)?\d{9}[\dXx]\b/g, " ")
    .replace(/\b[0-9a-f]{16,}\b/gi, " ")
    .replace(/\s*[[(][^\])]*\b(?:1[5-9]|20)\d\d\b[^\])]*[\])]\s*$/, "")
    .replace(/\s+/g, " ").replace(/^[\s\-–—_.,;:]+|[\s\-–—_.,;:]+$/g, "");
  if (fromFile && !/\s/.test(x) && (x.match(/-/g) || []).length >= 2) x = x.replace(/-+/g, " ");
  if (fromFile && x === x.toLowerCase()) x = x.split(" ").map((w, i) => (i && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
  return x || base || raw;
}
function summary(r) {
  const paras = r.blocks.filter((b) => b.k !== "pg" && b.k !== "h").length;
  const bits = [];
  if (r.pages) bits.push(`${r.pages} pages`);
  bits.push(`${r.sections.length} section${r.sections.length === 1 ? "" : "s"}`);
  bits.push(`${paras.toLocaleString()} paragraphs`);
  let s = `Found ${bits.join(", ")}.`;
  if (r.pageSource === "index") s += " No printed page numbers were found, so pages follow the PDF's own count.";
  if (r.kind === "PDF") s += " Running heads, page numbers and footnotes were separated out automatically.";
  if (r.cover) s += r.kind === "PDF" ? " Page 1 is set as the cover." : " Found the cover image.";
  return s + " Check the details, then save.";
}
