// Marginalia: Today's question on the home screen, the Daily questions screen, and your answers to them. One of the app's scripts, loaded in order by index.html (see CLAUDE.md).
/* One question a day from DAILY_QUESTIONS (data/branches.js), in turn by the date, so every device shows the same one. A question you
   have seen on the home screen is kept in the "daily" store under its id, so you can find it again whether or not you did anything
   with it: { q, who, text, xr, book, path (a copy of the question as you saw it, so a later change to the list leaves your record
   readable), first and seen (local calendar days, "2026-11-23"), kept (when you chose Keep for later), answer: { at, day, x },
   followups: [{ id, at, x }] (Answer again, dated, as a note's follow-ups are), createdAt, updatedAt }. Being seen doesn't change
   updatedAt; an answer, a follow-up or Keep does. Backed up and restored; restoring joins both copies' days and follow-ups. */
const DQ_SEEN_MAX = 400, DQ_TEXT_MAX = 20000;
const dqDayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dqDayDate = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const dqDayLabel = (k) => (k === dqDayKey() ? "today" : dqDayDate(k).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: dqDayDate(k).getFullYear() === new Date().getFullYear() ? undefined : "numeric" }));
const dqDef = (id) => (typeof DAILY_QUESTIONS === "undefined" ? [] : DAILY_QUESTIONS).find((x) => x.id === id) || null;
function dqToday(d = new Date()) {
  const list = typeof DAILY_QUESTIONS === "undefined" ? [] : DAILY_QUESTIONS;
  return list.length ? list[dayNumber(d) % list.length] : null;
}
// The question as shown: the list's current wording (so a correction reaches the screen), with your record; your record's copy of
// the question only when the list no longer has it.
function dqView(id) {
  const r = S.daily.get(id), d = dqDef(id); if (!r && !d) return null;
  const base = r || { seen: [], followups: [] };
  return { id, ...base, ...(d ? DQ_SNAP(d) : {}), def: d, rec: r || null };
}
const DQ_SNAP = (d) => ({ q: d.q, who: d.who, text: d.text, xr: d.xr, book: d.book, ...(d.path ? { path: d.path } : {}) });
// Today's question has been seen: recorded once a day, after drawing (a save redraws the screen, so not while it is drawn).
let DQ_MARKING = "";
function dqMarkSeen(d) {
  if (!d) return;
  const day = dqDayKey(), r = S.daily.get(d.id);
  if ((r && (r.seen || []).includes(day)) || DQ_MARKING === d.id + day) return;
  DQ_MARKING = d.id + day;
  setTimeout(() => {
    const cur = S.daily.get(d.id), now = Date.now();
    if (cur && (cur.seen || []).includes(day)) return;
    const rec = cur ? { ...cur, seen: [...(cur.seen || []), day].slice(-DQ_SEEN_MAX) } : { ...DQ_SNAP(d), first: day, seen: [day], followups: [], createdAt: now, updatedAt: now };
    put("daily", d.id, rec).catch(() => {}); // seen again tomorrow if it couldn't be saved
  }, 0);
}
// A question's state in one line: unanswered, kept, or answered (with its follow-ups).
function dqState(v) {
  if (v.answer) { const n = (v.followups || []).length; return `Answered ${dqDayLabel(v.answer.day)}${n ? `, ${n} later answer${n === 1 ? "" : "s"}` : ""}`; }
  return v.kept ? "Kept for later" : "Unanswered";
}
const dqAnswers = (v) => [...(v.answer ? [{ at: v.answer.at, x: v.answer.x, first: true }] : []), ...(v.followups || [])];
function dqAnswersHTML(v) {
  return dqAnswers(v).map((a) => `<p class="fu"><span class="fud">${a.first ? "Your answer" : "Answered again"}, ${esc(fmtDate(a.at))}</span>${withTags(esc(a.x))}</p>`).join("");
}
// The home screen's card, under Continue reading.
function dqCardHTML() {
  const d = dqToday(); if (!d) return "";
  dqMarkSeen(d);
  const v = dqView(d.id), today = dqDayKey(), all = dqAnswers(v), last = all[all.length - 1];
  const editing = last && dqDayKey(new Date(last.at)) === today;
  return `<section class="dqcard" data-dqcard="${esc(d.id)}">
    <div class="dq-l">Today's question</div>
    <p class="dq-q">${esc(v.q)}</p>
    <details class="dq-prev dq-passage"><summary>The passage</summary><p class="dq-who">${esc(v.who)}</p><p class="dq-text">${passageLinks(esc(v.text), v.xr)}</p></details>
    ${all.length ? `<details class="dq-prev"><summary>${editing ? "What you wrote today" : `Your earlier answer${all.length > 1 ? "s" : ""}`}</summary>${dqAnswersHTML(v)}</details>` : ""}
    <div class="noteacts dq-acts">
      <button class="btn primary" data-dqwrite="${esc(d.id)}">${editing ? "Edit today's answer" : all.length ? "Answer again" : "Write an answer"}</button>
      ${all.length ? "" : `<button class="btn" data-dqkeep="${esc(d.id)}" aria-pressed="${v.kept ? "true" : "false"}">${v.kept ? "Kept" : "Keep for later"}</button>`}
      <button class="linkbtn" data-dqopen="${esc(d.id)}">More about it</button>
    </div>
  </section>`;
}
// Keep for later, or take it back.
async function dqKeep(id) {
  const v = dqView(id); if (!v) return;
  const now = Date.now(), cur = S.daily.get(id), day = dqDayKey();
  const rec = cur ? { ...cur } : { ...DQ_SNAP(v.def), first: day, seen: [day], followups: [], createdAt: now };
  if (rec.kept) delete rec.kept; else rec.kept = now;
  rec.updatedAt = now;
  try { await put("daily", id, rec); toast(rec.kept ? "Kept. It waits in Open questions and in Study → Daily questions." : "No longer kept."); }
  catch (e) { toast(failMsg(e)); }
}
// Write an answer, or Answer again: the first answer, then each later one as a dated follow-up. A second visit the same day changes
// that day's words, so reopening resumes the same entry.
function dqWrite(id) {
  const v = dqView(id); if (!v) return;
  const today = dqDayKey(), fus = v.followups || [], lastFu = fus[fus.length - 1];
  const editFirst = v.answer && v.answer.day === today && !fus.length, editFu = lastFu && dqDayKey(new Date(lastFu.at)) === today;
  const again = v.answer && !editFirst;
  const cur = editFirst ? v.answer.x : editFu ? lastFu.x : "";
  const earlier = again ? dqAnswers(v).filter((a) => !(editFu && a === lastFu)) : [];
  openSheet(`<h2>${again ? "Answer again" : "Your answer"}</h2>
    <p class="dq-q dq-sheetq">${esc(v.q)}</p><p class="dq-who">${esc(v.who)}</p>
    ${earlier.length ? `<details class="dq-prev"><summary>Your earlier answer${earlier.length > 1 ? "s" : ""} (folded, so you answer fresh)</summary>${earlier.map((a) => `<p class="fu"><span class="fud">${esc(fmtDate(a.at))}</span>${esc(a.x)}</p>`).join("")}</details>` : ""}
    <div class="field"><label for="dq-x">${again ? "What you think now" : "What you think"}</label><textarea id="dq-x" name="x" rows="6" maxlength="${DQ_TEXT_MAX}">${esc(cur)}</textarea></div>`, async (f) => {
    const x = String(f.get("x") || "").trim(); if (!x) return "Write something first, or Cancel.";
    const now = Date.now(), base = S.daily.get(id), day = dqDayKey();
    const rec = base ? { ...base } : { ...DQ_SNAP(v.def), first: day, seen: [day], followups: [], createdAt: now };
    rec.followups = [...(rec.followups || [])];
    if (!rec.answer) rec.answer = { at: now, day, x };
    else if (rec.answer.day === day && !rec.followups.length) rec.answer = { ...rec.answer, x };
    else { const l = rec.followups[rec.followups.length - 1]; if (l && dqDayKey(new Date(l.at)) === day) rec.followups[rec.followups.length - 1] = { ...l, x }; else rec.followups.push({ id: gid(), at: now, x }); }
    delete rec.kept; // answered: it leaves Open questions
    rec.updatedAt = now;
    await put("daily", id, rec);
    return () => dqPanel(id); // both answers, side by side
  });
}
// One question's entry: the question, its passage and source, your answers, and what to look at on a second attempt.
function dqPanel(id) {
  const v = dqView(id); if (!v) return toast("That question isn't in the list any more.");
  const d = v.def, all = dqAnswers(v);
  const days = v.rec ? `First shown ${dqDayLabel(v.rec.first)}${(v.rec.seen || []).length > 1 ? `, shown ${v.rec.seen.length} days in all` : ""}` : "Not yet shown on your home screen";
  openPanel(`<div class="dqentry"><div class="dq-l">Daily question</div>
    <h2 class="dq-q">${esc(v.q)}</h2><p class="dq-who">${esc(v.who)}</p>
    <p class="dq-text">${passageLinks(esc(v.text), v.xr)}</p>
    ${d && d.frame ? `<p class="dq-frame"><span class="ck">Through scholarship</span> ${esc(d.frame.says)} <a href="${esc(d.frame.src)}" target="_blank" rel="noopener" class="tsrc">${esc(d.frame.srcName)}</a></p>` : ""}
    <p class="hint">${esc(days)} · ${esc(dqState(v))}</p>
    ${all.length ? `<div class="later">${dqAnswersHTML(v)}</div>` : ""}
    ${all.length && d && d.again ? `<p class="dq-again"><span class="ck">On a second attempt</span> ${esc(d.again)}</p>` : ""}
    <div class="menu">
      <button class="menuitem" data-dqwrite="${esc(id)}">${all.length ? "Answer again" : "Write an answer"}</button>
      ${all.length ? "" : `<button class="menuitem" data-dqkeep="${esc(id)}">${v.kept ? "Don't keep it" : "Keep for later"}</button>`}
      ${v.path && typeof PATHS !== "undefined" && PATHS.some((p) => p.id === v.path) ? `<button class="menuitem" data-path="${esc(v.path)}">Read it in a path: ${esc(PATHS.find((p) => p.id === v.path).n)}</button>` : ""}
    </div></div>`, (b) => { // the panel has closed by now
    if (b.dataset.passage) return openPassage(b.dataset.passage, b.dataset.passageAt);
    if (b.dataset.dqwrite) return dqWrite(id);
    if (b.dataset.dqkeep) return dqKeep(id);
    if (b.dataset.path) return go({ screen: "paths", path: b.dataset.path });
  });
}
// Study → Daily questions: every question you have been shown, latest first, each marked unanswered, kept or answered.
function dailyView() {
  const today = dqToday(), ids = new Set([...S.daily.keys()]); if (today) ids.add(today.id);
  const last = (v) => (v.rec ? (v.rec.seen || []).slice(-1)[0] || v.rec.first : dqDayKey());
  const list = [...ids].map(dqView).filter(Boolean).sort((a, b) => last(b).localeCompare(last(a)));
  return `
    <header class="gl-head"><div><h1>Daily questions</h1><div class="sub">${list.length} shown, ${list.filter((v) => v.answer).length} answered</div></div></header>
    <p class="hint">One question a day appears on the home screen. Each one you have seen stays here, dated, whether or not you answered it.</p>
    <div class="gl-list">${list.map((v) => `<button class="thinkrow dqrow" data-dqopen="${esc(v.id)}"><b>${esc(v.q)}</b><span class="ty">${esc(v.rec ? `${dqDayLabel(v.rec.first)} · ${dqState(v)}` : "today · Unanswered")}</span><span class="dq-who">${esc(v.who)}</span></button>`).join("")}</div>`;
}
// Kept questions alongside Open questions.
function dqKeptHTML() {
  const kept = [...S.daily.keys()].map(dqView).filter((v) => v && v.kept && !v.answer);
  if (!kept.length) return "";
  return `<section class="group"><div class="label">Kept daily questions<span class="cnt">${kept.length}</span></div><div class="gl-list">${kept.map((v) => `<button class="thinkrow dqrow" data-dqopen="${esc(v.id)}"><b>${esc(v.q)}</b><span class="ty">Kept ${esc(dqDayLabel(dqDayKey(new Date(v.kept))))}</span></button>`).join("")}</div></section>`;
}
// Home search: the question, its thinker, work and topic, and your own words in answers and later answers.
function dqSearch(q) {
  const f = fold(q.trim()); if (!f) return [];
  const out = [];
  for (const id of S.daily.keys()) {
    const v = dqView(id), d = v.def;
    const mine = dqAnswers(v).find((a) => fold(a.x).includes(f));
    const hit = mine || [v.q, v.who, v.text, d ? d.topic : ""].some((x) => fold(x).includes(f));
    if (!hit) continue;
    let ex = "";
    if (mine) { const i = fold(mine.x).indexOf(f), a = Math.max(0, i - 50); ex = (a ? "…" : "") + mine.x.slice(a, i + f.length + 70) + (i + f.length + 70 < mine.x.length ? "…" : ""); }
    out.push({ v, ex, when: v.answer ? v.answer.day : (v.seen || []).slice(-1)[0] || v.first });
  }
  return out.sort((a, b) => (b.when || "").localeCompare(a.when || ""));
}
function dqSearchHTML(q) {
  const hits = dqSearch(q); if (!hits.length) return "";
  return `<section class="group"><div class="label">Daily questions<span class="cnt">${hits.length}</span></div><div class="termhits">${hits.map(({ v, ex }) => `<button class="termhit dqhit" data-dqopen="${esc(v.id)}"><b>${esc(v.q)}</b><span>${esc(`${dqDayLabel(v.first)} · ${dqState(v)}`)}</span>${ex ? `<span class="dq-ex">${esc(ex)}</span>` : ""}</button>`).join("")}</div></section>`;
}
// Restore: whichever copy wins keeps the other's days seen and its later answers; an answer only one copy has is kept.
function withDaily(base, other) {
  if (!other || base === other) return base;
  let out = withThoughts(base, other);
  const seen = [...new Set([...(out.seen || []), ...(other.seen || [])])].sort().slice(-DQ_SEEN_MAX);
  const first = [out.first, other.first].filter(Boolean).sort()[0];
  if (seen.join() !== (out.seen || []).join() || first !== out.first) out = { ...out, seen, first };
  if (!out.answer && other.answer) out = { ...out, answer: other.answer };
  else if (out.answer && other.answer && out.answer.at !== other.answer.at) {
    // two first answers, written on two devices: the earlier stays the answer and the later joins the later answers, so neither is lost
    const [a, b] = out.answer.at < other.answer.at ? [out.answer, other.answer] : [other.answer, out.answer];
    const fus = (out.followups || []).filter((f) => f.at !== b.at || f.x !== b.x);
    out = { ...out, answer: a, followups: [...fus, { id: "a" + b.at, at: b.at, x: b.x }].sort((x, y) => x.at - y.at) };
  }
  if (out.answer && out.kept) { out = { ...out }; delete out.kept; }
  return out;
}
const DQ_KEYS = new Set(["q", "who", "text", "xr", "book", "path", "first", "seen", "kept", "answer", "followups", "createdAt", "updatedAt"]);
const validDaily = (v) => isObj(v) && Object.keys(v).every((k) => DQ_KEYS.has(k)) && isS(v.q) && v.q.length > 0 && v.q.length <= 2000
  && ["who", "text", "xr", "book", "path"].every((k) => optStr(v[k]) && (v[k] || "").length <= 4000)
  && isS(v.first) && DAY_KEY.test(v.first) && Array.isArray(v.seen) && v.seen.length <= DQ_SEEN_MAX && v.seen.every((k) => isS(k) && DAY_KEY.test(k))
  && optNum(v.kept) && optNum(v.createdAt) && optNum(v.updatedAt)
  && (v.answer === undefined || (isObj(v.answer) && Number.isFinite(v.answer.at) && isS(v.answer.day) && DAY_KEY.test(v.answer.day) && isS(v.answer.x) && v.answer.x.length <= DQ_TEXT_MAX))
  && optArr(v.followups, (x) => isObj(x) && isS(x.id) && Number.isFinite(x.at) && isS(x.x) && x.x.length <= DQ_TEXT_MAX);
