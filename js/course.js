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
const courseBack = '<button class="btn ghost" id="back">← Back</button>';
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
  const fresh = previous ? ids.filter(i => !previous.order.includes(i)) : Array.from({length: 10}, (_, i) => 2*i + Math.floor(Math.random()*2));
  const order = courseShuffle(fresh).slice(0, 10);
  storeAttempt(m, { order, choices: order.map(i => courseShuffle(bank[i].options.map((_, n) => n))), answers: [] });
}
const courseButton = (act, title, disabled = false) => `<button class="btn" data-course-act="${act}" ${disabled ? "disabled" : ""}>${esc(title)}</button>`;
function courseCard() {
  const m = courseNext(), n = COURSE.slice(1).filter(coursePassed).length;
  return `<button class="refcard pathcard courselead" id="opencourse"><span class="rc-t">Learning</span><span class="rc-s">${m ? esc(m.period + " · " + m.title) : "Ancient period assignment"}</span><span class="rc-s">${m ? (courseHas(m,"learn") ? "Resume at the test" : "Begin the lesson") + " · " : ""}${n} of 11 Ancient modules passed</span></button>`;
}
function courseOverview() {
  const filterOptions = [...new Set(COURSE.flatMap(m => m.tags))].sort();
  return `<h1>Learning</h1><p>Begin with the branches of philosophy. Follow the questions through history, one argument at a time.</p>
    <label>Follow a branch or tradition <select id="course-filter"><option value="">All modules</option>${filterOptions.map(t => `<option ${t === courseFilter ? "selected" : ""}>${esc(t)}</option>`).join("")}</select></label>
    ${COURSE_PERIODS.map(period => {
      const all = COURSE.filter(m => m.period === period);
      const rows = all.filter(m => !courseFilter || m.tags.includes(courseFilter)).map(m => {
        const open = courseAvailable(m), previous = COURSE[COURSE.indexOf(m)-1];
        const status = coursePassed(m) ? "Test passed" : open ? (courseHas(m,"learn") ? "Continue to the test" : "Begin lesson") : "🔒 Pass " + previous.title;
        return `<button class="course-row" data-course-module="${m.id}" ${open ? "" : "disabled"}><strong>${esc(m.title)}</strong><span>${esc(status)}</span><small>${esc(m.tags.join(" · "))}</small></button>`;
      }).join("");
      return `<section><h2>${period}</h2><p>${all.length ? all.filter(coursePassed).length + " of " + all.length + " passed" : "Planned after the Ancient pilot review"}</p>${rows || (all.length ? "<p>No modules match this filter.</p>" : "")}${period === "Ancient" ? courseButton("assignment",courseNext() ? "🔒 Assignment · Pass every Ancient test" : "Open Ancient assignment",!!courseNext()) : ""}</section>`;
    }).join("")}
    <section><h2>Optional research track</h2><p>After the course, develop an annotated bibliography, referee report and research paper.</p>${LEARNING.slice(-4).map(l => `<button class="course-row" data-lesson="${l.id}">${esc(l.title)}</button>`).join("")}</section>
    <details><summary>Previous learning portfolio</summary><p>Revisit the earlier exercises and your saved responses.</p><button class="btn" id="openlearning">Open portfolio</button></details>`;
}
function courseLesson(m, evidence) {
  const target = COURSE_BANK[m.id][evidence]?.target;
  return m.sections.map(([title,...ps],i) => `<section><h2>${esc(title)}</h2>${ps.map(p => {
    const at = target ? p.indexOf(target) : -1;
    return "<p>" + (at < 0 ? esc(p) : esc(p.slice(0,at)) + '<mark id="course-evidence" tabindex="-1">' + esc(target) + "</mark>" + esc(p.slice(at+target.length))) + "</p>";
  }).join("")}<footer>Sources · ${m.refs[i].map(([name,url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>`).join(" · ")}</footer></section>`).join("") + courseButton("learn","Finish lesson and continue");
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
    const step = courseHas(m,"learn") ? (v.step || "learn") : "learn";
    const next = COURSE[COURSE.indexOf(m)+1];
    const read = `<h2>Optional primary passage</h2><p>${esc(m.read)}</p>${courseButton("read",m.citation)} ${courseButton("test","Continue to test")}`;
    body = `<p>${esc(m.period)} · ${esc(m.tags.join(" · "))}</p><h1>${esc(m.title)}</h1><nav aria-label="Module steps">${["learn","passage","test"].map((s,i) => `<button class="btn" data-course-step="${s}" ${s===step ? 'aria-current="step"' : ""} ${i && !courseHas(m,"learn") ? "disabled" : ""}>${["1 Learn","2 Read (optional)","3 Test"][i]}</button>`).join("")}</nav>
      ${step === "test" ? courseTest(m) : step === "passage" ? read : courseLesson(m,v.evidence)}
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
    if (act === "copy" && d) return copyText([assignmentPrompt,assignmentRubric,"Student submission",draft].join("\n\n"));
    if (act === "grade" && d) return critiqueSheet(assignmentID);
    if (act === "write") return openSheet(`<h2>Ancient assignment</h2><p>${assignmentPrompt}</p><label>Your argument<textarea name="answer" rows="12">${esc(draft)}</textarea></label>`,async fd => {
      const x = String(fd.get("answer")).trim(); if (!x) return "Enter your argument before saving.";
      const now = Date.now(), prev = S.drafts.get(assignmentID);
      await put("drafts",assignmentID,{...prev,title:"Ancient period assignment",items:[{t:"p",x}],createdAt:prev?.createdAt || now,updatedAt:now});
    });
  }
  if (!m || !courseAvailable(m)) return;
  if (act === "learn") { await put("mastery",courseKey(m,"learn"),{met:Date.now()}); return route(m,"passage"); }
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
    if (ans === 0) await put("mastery",courseKey(m,"q"+qid),{ans:Date.now()});
    a.answers.push(ans);
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
document.addEventListener("change",e => { if (e.target.id === "course-filter") {courseFilter=e.target.value; render(); document.getElementById("course-filter")?.focus();} });
