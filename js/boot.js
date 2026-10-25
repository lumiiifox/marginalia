// Marginalia: events for the whole app, the classics that come with it, and starting up. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- events ---------- */
function arm(btn, run) {
  if (btn.classList.contains("armed")) { run(); return; }
  btn.classList.add("armed"); const old = btn.textContent; btn.textContent = "Tap again to delete";
  setTimeout(() => { if (btn.isConnected) { btn.classList.remove("armed"); btn.textContent = old; } }, 3000);
}
document.addEventListener("click", (e) => {
  const fr = e.target.closest && e.target.closest("#book [data-fn]");
  if (fr && S.screen === "reader") { const s = window.getSelection(); if (!s || s.isCollapsed) { const at = fr.closest("[data-i]"); notePanel(at ? +at.dataset.i : currentBlock(), +fr.dataset.fn); return; } }
  const mk = e.target.closest && e.target.closest("mark[data-note], .mnote[data-note]");
  if (mk && S.screen === "reader") { const s = window.getSelection(); if (!s || s.isCollapsed) { noteSheet(mk.dataset.note); return; } }
  const b = e.target.closest && e.target.closest("button"); if (!b || b.closest("#sheetroot")) return;
  if (b.id === "addtext") return textSheet(null);
  if (b.id === "back") return back();
  if (b.dataset.open) return go({ screen: "text", textId: b.dataset.open });
  if (b.dataset.bookmenu) return bookMenu(b.dataset.bookmenu);
  if (b.dataset.shelf) {
    const st = b.dataset.shelf, closing = S.shelfOpen.has(st);
    if (closing) S.shelfOpen.delete(st); else S.shelfOpen.add(st);
    render();
    if (closing) { const el = $(`[data-shelf="${st}"]`); if (el) el.closest(".shelf").scrollIntoView({ block: "nearest" }); }
    return;
  }
  if (b.id === "read") return go({ screen: "reader", textId: S.textId });
  if (b.id === "loadfile") return fileSheet(S.textId);
  if (b.dataset.gotoNote) return go({ screen: "reader", textId: b.dataset.tid, at: +b.dataset.gotoNote, flash: true });
  if (b.id === "rback") return back();
  if (b.id === "rtback") return trailBack();
  if (b.id === "rthere") return readFromHere(false);
  if (b.id === "fprev") return stepFind(-1);
  if (b.id === "fnext") return stepFind(1);
  if (b.id === "fclose") return endFind();
  if (b.id === "sellook") return lookupSel();
  if (b.id === "rmark") return toggleBookmark();
  if (b.id === "rfind") return findPanel();
  if (b.id === "raa") return readerSettings();
  if (b.id === "rtoc") return tocPanel();
  if (b.id === "rpg") return showNav($("#rnav").hidden);
  if (b.id === "rnav-close") { showBars(false); return showNav(false); }
  if (b.id === "rnav-pp") return printedPagePanel();
  if (b.id === "rnav-pair") return pairPanel();
  if (b.dataset.navnotes) return navNotesOpen(+b.dataset.navnotes);
  if (b.id === "selsave") return saveSel();
  if (b.id === "selhl") return quickHighlight();
  if (b.id === "selpin") return pinSel();
  if (b.id === "selmore") return carrySel();
  if (b.id === "selcarryx") return endCarry();
  if (b.id === "seledit") return structurePanel();
  if (b.id === "more") return moreMenu();
  if (b.dataset.branch) return go({ screen: "branches", focus: b.dataset.branch, sec: b.dataset.bsec });
  if (b.dataset.classic) return openClassic(b.dataset.classic);
  if (b.id === "openbranches") return go({ screen: "branches" });
  if (b.id === "openthinkers") { if (S.screen === "reference") S.tl = true; return go({ screen: "thinkers" }); }
  if (b.dataset.ref) { S.rq = ""; return go({ screen: "reference", rk: b.dataset.ref }); }
  if (b.dataset.rk) { S.rk = b.dataset.rk; return render(); }
  if (b.dataset.era && !b.closest("#book")) { S.tl = true; S.pq = ""; return go({ screen: "thinkers", era: b.dataset.era }); }
  if (b.dataset.garea) { S.gArea = b.dataset.garea; S.gq = ""; S.gOpen = new Set(); return go({ screen: "glossary" }); }
  if (b.id === "openglossary") { S.gq = ""; S.gArea = "all"; return go({ screen: "glossary" }); }
  if (b.dataset.term) return openTerm(b.dataset.term);
  if (b.dataset.passage) return openPassage(b.dataset.passage, b.dataset.passageAt);
  if (b.dataset.thinker) return thinkerPanel(b.dataset.thinker);
  if (b.dataset.area) { S.gArea = b.dataset.area; return render(); }
  if (b.dataset.tl) { S.tl = b.dataset.tl === "1"; return render(); }
  if (b.id === "addterm") return termSheet(null);
  if (b.id === "quiz") return quizPanel(S.screen === "glossary" ? S.gArea : S.screen === "thinkers" || (S.screen === "reference" && S.rk === "thinkers") ? "thinkers" : "all");
  if (b.id === "mywords") return wordsPanel();
  if (b.id === "resurfnext") { resurfSkip++; const el = $("#resurf"); if (el) el.outerHTML = resurfHTML(); return; }
  if (b.id === "openpaths") return go({ screen: "paths" });
  if (b.id === "opendisputes") return go({ screen: "disputes" });
  if (b.dataset.dispute) return disputePanel(b.dataset.dispute);
  if (b.id === "openplates") return go({ screen: "plates" });
  if (b.dataset.path) return go({ screen: "paths", path: b.dataset.path });
  if (b.dataset.pathread) { const [tid, sec] = b.dataset.pathread.split("|"); return readStep(tid, sec.split(",")); }
  if (b.dataset.pathadd) return readdClassic(b.dataset.pathadd);
  if (b.dataset.askq) return askQuestion(b.dataset.askq);
  if (b.dataset.wsfind) { const [lang, q] = b.dataset.wsfind.split("|"); textSheet(null); const v = $("#sheetroot .veil"); if (v && v.wsStart) v.wsStart(lang, q); return; }
  if (b.dataset.pathshare) { const P = PATHS.find((x) => x.id === b.dataset.pathshare); return shareLink(`${appURL()}#path=${encodeURIComponent(P.id)}`, `Reading path: ${P.n}`); }
  if (b.dataset.argquiz) return quizPanel(b.dataset.argquiz);
  if (b.dataset.steps) return stepsPanel();
  if (b.dataset.recon) return reconPanel();
  if (b.id === "guess") return guessPanel();
  if (b.id === "puzzles") return puzzlesMenu();
  if (b.dataset.truth) { const ex = TT_EXAMPLES[+b.dataset.truth]; return truthPanel(ex ? { prem: ex[1], concl: ex[2] } : undefined); }
  if (b.dataset.say) return sayIt(b.dataset.say);
  if (b.dataset.editterm) return termSheet(b.dataset.editterm);
  if (b.dataset.restoreterm) return del("terms", b.dataset.restoreterm).catch((e) => toast(failMsg(e)));
  if (b.dataset.delterm) return arm(b, () => del("terms", b.dataset.delterm).catch((e) => toast(failMsg(e))));
  if (b.id === "backup") return exportBackup().catch((e) => toast(failMsg(e)));
  if (b.id === "addnote") return noteSheet(null);
  if (b.dataset.editnote) return noteSheet(b.dataset.editnote);
  if (b.dataset.followup) return noteSheet(b.dataset.followup, null, "fu");
  if (b.dataset.cite) return copyCitation(b.dataset.cite);
  if (b.dataset.jump) return jumpToNote(b.dataset.jump);
  if (b.dataset.todraft) return addToDraftPanel([b.dataset.todraft]);
  if (b.dataset.resolve) {
    const n = S.notes.get(b.dataset.resolve); if (!n) return;
    const resolved = !n.resolved, data = { ...n, resolved, updatedAt: Date.now() };
    if (resolved) data.resolvedAt = Date.now(); else delete data.resolvedAt;
    return put("notes", b.dataset.resolve, data).then(() => toast(resolved ? "Marked resolved." : "Reopened.")).catch((err) => toast(failMsg(err)));
  }
  if (b.hasAttribute("data-tag")) {
    const tg = b.dataset.tag;
    if (S.screen === "tag" && S.tag === tg) return;
    return go({ screen: "tag", tag: tg });
  }
  if (b.id === "openquestions") return go({ screen: "questions" });
  if (b.id === "editsummary") return summarySheet(S.textId, S.sec);
  if (b.id === "editnext") return nextSheet(S.textId);
  if (b.id === "exporttag") return saveFile(`tag-${slug(S.tag)}.md`, quoteBankMarkdown(`#${S.tag}`, taggedWith(S.tag)), "text/markdown").catch(() => toast("Couldn't export."));
  if (b.id === "exportquestions") return saveFile(`open-questions-${stamp()}.md`, quoteBankMarkdown("Open questions", questionNotes().filter(([, n]) => !n.resolved)), "text/markdown").catch(() => toast("Couldn't export."));
  if (b.dataset.sec) { S.sec = S.sec === b.dataset.sec ? "all" : b.dataset.sec; return render(); }
  if (b.dataset.kind) { S.kind = b.dataset.kind; return render(); }
  // drafts
  if (b.id === "opendrafts") return go({ screen: "drafts" });
  if (b.id === "opentrash") return go({ screen: "trash" });
  if (b.dataset.untrash) return restoreTrash(b.dataset.untrash).catch((e) => toast(failMsg(e)));
  if (b.dataset.purge) return arm(b, () => purgeTrash([b.dataset.purge]).catch((e) => toast(failMsg(e))));
  if (b.id === "trash-empty") return arm(b, () => purgeTrash([...S.trash.keys()]).catch((e) => toast(failMsg(e))));
  if (b.id === "newdraft") return draftTitleSheet(null);
  if (b.dataset.draft) return go({ screen: "draft", draftId: b.dataset.draft });
  if (b.id === "d-addnotes") { const d = S.drafts.get(S.draftId); if (!d) return; const have = new Set((d.items || []).filter((x) => x.t === "note").map((x) => x.id)); const id = S.draftId; return notePickerPanel("Add notes", have, (ids) => addNotesToDraft(id, ids).then((n) => toast(`Added ${n} note${n === 1 ? "" : "s"}.`))); }
  if (b.id === "d-addh") return draftTextSheet(S.draftId, null, "h");
  if (b.id === "d-addp") return draftTextSheet(S.draftId, null, "p");
  if (b.id === "d-export") return exportMenu(S.draftId);
  if (b.id === "d-more") return draftMore(S.draftId);
  if (b.dataset.dmove) { const [k, dir] = b.dataset.dmove.split(":").map(Number); return moveDraftItem(S.draftId, k, dir); }
  if (b.dataset.dremove) return removeDraftItem(S.draftId, +b.dataset.dremove);
  if (b.dataset.dedit) return draftTextSheet(S.draftId, +b.dataset.dedit);
  // search all books
  if (b.id === "searchall") return go({ screen: "concord" });
  if (b.id === "searchbooks") return go({ screen: "concord", q: S.q.trim() });
  if (b.dataset.conc) return go({ screen: "reader", textId: b.dataset.conc, at: +b.dataset.at, flash: true, find: CONC.q });
  if (b.dataset.concmore) { const id = b.dataset.concmore; if (CONC.open.has(id)) CONC.open.delete(id); else CONC.open.add(id); return drawConcord(); }
  if (b.id === "exportbtn") return exportPanel();
  // comparisons
  if (b.id === "opencompares") return go({ screen: "compares" });
  if (b.id === "newcmp") return cmpNewSheet();
  if (b.dataset.cmp) return go({ screen: "compare", cmpId: b.dataset.cmp });
  if (b.dataset.cell) return cellSheet(S.cmpId, b.dataset.cell);
  if (b.dataset.cside) return sideSheet(S.cmpId, b.dataset.cside);
  if (b.id === "cmp-addside") return sideSheet(S.cmpId, null);
  if (b.id === "cmp-addrow") return rowSheet(S.cmpId, null);
  if (b.dataset.crow) return rowSheet(S.cmpId, b.dataset.crow);
  if (b.dataset.cmove) { const [rid, dir] = b.dataset.cmove.split(":"); return moveCmpRow(S.cmpId, rid, +dir); }
  if (b.dataset.cmode) { cmpMode = b.dataset.cmode === "table" ? "table" : "rows"; try { localStorage.setItem("mg-cmpview", cmpMode); } catch {} return render(); }
  if (b.id === "cmp-gaps") { S.cmpGaps = !S.cmpGaps; return render(); }
  if (b.id === "cmp-verdict") return verdictSheet(S.cmpId);
  if (b.id === "cmp-export") return cmpExportPanel(S.cmpId);
  if (b.id === "cmp-more") return cmpMore(S.cmpId);
});
document.addEventListener("change", (e) => {
  if (e.target.id === "restore") { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) importBackup(f); return; }
  if (S.screen !== "text") return;
  const t = S.texts.get(S.textId);
  if (e.target.id === "status" && t) { const rec = { ...t, status: e.target.value, updatedAt: Date.now() }; delete rec.rank; put("texts", S.textId, rec).catch(() => {}); } // to the front of its new shelf
  if (e.target.dataset && e.target.dataset.tick && t) {
    const sections = t.sections.map((s) => (s.id === e.target.dataset.tick ? { ...s, done: e.target.checked } : s));
    put("texts", S.textId, { ...t, sections, updatedAt: Date.now() }).catch(() => {});
  }
});
document.addEventListener("toggle", (e) => {
  const d = e.target;
  if (d && d.matches && d.matches("details.branch")) { if (d.open) S.bOpen.add(d.dataset.branchId); else S.bOpen.delete(d.dataset.branchId); return; }
  if (d && d.matches && d.matches("details.term")) { if (d.open) { S.gOpen.add(d.dataset.termId); fillLinks(d); fillMentions(d); } else S.gOpen.delete(d.dataset.termId); }
}, true);
let qTimer;
document.addEventListener("input", (e) => {
  if (e.target.id !== "q" && e.target.id !== "tq" && e.target.id !== "gq" && e.target.id !== "pq" && e.target.id !== "rq") return;
  const key = e.target.id; S[key] = e.target.value;
  clearTimeout(qTimer); qTimer = setTimeout(() => { render(); const el = $("#" + key); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }, 180);
});

/* ---------- classics: public-domain books that come with the app ----------
   Each is added to the library once, the first time the app opens with it: its text from data/books/<id>.json ({ text,
   content }, built by tools/build_classics.py) and its cover from data/books/<id>.jpg, on the Queued shelf. mg-classics
   lists those added, so a classic you delete stays deleted; one that can't be fetched (offline) is tried again next time.
   Tests run in an automated browser, which is left out unless a test asks (addClassics(true)). */
const CLASSICS = ["classic-plato-socrates", "classic-plato-republic", "classic-aristotle-ethics", "classic-descartes-meditations", "classic-hobbes-leviathan", "classic-spinoza-ethics", "classic-hume-treatise", "classic-hume-enquiry",
  "classic-rousseau-social-contract", "classic-kant-groundwork", "classic-wollstonecraft-vindication", "classic-marx-engels-manifesto", "classic-mill-liberty", "classic-nietzsche-beyond", "classic-nietzsche-genealogy",
  "classic-cooper-voice", "classic-du-bois-souls", "classic-russell-problems"]; // in historical order, the shelf's order
let classicsBusy = false;
// One classic from data/books/ into the library, queued, with its text and cover: the record, "here" if it already is, or null if
// the file couldn't be had or isn't what the app accepts. Throws if storage fails.
async function putClassic(id, now) {
  const r = await fetch(`data/books/${id}.json`); if (!r.ok) return null;
  const book = await r.json();
  if (!book || !VALID.texts(book.text) || !VALID.content(book.content)) return null;
  if (S.texts.has(id)) return "here";
  let cover = null;
  try { const c = await fetch(`data/books/${id}.jpg`); if (c.ok && /^image\//.test(c.headers.get("content-type") || "")) cover = await c.blob(); } catch {}
  const rec = { ...book.text, status: "queued", hasContent: true, pos: 0, total: book.content.length, createdAt: now, updatedAt: now };
  await idbTx(cover ? ["content", "texts", "covers"] : ["content", "texts"], (st) => { st("content").put(book.content, id); st("texts").put(rec, id); if (cover) st("covers").put(cover, id); });
  S.texts.set(id, rec); if (cover) S.covers.set(id, cover);
  return rec;
}
async function addClassics(force) {
  if (classicsBusy || !idb || S.mode !== "ready" || (navigator.webdriver && !force)) return [];
  classicsBusy = true;
  const added = [], t0 = Date.now();
  try {
    let done; try { done = new Set(JSON.parse(localStorage.getItem("mg-classics") || "[]")); } catch { done = new Set(); }
    const mark = (id) => { done.add(id); try { localStorage.setItem("mg-classics", JSON.stringify([...done])); } catch {} };
    for (const id of CLASSICS) {
      if (done.has(id)) continue;
      if (S.texts.has(id)) { mark(id); continue; } // already here, from a backup
      try {
        const rec = await putClassic(id, t0 - CLASSICS.indexOf(id)); // the earliest first on the shelf
        if (rec === "here") { mark(id); continue; }
        if (!rec) continue;
        mark(id); added.push(rec.title);
      } catch {} // offline, or the file is missing: next time
    }
  } finally { classicsBusy = false; }
  if (added.length) { render(); toast(added.length === 1 ? `“${added[0]}” was added to your library, on the Queued shelf.` : `${added.length} classics were added to your library, on the Queued shelf.`); }
  return added;
}

/* ---------- boot ---------- */
// Opening never fails silently: a step that throws, or storage that takes too long to open, says so on screen.
function bootProblem(msg) {
  const el = $("#main"); if (!el || S.screen === "reader") return;
  let b = $("#bootmsg");
  if (!b) { el.insertAdjacentHTML("afterbegin", `<div class="banner" id="bootmsg" role="alert"></div>`); b = $("#bootmsg"); }
  b.textContent = msg;
}
const bootErr = (e) => { if (S.mode !== "ready" || !$("#main").childElementCount || S.renderFailed) bootProblem(`Marginalia couldn't open your library: ${(e && (e.message || e.name)) || e}. Your books and notes are still on this device. Close every copy of the app, open it again, and send this message if it comes back.`); };
window.addEventListener("error", (e) => bootErr(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => bootErr(e.reason));
render();
const bootSlow = setTimeout(() => {
  if (S.mode === "pending") bootProblem("Still opening your library. This usually means Marginalia is open somewhere else, waiting for an update: the installed app and a Chrome tab count separately. Close every copy (swipe them away in recent apps, and close Marginalia tabs in Chrome), then open it again. Your books and notes are safe.");
}, 6000);
(async () => {
  try {
    idb = await idbOpen();
    S.texts = await idbAll("texts");
    S.notes = await idbAll("notes");
    S.covers = await idbAll("covers");
    S.terms = await idbAll("terms");
    S.drafts = await idbAll("drafts");
    S.compares = await idbAll("compares");
    await loadTrash().catch(() => {});
    S.mode = "ready";
  } catch (e) { idb = null; S.mode = "local"; S.openErr = e; }
  clearTimeout(bootSlow);
  try { render(); } catch (e) { S.renderFailed = true; bootErr(e); return; }
  try { openFromHash(); } catch {}
  if (S.openErr && S.openErr.name && !["InvalidStateError", "SecurityError", "UnknownError"].includes(S.openErr.name)) bootProblem(`Storage didn't open (${S.openErr.name}: ${S.openErr.message}). Close every copy of the app and open it again; your books and notes are still on this device.`);
  addClassics().catch(() => {});
  try { if (navigator.storage && navigator.storage.persist) S.persisted = await navigator.storage.persist(); } catch {}
})();
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
}
