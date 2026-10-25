// Marginalia: navigation and the back button, and the sheets (forms) used across the app. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* ---------- navigation: every step forward adds a history entry, so the phone's back button steps back through the app ---------- */
const NAV = { stack: [{ screen: "library" }], overlay: false };
const depth = () => NAV.stack.length - 1 + (NAV.overlay ? 1 : 0);
try { history.replaceState({ mg: 0 }, ""); history.scrollRestoration = "manual"; } catch {} // the app restores scroll itself; the browser's restore would fight it
let popWaiter = null;
// Consume one history entry for a step the app has already taken itself (an on-screen back button, Cancel, Save).
function histBack() {
  return new Promise((res) => {
    const done = () => { if (popWaiter === done) popWaiter = null; res(); };
    popWaiter = done; history.back(); setTimeout(done, 700);
  });
}
function showView(view, fresh) {
  if (view.screen === "reader") { openReader(view.textId, view.at, view); return; }
  if (S.screen === "reader") { savePos(true); resetReader(); }
  S.screen = view.screen;
  if (view.screen === "recommendations") { S.recBook = view.recBook || null; if (fresh) S.recAll = false; }
  if (view.screen === "paths") S.pathFocus = view.path || null;
  if (view.textId) S.textId = view.textId;
  if (view.screen === "tag") S.tag = view.tag || "";
  if (view.draftId) S.draftId = view.draftId;
  if (view.cmpId) { if (fresh && view.cmpId !== S.cmpId) S.cmpGaps = false; S.cmpId = view.cmpId; }
  let rerun = false;
  if (view.screen === "concord" && typeof view.q === "string" && fresh) { rerun = view.q !== CONC.q || !CONC.results.length; CONC.q = view.q; }
  if (view.gs) { S.gOpen = new Set(view.gs.gOpen); S.gq = view.gs.gq; S.gArea = view.gs.gArea; } // which glossary terms were open, so Back returns to them
  if (view.focus) S.bOpen.add(view.focus);
  if (view.screen === "reference" && view.rk) S.rk = view.rk;
  if (fresh && view.screen === "text") { S.sec = "all"; S.kind = "all"; S.tq = ""; }
  render();
  window.scrollTo(0, fresh ? 0 : view.y || 0);
  if (fresh && view.focus) {
    const el = document.querySelector(`[data-branch-id="${CSS.escape(view.focus)}"]`);
    const sec = el && view.sec && [...el.querySelectorAll("section[data-bsec]")].find((x) => x.dataset.bsec === view.sec);
    if (sec) { sec.scrollIntoView({ block: "start" }); sec.classList.add("flash"); setTimeout(() => sec.classList.remove("flash"), 2400); }
    else if (el) el.scrollIntoView({ block: "start" });
  }
  if (fresh && view.path && !document.querySelector(".syllabus")) { const el = document.querySelector(`section.path[data-path-id="${CSS.escape(view.path)}"]`); if (el) el.scrollIntoView({ block: "start" }); }
  if (fresh && view.era) { const el = document.querySelector(`section.tl-era[data-era="${CSS.escape(view.era)}"]`); if (el) el.scrollIntoView({ block: "start" }); }
  if (fresh && view.scrollTo) { const el = document.querySelector(`[data-term-id="${CSS.escape(view.scrollTo)}"]`); if (el) el.scrollIntoView({ block: "start" }); }
  if (rerun) runConcord();
  if (fresh && view.note) { const el = document.querySelector(`[data-nid="${CSS.escape(view.note)}"]`); if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 2400); } }
}
function go(view) {
  const top = NAV.stack[NAV.stack.length - 1];
  top.y = window.scrollY;
  if (S.screen === "reader" && R.blocks && top.screen === "reader") { top.spot = currentSpot(); top.at = top.spot.i; top.resume = true; top.flash = false; }
  if (S.screen === "glossary") top.gs = { gOpen: [...S.gOpen], gq: S.gq, gArea: S.gArea };
  NAV.stack.push(view);
  try { history.pushState({ mg: depth() }, ""); } catch {}
  showView(view, true);
}
function stepBack() {
  if (NAV.overlay) { $("#sheetroot").innerHTML = ""; NAV.overlay = false; return true; }
  if (NAV.stack.length > 1) { NAV.stack.pop(); showView(NAV.stack[NAV.stack.length - 1], false); return true; }
  return false;
}
async function back() { if (stepBack()) await histBack(); }
window.addEventListener("popstate", (e) => {
  if (popWaiter) { popWaiter(); return; }
  if ($("#sheetroot form[data-busy]")) { try { history.pushState({ mg: depth() }, ""); } catch {} return; } // don't abandon a save in progress
  const target = e.state && typeof e.state.mg === "number" ? e.state.mg : 0;
  for (let guard = 0; depth() > target && guard < 20; guard++) if (!stepBack()) break;
});
function openOverlay() {
  if (NAV.overlay) return;
  NAV.overlay = true;
  try { history.pushState({ mg: depth() }, ""); } catch {}
}
async function closeOverlay() { if (NAV.overlay) await back(); else $("#sheetroot").innerHTML = ""; }

/* ---------- sheets ---------- */
function openSheet(html, onSubmit, onOpen) {
  const root = $("#sheetroot");
  openOverlay();
  root.innerHTML = `<div class="veil"><form class="sheet" novalidate>${html}<div class="err" id="err"></div>
    <div class="formacts"><button type="button" class="btn" id="cancel">Cancel</button><button class="btn primary" type="submit">Save</button></div></form></div>`;
  const form = $("form", root);
  $("#cancel", root).onclick = () => closeOverlay();
  $(".veil", root).addEventListener("click", (e) => { if (e.target.classList.contains("veil") && !form.dataset.busy) closeOverlay(); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button[type=submit]", form); btn.disabled = true; form.dataset.busy = "1";
    try {
      const out = await onSubmit(new FormData(form));
      if (typeof out === "string") { $("#err", root).textContent = out; btn.disabled = false; delete form.dataset.busy; return; }
      delete form.dataset.busy;
      await closeOverlay();
      if (typeof out === "function") out(); // e.g. open the text you just added
    }
    catch (err) { $("#err", root).textContent = err instanceof UErr ? err.message : failMsg(err); btn.disabled = false; delete form.dataset.busy; }
  });
  if (onOpen) onOpen($(".veil", root)); // listeners added here are dropped with the sheet
  const first = $("input:not([type=file]), textarea, select", form); if (first && !onOpen) first.focus();
}
function openPanel(html, onPick) {
  const root = $("#sheetroot");
  openOverlay();
  root.innerHTML = `<div class="veil"><div class="sheet" role="dialog" aria-modal="true">${html}<div class="formacts"><button type="button" class="btn" id="pclose">Close</button></div></div></div>`;
  $(".veil", root).addEventListener("click", async (e) => {
    if (e.target.classList.contains("veil") || e.target.id === "pclose") { closeOverlay(); return; }
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.keep) { onPick(b); return; }
    await closeOverlay(); onPick(b);
  });
}
document.addEventListener("keydown", (e) => {
  if (isPaged() && R.blocks && !$("#sheetroot").innerHTML && !(e.target && e.target.matches && e.target.matches("input, textarea, select"))) {
    const dir = { ArrowRight: 1, PageDown: 1, " ": 1, ArrowLeft: -1, PageUp: -1 }[e.key];
    if (dir && !e.altKey && !e.ctrlKey && !e.metaKey) { e.preventDefault(); turnPage(e.shiftKey && e.key === " " ? -1 : dir); return; }
  }
  if (e.key === "Escape" && $("#sheetroot").innerHTML && !$("#sheetroot form[data-busy]")) closeOverlay();
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".mnote[data-note]")) { e.preventDefault(); noteSheet(e.target.dataset.note); }
  if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("#book [data-fn]")) { e.preventDefault(); const at = e.target.closest("[data-i]"); notePanel(at ? +at.dataset.i : currentBlock(), +e.target.dataset.fn); }
});

const fileField = () => `<div class="field">
    <label for="f-file">Load the book</label>
    <div class="drop" id="f-drop">
      <input id="f-file" type="file">
      <span class="drop-main" id="f-name">Tap to choose a file</span>
      <span class="drop-sub">PDF, EPUB, Word (.docx), .txt or .md. On a computer you can also drag the file here.</span>
    </div>
    <p class="hint" id="f-prog">The text is extracted and stored on this device only. Scanned PDFs need OCR first.</p>
    <label class="chkrow" id="f-keepwrap" hidden><input type="checkbox" name="keeppdf" id="f-keep" checked> <span id="f-keeplab">Keep the PDF on this device, to see its printed pages</span></label>
    <button type="button" class="linkbtn" id="f-pastebtn">Or paste the text instead</button>
    <button type="button" class="linkbtn" id="f-wsbtn">Or find a public-domain text on Wikisource</button>
    <div class="pastebox wsbox" id="f-wsbox" hidden>
      <div class="wsrow"><select id="f-wslang" aria-label="Wikisource in">${Object.entries(WS_LANGS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>
        <input id="f-wsq" type="search" placeholder="Title or author" aria-label="Search Wikisource" autocomplete="off"><button type="button" class="btn" id="f-wsgo">Search</button></div>
      <div id="f-wsres" class="wsres"></div>
      <p class="hint">Wikisource's texts are public domain or freely licensed (check a page's license for translations made there). The whole work is fetched once and kept on this device, so it reads offline like any other book.</p>
    </div>
    <div class="pastebox" id="f-pastebox" hidden>
      <textarea id="f-paste" class="verbatim" rows="6" placeholder="Paste the text here. Leave a blank line between paragraphs."></textarea>
      <button type="button" class="btn" id="f-pasteuse">Use this text</button>
    </div>
  </div>`;
function wireFile(root, onParsed) {
  const inp = $("#f-file", root), prog = $("#f-prog", root), btn = $("button[type=submit]", root), name = $("#f-name", root), drop = $("#f-drop", root);
  const say = (m, bad) => { prog.textContent = m; prog.classList.toggle("bad", !!bad); };
  let busy = false;
  const run = async (f) => {
    if (busy) return; busy = true;
    name.textContent = f.name || "Chosen file";
    btn.disabled = true; say("Reading the file…");
    try {
      const r = await parseFile(f, (m) => say(m)); onParsed(r); say(summary(r));
      const kw = $("#f-keepwrap", root); if (kw) { kw.hidden = r.kind !== "PDF"; $("#f-keeplab", root).textContent = `Keep the PDF on this device (${mb(f.size)}), to see its printed pages. Backups don't include it.`; }
    }
    catch (e) { say(e instanceof UErr ? e.message : `Couldn't read this file (${(e && e.message) || "unknown error"}).`, true); onParsed(null); }
    btn.disabled = false; busy = false;
  };
  inp.addEventListener("change", () => { const f = inp.files && inp.files[0]; if (f) run(f); });
  inp.addEventListener("cancel", () => say("No file was chosen."));
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.add("over")));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove("over")));
  $("#f-pastebtn", root).addEventListener("click", () => {
    const box = $("#f-pastebox", root); box.hidden = !box.hidden;
    if (!box.hidden) $("#f-paste", root).focus();
  });
  $("#f-pasteuse", root).addEventListener("click", () => {
    const txt = $("#f-paste", root).value;
    if (txt.trim().length < 20) { say("Paste some text into the box first.", true); return; }
    run(new File([txt], "Pasted text.txt", { type: "text/plain" }));
  });
  // Wikisource: search, then fetch the chosen work (its chapters too) as one HTML file, read like any other
  const wsBox = $("#f-wsbox", root), wsRes = $("#f-wsres", root), wsQ = $("#f-wsq", root), wsLang = $("#f-wslang", root);
  const wsFind = async () => {
    const q = wsQ.value.trim(); if (!q) { wsQ.focus(); return; }
    if (navigator.onLine === false) { wsRes.innerHTML = `<p class="hint">You're offline. Wikisource needs a connection.</p>`; return; }
    wsRes.innerHTML = `<p class="hint">Searching…</p>`;
    try {
      const hits = await wsSearch(wsLang.value, q);
      wsRes.innerHTML = hits.length ? hits.map((h) => `<button type="button" class="wshit" data-wspage="${esc(h.title)}"><b>${esc(h.title)}</b><span>${esc(h.snippet)}</span></button>`).join("") : `<p class="hint">Nothing on Wikisource matches “${esc(q)}”. Try the title alone, or another language.</p>`;
    } catch { wsRes.innerHTML = `<p class="hint">Couldn't reach Wikisource just now.</p>`; }
  };
  $("#f-wsbtn", root).addEventListener("click", () => { wsBox.hidden = !wsBox.hidden; if (!wsBox.hidden) wsQ.focus(); });
  $("#f-wsgo", root).addEventListener("click", wsFind);
  wsQ.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); wsFind(); } });
  wsRes.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-wspage]"); if (!b || busy) return;
    const lang = wsLang.value, page = b.dataset.wspage;
    wsRes.querySelectorAll(".wshit").forEach((x) => x.classList.toggle("on", x === b));
    name.textContent = `${page} (Wikisource)`; btn.disabled = true;
    try { const file = await wsFile(lang, page, (m) => say(m)); btn.disabled = false; run(file); }
    catch (err) { btn.disabled = false; say(err instanceof UErr ? err.message : "Couldn't fetch that work from Wikisource just now. Try again.", true); }
  });
  root.wsStart = (lang, q) => { wsBox.hidden = false; if (WS_LANGS[lang]) wsLang.value = lang; wsQ.value = q || ""; if (q) wsFind(); };
}
