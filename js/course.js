// Chronological course. Completed work travels in the ordinary Mastery and Drafts backup.
const COURSE_PERIODS = ["Unit 0", "Ancient", "Medieval", "Renaissance", "Early modern", "19th century", "20th century and contemporary"];
const courseRoute = () => NAV.stack[NAV.stack.length - 1];
const courseKey = (m, item) => "course:" + m.id + ":" + item;
const courseHas = (m, item) => S.mastery.has(courseKey(m, item));
const coursePassed = m => courseHas(m, "pass");
const courseNext = () => COURSE.find(m => !coursePassed(m));
const courseAvailable = m => COURSE.indexOf(m) <= (courseNext() ? COURSE.indexOf(courseNext()) : COURSE.length);
const assignmentID = "course-writing-ancient";
const assignmentPrompt = "Choose one Ancient argument. Reconstruct it in 300–500 words. Identify the passage, state the conclusion and give the premises in your own words. Mark one assumption you supply. Present a serious objection and a reply that the author could defend.";
const assignmentRubric = "Assess textual accuracy, the link between premises and conclusion, the force of the objection, and the reply. Give 0–2 points for each, cite a sentence from the submission for each judgment, and suggest one specific revision. Flag any source you could not verify.";
const courseBack = '<button class="btn" id="back">← Back</button>';
let courseFilter = "";
const COURSE_ATTEMPTS = new Map();
function courseAttempt(m) {
  if (!COURSE_ATTEMPTS.has(m.id)) {
    try {
      const a = JSON.parse(localStorage.getItem("mg-course-v1:" + m.id));
      if (a && a.order?.length === 10 && new Set(a.order).size === 10 && a.order.every(i => Number.isInteger(i) && COURSE_BANK[m.id][i]) && Array.isArray(a.answers) && a.answers.length <= 10 && a.choices?.length === 10) COURSE_ATTEMPTS.set(m.id, a);
    } catch {}
  }
  return COURSE_ATTEMPTS.get(m.id);
}
function storeAttempt(m, a) {
  COURSE_ATTEMPTS.set(m.id, a);
  try { localStorage.setItem("mg-course-v1:" + m.id, JSON.stringify(a)); } catch {}
}
function courseShuffle(xs) {
  const result = xs.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function startCourseTest(m) {
  const bank = COURSE_BANK[m.id], previous = courseAttempt(m);
  const ids = bank.map((_, i) => i);
  // Each pair tests a different concept. Draw one question per concept, then its companion on a retake.
  // The lesson notes ask the second of each pair (notesQs), so a first test asks the other one.
  const fresh = previous ? ids.filter(i => !previous.order.includes(i)) : Array.from({length: 10}, (_, i) => 2*i);
  const order = courseShuffle(fresh).slice(0, 10);
  storeAttempt(m, { order, choices: order.map(i => courseShuffle(bank[i].options.map((_, n) => n))), answers: [] });
}
const courseButton = (act, title, disabled = false) => `<button class="btn" data-course-act="${act}" ${disabled ? "disabled" : ""}>${esc(title)}</button>`;
function courseCard() {
  const m = courseNext(), n = COURSE.slice(1).filter(coursePassed).length;
  return `<button class="refcard pathcard courselead" id="opencourse"><span class="rc-t">Learning</span><span class="rc-s">${m ? esc(m.period + " · " + m.title) : "Ancient period assignment"}</span><span class="rc-s">${m ? (courseHas(m,"learn") ? "Resume at the test" : "Begin the lesson") + " · " : ""}${n} of 11 Ancient modules passed</span></button>`;
}
// One module in the overview: a small brass mark (a padlock, a tick or an open dot) beside its title, its state and its tags.
const COURSE_ICONS = {
  locked: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  passed: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5" stroke-width="1.6"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
  open: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none"/></svg>'
};
const courseRow = (state, attr, title, status, tags = "") => `<button class="course-row mod is-${state}" ${attr} ${state === "locked" ? "disabled" : ""}><span class="cr-ic" aria-hidden="true">${COURSE_ICONS[state]}</span><strong>${esc(title)}</strong><span class="cr-st">${esc(status)}</span>${tags ? `<small>${esc(tags)}</small>` : ""}</button>`;
function courseOverview() {
  const filterOptions = [...new Set(COURSE.flatMap(m => m.tags))].sort();
  return `<h1>Learning</h1><p>Begin with the branches of philosophy. Follow the questions through history, one argument at a time.</p>
    <label>Follow a branch or tradition <select id="course-filter"><option value="">All modules</option>${filterOptions.map(t => `<option ${t === courseFilter ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
    ${COURSE_PERIODS.map(period => {
      const all = COURSE.filter(m => m.period === period);
      const rows = all.filter(m => !courseFilter || m.tags.includes(courseFilter)).map(m => {
        const open = courseAvailable(m), previous = COURSE[COURSE.indexOf(m)-1];
        const passed = coursePassed(m), state = passed ? "passed" : open ? "open" : "locked";
        const status = passed ? "Test passed" : open ? (courseHas(m,"learn") ? "Continue to the test" : "Begin the lesson") : "Opens after " + previous.title;
        return courseRow(state, `data-course-module="${m.id}"`, m.title, status, m.tags.join(" · "));
      }).join("");
      return `<section><h2>${period}</h2><p>${all.length ? all.filter(coursePassed).length + " of " + all.length + " passed" : "Planned after the Ancient pilot review"}</p>${rows || (all.length ? "<p>No modules match this filter.</p>" : "")}${period === "Ancient" ? courseRow(courseNext() ? "locked" : "open", 'data-course-act="assignment"', "Ancient period assignment", courseNext() ? "Opens after every Ancient test is passed" : "Write the assignment") : ""}</section>`;
    }).join("")}
    <section><h2>Optional research track</h2><p>After the course, develop an annotated bibliography, referee report and research paper.</p>${researchLessons.map(l => `<button class="course-row" data-lesson="${l.id}">${esc(l.title)}</button>`).join("")}</section>
    <details><summary>Previous learning portfolio</summary><p>Revisit the earlier exercises and your saved responses.</p><button class="btn" id="openlearning">Open portfolio</button></details>`;
}
function courseTools(m) {
  const terms = m.terms.map(id => GLOSSARY_BY_ID.get(id)).filter(Boolean);
  const logic = m.id === "foundations" ? '<button class="btn" data-truth="0">Truth table</button> <button class="btn" data-argquiz="valid">Validity practice</button> <button class="btn" data-argquiz="fallacy">Fallacy practice</button>' : "";
  if (!terms.length && !logic) return "";
  return `<details><summary>Glossary and practice</summary>${terms.map(t => `<button class="btn" data-term="${esc(t.id)}">${esc(t.t)}</button>`).join(" ")} ${logic}</details>`;
}
function courseLesson(m, evidence) {
  const target = COURSE_BANK[m.id][evidence]?.target;
  return m.sections.map(([title,...ps],i) => `<section><h2>${esc(title)}</h2>${ps.map(p => {
    const at = target ? p.indexOf(target) : -1;
    return "<p>" + (at < 0 ? esc(p) : esc(p.slice(0,at)) + '<mark id="course-evidence" tabindex="-1">' + esc(target) + "</mark>" + esc(p.slice(at+target.length))) + "</p>";
  }).join("")}<footer>Sources · ${m.refs[i].map(([name,url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`).join(" · ")}</footer></section>`).join("") + courseTools(m) + courseButton("notes", notesDraft(m) ? "Continue your lesson notes" : "Write lesson notes");
}
/* Lesson notes: an outline of the lesson, one section a heading, each with a prompt for your own words and the multiple-choice
   questions on that section (the second of each pair in COURSE_BANK). A right answer goes into the notes under its heading; a
   wrong one is set aside and the section named to reread. Every question answered right finishes the lesson. The notes are an
   ordinary draft (course-notes-<module>, in Drafts and in backups); the answers solved are mastery records ("course:<id>:n<q>"). */
const notesID = m => "course-notes-" + m.id;
const notesDraft = m => S.drafts.get(notesID(m));
const notesQs = m => COURSE_BANK[m.id].map((q, i) => [q, i]).filter(([, i]) => i % 2 === 1);
const notesSec = (m, q) => Number.isInteger(q.s) ? q.s : Math.max(0, m.sections.findIndex(s => q.target && s.slice(1).join(" ").includes(q.target)));
const NOTE_MARK = "✓ ", NOTES_WRONG = new Map(), NOTES_ORDER = new Map();
// your own words for each section, read back from the draft (a line of a right answer starts with NOTE_MARK)
function notesMine(m) {
  const out = m.sections.map(() => ""), d = notesDraft(m); if (!d) return out;
  let k = -1;
  for (const it of d.items) { if (it.t === "h") { k = m.sections.findIndex(s => s[0] === it.x); continue; } if (k >= 0 && it.t === "p" && !it.x.startsWith(NOTE_MARK) && !out[k]) out[k] = it.x; }
  return out;
}
// what's typed on screen wins over what was saved, so an answer tapped while a box still has the cursor keeps its words
function notesTyped(m) {
  const mine = notesMine(m);
  document.querySelectorAll("textarea[data-notes-sec]").forEach(t => { mine[+t.dataset.notesSec] = t.value; });
  return mine;
}
async function saveNotes(m, mine, quiet) {
  const items = [];
  m.sections.forEach(([title], k) => {
    items.push({ t: "h", x: title });
    if ((mine[k] || "").trim()) items.push({ t: "p", x: mine[k].trim() });
    for (const [q, i] of notesQs(m)) if (notesSec(m, q) === k && courseHas(m, "n" + i)) items.push({ t: "p", x: NOTE_MARK + q.q + " " + q.options[0] });
    clozes(m).forEach((c, j) => { if (c.s === k && courseHas(m, "c" + j)) items.push({ t: "p", x: NOTE_MARK + clozeText(m, c) }); });
  });
  const prev = notesDraft(m), now = Date.now(), rec = { ...prev, title: "Lesson notes · " + m.title, items, createdAt: prev?.createdAt || now, updatedAt: now };
  // words saved as you type are written without redrawing, so the box keeps the cursor and a tap on an answer still lands
  if (quiet) { S.drafts.set(notesID(m), rec); if (idb) await idbDo("drafts", (st) => st.put(rec, notesID(m))); return; }
  await put("drafts", notesID(m), rec);
}
/* Fill in the blanks: two of the lesson's own paragraphs (COURSE_CLOZE) with key words left out, typed back in. A blank is right
   when it matches the lesson's words, case, accents, punctuation and a leading "the" or "a" aside; it then shows as text. A paragraph
   with every blank right is recorded (mastery "course:<id>:c<k>") and added, whole, to the notes under its section. The words
   can be shown, shuffled, under each paragraph. Blanks right in a paragraph not yet finished are kept for this sitting only. */
const clozes = m => (typeof COURSE_CLOZE !== "undefined" && COURSE_CLOZE[m.id]) || [];
const clozeText = (m, c) => m.sections[c.s][c.p + 1];
const CLOZE_GOT = new Set(), CLOZE_BANK = new Map();
const foldAns = x => fold(String(x || "")).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim().replace(/^(the|a|an) /, "");
function clozeParts(m, c) {
  const para = clozeText(m, c), at = c.blanks.map((b, j) => [para.indexOf(b), j]).sort((a, b) => a[0] - b[0]), out = [];
  let pos = 0;
  for (const [i, j] of at) { out.push(para.slice(pos, i), j); pos = i + c.blanks[j].length; }
  out.push(para.slice(pos)); return out;
}
function clozeHTML(m, c, k) {
  const done = courseHas(m, "c" + k), key = m.id + ":" + k;
  if (!CLOZE_BANK.has(key)) CLOZE_BANK.set(key, courseShuffle(c.blanks));
  const parts = clozeParts(m, c).map(x => typeof x !== "number" ? esc(x)
    : done || CLOZE_GOT.has(key + ":" + x) ? `<b class="cz-ok">${esc(c.blanks[x])}</b>`
    : `<input class="cz" data-cz="${k}:${x}" aria-label="Blank ${x + 1} from “${esc(m.sections[c.s][0])}”" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="next" style="width:${Math.min(22, Math.max(6, c.blanks[x].length + 2))}ch">`).join("");
  return `<div class="czp${done ? " done" : ""}"><p class="cz-label">From “${esc(m.sections[c.s][0])}”</p><p class="cz-text">${parts}</p>
    ${done ? `<p class="nq-a">✓ <span>added to your notes</span></p>` : `<details class="cz-bank"><summary>Show the words to choose from</summary><p>${CLOZE_BANK.get(key).map(esc).join(" · ")}</p></details>`}</div>`;
}
const notesDone = m => notesQs(m).every(([, i]) => courseHas(m, "n" + i)) && clozes(m).every((_, k) => courseHas(m, "c" + k));
// a blank typed: right, it becomes text and the next blank takes the cursor; a finished paragraph is saved into the notes
async function clozeInput(t) {
  const m = COURSE.find(x => x.id === courseRoute().module); if (!m) return;
  const [k, j] = t.dataset.cz.split(":").map(Number), c = clozes(m)[k]; if (!c) return;
  t.classList.remove("cz-no"); t.removeAttribute("aria-invalid");
  if (foldAns(t.value) !== foldAns(c.blanks[j])) return;
  CLOZE_GOT.add(m.id + ":" + k + ":" + j);
  const box = t.closest(".czp"), b = document.createElement("b"); b.className = "cz-ok"; b.textContent = c.blanks[j]; t.replaceWith(b);
  const next = box && box.querySelector("input.cz"); if (next) { next.focus(); return; }
  const mine = notesTyped(m);
  await put("mastery", courseKey(m, "c" + k), { ans: Date.now() }); await saveNotes(m, mine);
  document.querySelectorAll("input.cz")[0]?.focus();
}
function notesQuestion(m, q, i) {
  if (courseHas(m, "n" + i)) return `<div class="nq done"><p>${esc(q.q)}</p><p class="nq-a">✓ ${esc(q.options[0])} <span>· added to your notes</span></p></div>`;
  const key = m.id + ":" + i, wrong = NOTES_WRONG.get(key) || new Set();
  if (!NOTES_ORDER.has(key)) NOTES_ORDER.set(key, courseShuffle(q.options.map((_, n) => n)));
  return `<div class="nq"><p>${esc(q.q)}</p>${NOTES_ORDER.get(key).map(n => `<button class="course-row" data-course-act="noteq" data-notes-q="${i}" data-notes-opt="${n}" ${wrong.has(n) ? "disabled" : ""}>${esc(q.options[n])}${wrong.has(n) ? " · not this one" : ""}</button>`).join("")}
    ${wrong.size ? `<p class="nq-hint" role="status">Not this one. Reread “${esc(m.sections[notesSec(m, q)][0])}” and try again.</p>` : ""}</div>`;
}
function courseNotes(m) {
  const mine = notesMine(m), qs = notesQs(m), cz = clozes(m);
  const solved = qs.filter(([, i]) => courseHas(m, "n" + i)).length + cz.filter((_, k) => courseHas(m, "c" + k)).length, all = qs.length + cz.length;
  return `<h2>Lesson notes</h2><p>The lesson's outline, a section at a time. Put each section's point in your own words, then answer its questions: each right answer is added to your notes under its heading. Then fill in the blanks in ${cz.length === 1 ? "a paragraph" : cz.length + " paragraphs"} from the lesson. Finish all ${all} to finish the lesson. Your notes are kept in Drafts.</p>
    ${m.sections.map(([title], k) => `<section><h3>${esc(title)}</h3>
      <label>In your own words: what does this section claim, and on what grounds?<textarea data-notes-sec="${k}" rows="4">${esc(mine[k])}</textarea></label>
      ${qs.filter(([q]) => notesSec(m, q) === k).map(([q, i]) => notesQuestion(m, q, i)).join("")}</section>`).join("")}
    ${cz.length ? `<section class="cloze"><h3>Fill in the blanks</h3><p>Type the lesson's word or phrase into each gap. A right answer turns into text; each finished paragraph is added to your notes.</p>${cz.map((c, k) => clozeHTML(m, c, k)).join("")}</section>` : ""}
    <p class="course-progress" role="status">${solved} of ${all} done</p>
    ${courseButton("learn", "Finish notes and continue", solved < all)} ${courseButton("lesson", "Back to the lesson")}`;
}
function courseTest(m) {
  const a = courseAttempt(m);
  if (!a) return "<h2>Test your understanding</h2><p>Ten questions. A score of eight passes the module.</p>" + courseButton("start","Start test");
  const answered = a.answers.length, score = a.answers.filter(x => x === 0).length;
  if (answered === 10 && a.done) return `<h2>${score} of 10 correct</h2><p>${score >= 8 ? "Test passed." : "Review the lesson and take a fresh set of questions."}</p>${courseButton("start","Retake with different questions")}`;
  const n = a.cursor ?? 0, qid = a.order[n], q = COURSE_BANK[m.id][qid], submitted = answered > n;
  return `<h2>Question ${n+1} of 10</h2><p>${esc(q.q)}</p>${a.choices[n].map(i => `<button class="course-row" data-course-answer="${i}" ${submitted ? "disabled" : ""}>${esc(q.options[i])}</button>`).join("")}
    ${submitted ? `<div role="status"><h3>${a.answers[n] === 0 ? "Correct" : "Review this answer"}</h3><p>${esc(q.e)}</p></div>${courseButton("evidence","Read the supporting sentence")}${courseButton("advance", n === 9 ? "See result" : "Continue test")}` : ""}`;
}
function courseAssignment() {
  const d = S.drafts.get(assignmentID);
  return `<h1>Ancient period assignment</h1><p>${assignmentPrompt}</p><p>${assignmentRubric}</p>${courseButton("write",d ? "Revise assignment" : "Write assignment")}
    ${d ? courseButton("copy","Copy for Claude") + courseButton("grade","Record grade and feedback") + critiqueListCourse(d) : ""}`;
}
function critiqueListCourse(d) {
  return (d.critiques || []).map(c => `<section><h2>Feedback · ${esc(c.by || "Reader")}</h2><p>${esc(c.x)}</p></section>`).join("");
}
function courseView() {
  const v = courseRoute(), m = COURSE.find(x => x.id === v.module);
  let body;
  if (v.assignment && !courseNext()) body = courseAssignment();
  else if (!m || !courseAvailable(m)) body = courseOverview();
  else {
    const step = courseHas(m,"learn") ? (v.step || "learn") : v.step === "notes" ? "notes" : "learn";
    const next = COURSE[COURSE.indexOf(m)+1];
    const read = `<h2>Optional primary passage</h2><p>${esc(m.read)}</p>${courseButton("read",m.citation)} ${courseButton("test","Continue to test")}`;
    body = `<p class="course-kicker">${esc(m.period)} · ${esc(m.tags.join(" · "))}</p><h1>${esc(m.title)}</h1><nav aria-label="Module steps">${["learn","passage","test"].map((s,i) => `<button class="btn" data-course-step="${s}" ${s===step || (s === "learn" && step === "notes") ? 'aria-current="step"' : ""} ${i && !courseHas(m,"learn") ? "disabled" : ""}>${["1 Learn","2 Read (optional)","3 Test"][i]}</button>`).join("")}</nav>
      ${step === "test" ? courseTest(m) : step === "passage" ? read : step === "notes" ? courseNotes(m) : courseLesson(m,v.evidence)}
      <div class="course-next">${courseButton("next",next ? "Next · "+next.title : "Ancient period assignment",!coursePassed(m))}</div>`;
  }
  return `<article class="course-page">${courseBack}${body}</article>`;
}
async function courseAction(b) {
  const v = courseRoute(), m = COURSE.find(x => x.id === v.module), act = b.dataset.courseAct;
  const route = (x,step) => go({screen:"course",module:x.id,step});
  if (b.id === "opencourse") return go({screen:"course"});
  if (b.dataset.courseModule) {
    const x = COURSE.find(x => x.id === b.dataset.courseModule);
    if (x && courseAvailable(x)) route(x, courseHas(x,"learn") && !coursePassed(x) ? "test" : "learn");
    return;
  }
  if (act === "assignment" && !courseNext()) return go({screen:"course",assignment:true});
  if (v.assignment && !courseNext()) {
    const d = S.drafts.get(assignmentID), draft = d?.items.map(i => i.x).join("\n\n") || "";
    if (act === "copy" && d) {
      const readings = COURSE.slice(1).map(m => m.title + " · " + m.citation + "\n" + m.sources.map(s => s[1]).join(" ")).join("\n");
      const copied = await copyText([assignmentPrompt,assignmentRubric,"Course readings",readings,"Student submission",draft].join("\n\n"));
      return toast(copied ? "Assignment and rubric copied for Claude." : "Clipboard unavailable. Select and copy your draft.");
    }
    if (act === "grade" && d) return critiqueSheet(assignmentID);
    if (act === "write") return openSheet(`<h2>Ancient assignment</h2><p>${assignmentPrompt}</p><label>Your argument<textarea name="answer" rows="12">${esc(draft)}</textarea></label>`,async fd => {
      const x = String(fd.get("answer")).trim(); if (!x) return "Enter your argument before saving.";
      const now = Date.now(), prev = S.drafts.get(assignmentID);
      await put("drafts",assignmentID,{...prev,title:"Ancient period assignment",items:[{t:"p",x}],createdAt:prev?.createdAt || now,updatedAt:now});
    });
  }
  if (!m || !courseAvailable(m)) return;
  if (act === "notes") return route(m,"notes");
  if (act === "lesson") { await saveNotes(m, notesTyped(m)); return route(m,"learn"); }
  if (act === "noteq") {
    const i = +b.dataset.notesQ, n = +b.dataset.notesOpt, q = COURSE_BANK[m.id][i], mine = notesTyped(m);
    if (!q || courseHas(m,"n"+i) || i % 2 !== 1) return;
    if (n === 0) { await put("mastery",courseKey(m,"n"+i),{ans:Date.now()}); await saveNotes(m, mine); return; }
    const key = m.id + ":" + i; NOTES_WRONG.set(key, new Set([...(NOTES_WRONG.get(key) || []), n]));
    if (notesDraft(m) || mine.some(x => x.trim())) await saveNotes(m, mine); else render();
    return;
  }
  if (act === "learn") {
    if (!notesDone(m)) return toast("Answer every question and fill every blank in your notes first.");
    await saveNotes(m, notesTyped(m)); await put("mastery",courseKey(m,"learn"),{met:Date.now()}); return route(m,"passage");
  }
  if (b.dataset.courseStep === "learn") return route(m,"learn");
  if (!courseHas(m,"learn")) return;
  if (b.dataset.courseStep) return route(m,b.dataset.courseStep);
  if (act === "test") return route(m,"test");
  if (act === "read") {
    if (!S.texts.has(m.book) && !await putClassic(m.book,Date.now(),!m.book.startsWith("course-"))) return toast("The passage could not be downloaded. Try again when connected.");
    const blocks = await loadContent(m.book), range = blocks && stepRange(blocks,[m.book+"-s"+m.sec]);
    const at = range && blocks.findIndex((b,i) => i>=range[0] && i<range[1] && plain(b.x).includes(m.anchor));
    if (at == null || at < 0) return toast("This edition does not contain the marked paragraph.");
    return go({screen:"reader",textId:m.book,at,flash:true});
  }
  if (act === "next" && coursePassed(m)) {
    const next = COURSE[COURSE.indexOf(m)+1];
    return next ? route(next,"learn") : go({screen:"course",assignment:true});
  }
  if (act === "start") { startCourseTest(m); return render(); }
  const a = courseAttempt(m); if (!a || a.done) return;
  const i = a.cursor ?? 0, qid = a.order[i];
  if (b.dataset.courseAnswer !== undefined && a.answers.length === i) {
    const ans = Number(b.dataset.courseAnswer);
    a.answers.push(ans);
    try {
      if (ans === 0 && !courseHas(m,"q"+qid)) await put("mastery",courseKey(m,"q"+qid),{ans:Date.now()});
    } catch (err) {
      a.answers.pop(); render(); throw err;
    }
  } else if (act === "evidence" && a.answers.length > i) {
    go({screen:"course",module:m.id,step:"learn",evidence:qid});
    const mark = document.getElementById("course-evidence"); mark?.focus(); mark?.scrollIntoView({block:"center"}); return;
  } else if (act === "advance" && a.answers.length > i) {
    if (i === 9) {
      if (a.answers.filter(x => x===0).length >= 8) await put("mastery",courseKey(m,"pass"),{ans:Date.now()});
      a.done = true;
    } else a.cursor = i+1;
  } else return;
  storeAttempt(m,a); render();
}
let notesTimer = 0;
document.addEventListener("input",e => { if (e.target.matches && e.target.matches("input.cz") && S.screen === "course") clozeInput(e.target).catch(err => toast(failMsg(err))); });
const clozeWrong = t => { if (t.matches && t.matches("input.cz") && t.isConnected && t.value.trim()) { t.classList.add("cz-no"); t.setAttribute("aria-invalid", "true"); } };
document.addEventListener("keydown",e => { if (e.key === "Enter" && e.target.matches && e.target.matches("input.cz")) { e.preventDefault(); clozeWrong(e.target); } });
document.addEventListener("input",e => {
  if (!(e.target.dataset && e.target.dataset.notesSec !== undefined && S.screen === "course")) return;
  clearTimeout(notesTimer);
  notesTimer = setTimeout(() => { const m = COURSE.find(x => x.id === courseRoute().module); if (m) saveNotes(m, notesTyped(m), true).catch(err => toast(failMsg(err))); }, 500);
});
document.addEventListener("change",e => {
  if (e.target.matches && e.target.matches("input.cz")) return clozeWrong(e.target);
  if (e.target.dataset && e.target.dataset.notesSec !== undefined && S.screen === "course") { clearTimeout(notesTimer); const m = COURSE.find(x => x.id === courseRoute().module); if (m) saveNotes(m, notesTyped(m), true).catch(err => toast(failMsg(err))); return; }
  if (e.target.id === "course-filter") {courseFilter=e.target.value; render(); document.getElementById("course-filter")?.focus();} });
