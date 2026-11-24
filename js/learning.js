// The main course. Each reading names one stable shelf section and a phrase inside its first assigned paragraph.
const LEARNING = [
  { id: "appearance", stage: "Asking a philosophical question", title: "Introduction to philosophy",
    idea: "A philosophical question can begin with something both people see. Two readers look at one polished table from different seats. They agree about where the light falls. They can still disagree about what it means to say the table itself has a colour. Philosophy begins here by examining what would count as a reason to believe either answer.",
    readings: [["russell-problems", 2, "Russell · Appearance and Reality", "let us concentrate attention on the table"]],
    task: "Read from the table example through Russell’s discussion of its colour. Describe what changes when you move seats. Give one reason to think the table stays the same, then identify what that reason assumes.",
    check: "Moving seats changes the patch of reflected light. That observation supports a claim about how the surface appears from a position. To reach a claim about the object, you need a further reason, such as the way appearances vary together predictably." },
  { id: "definition", stage: "Asking a philosophical question", title: "From an example to a definition",
    idea: "A definition gives a rule you can try on a case you have never seen. If someone defines fairness by pointing to an equal split, try a case where one person supplied all the materials. The new case reveals what the example left undecided.",
    readings: [["plato-socrates", 1, "Plato · Euthyphro, the prosecution", "Piety is doing as I am doing"]],
    task: "Read through Socrates’ request for the feature shared by pious acts. Explain why Euthyphro thinks prosecuting his father is relevant. Propose a definition of piety and test it on an act outside a courtroom.",
    check: "A reader should be able to apply your definition without already knowing which acts count as pious. If your test case breaks the rule, change the rule and try that case again." },
  { id: "inference", stage: "Asking a philosophical question", title: "Does the conclusion follow?",
    idea: "A premise is a claim offered as a reason. An argument is deductively valid when the premises cannot all be true while its conclusion is false. Suppose all fair decisions follow a rule. A coin toss follows a rule. Calling the toss fair on those grounds reverses the implication: even a biased rule is still a rule.",
    readings: [["james-pragmatism", 3, "James · Lecture II, the squirrel", "a camping party in the mountains"]],
    task: "Read the squirrel dispute and James’s two senses of going around. Build an argument for one answer with two premises and a conclusion. Change the meaning of going around in the conclusion and identify the step that fails.",
    check: "Keep the same meaning throughout the first argument. A person can pass through every compass direction around the tree while always facing the squirrel’s belly. Those descriptions can both be true." },
  { id: "habit", stage: "Explaining and testing arguments", title: "How does someone become just?",
    idea: "An analogy uses a familiar case to explain another. Its force depends on which features the cases share. A craft can teach someone to produce a particular result. An account of character also has to explain why the person chooses the act.",
    readings: [["aristotle-ethics", 3, "Aristotle · Nicomachean Ethics, Book II", "where we do things by nature"]],
    task: "Read Book II, chapters 1 and 4. Reconstruct the analogy between learning a craft and acquiring virtue. Give a case where two people do the same just act for different reasons.",
    check: "Use chapter 4 to explain what the agent must know, choose and do from a settled character. State exactly which part of that explanation the craft analogy supports." },
  { id: "time", stage: "Explaining and testing arguments", title: "How can we speak of the past?",
    idea: "A puzzle can arise when two ordinary claims seem incompatible. Yesterday has passed, yet you can describe yesterday’s conversation now. Augustine asks what exists when you remember it. One way to test his answer is to change the tense and try the case again.",
    readings: [["augustine-confessions", 11, "Augustine · Confessions, Book XI", "three times (as we learned"]],
    task: "Read Augustine’s account of the three presents. Use a song you know to distinguish remembering a note, attending to one, and expecting one. Explain how a single note can take all three roles.",
    check: "Give each role its own moment in your example. Then ask whether locating recollection in the present explains how a memory can be accurate about a vanished event." },
  { id: "induction", stage: "Explaining and testing arguments", title: "What licenses a prediction?",
    idea: "An inference can be reasonable even when its conclusion could turn out false. The harder question is what entitles us to make it. Hume’s bread example lets you locate the step between a record of past nourishment and an expectation about the next meal.",
    readings: [["hume-enquiry", 4, "Hume · Enquiry, section IV", "consistence of bread"]],
    task: "List what experience has shown and what the prediction adds. Try to justify the prediction by saying that past predictions succeeded. Identify the assumption that this justification needs.",
    check: "Previous successes are themselves past cases. Using them to predict the reliability of the next inference already assumes that the future will resemble the past in relevant respects. Distinguish that problem from the practical question of whether to eat the bread." },
  { id: "system", stage: "Reading philosophical systems", title: "Follow a proof across propositions",
    idea: "In a philosophical system, a sentence may borrow its force from an earlier proof. Spinoza’s claim about striving concerns everything. Before applying it to a person’s desire, trace the steps meant to establish that wider claim.",
    readings: [["spinoza-ethics", 3, "Spinoza · Ethics III, propositions 4–7", "Nothing can be destroyed, except by a cause external"]],
    task: "Read propositions 4–7 and their proofs. Diagram the reasons Spinoza gives for proposition 6. Mark where he appeals to Part I, then explain what proposition 7 adds.",
    check: "Distinguish the claim that destruction requires an external cause from the positive power by which a thing acts. A reconstruction must explain how the proof gets from one to the other. Test your reading on something without conscious intentions." },
  { id: "motive", stage: "Reading philosophical systems", title: "Separate an act from its motive",
    idea: "A thought experiment can hold what happens fixed while varying one feature. Kant’s shopkeeper gives an inexperienced customer the usual price. The question is what grounds the decision to charge it.",
    readings: [["kant-groundwork", 2, "Kant · Groundwork, first section", "a dealer should not over charge"]],
    task: "Write two explanations of the same sale, one from commercial prudence and one from duty. Compare Kant’s question about motive with Aristotle’s question about settled character. Cite a passage from each.",
    check: "Keep the customer’s price and the transaction identical. Explain what evidence would distinguish the motives. Identify one point where your comparison depends on a different use of a word such as virtue or duty." },
  { id: "liberty", stage: "Reading philosophical systems", title: "Find the limit of a principle",
    idea: "A political argument can protect a practice for several reasons. Mill begins one defence of open discussion from the fallibility of those who would silence an opinion. Test how far that particular reason reaches.",
    readings: [["mill-liberty", 3, "Mill · On Liberty, chapter II", "the opinion which it is attempted to suppress"]],
    task: "Reconstruct the fallibility argument. Give a case in which the people deciding whether to suppress an opinion are right about its falsity. Find Mill’s later treatment of false opinions and explain the further reason he gives for hearing them.",
    check: "Separate the risk of suppressing a truth from the risk that a true belief becomes a formula its defenders cannot explain. Specify which reason survives your example." },
  { id: "standpoint", stage: "Comparing methods and defending a thesis", title: "Read a concept in its historical setting",
    idea: "A concept drawn from lived experience can lose its explanatory force when detached from its setting. Du Bois introduces double-consciousness through the experience of the colour line in the United States. Attend to who is looking and whose judgment carries social authority.",
    readings: [["du-bois-souls", 2, "Du Bois · Of Our Spiritual Strivings", "In a wee wooden schoolhouse"]],
    task: "Read the schoolroom episode and the account of double-consciousness that follows it. Explain what the episode establishes. Give one reason a comparison with ordinary self-consciousness might obscure the point.",
    check: "Locate the exclusion in the episode and identify the unequal relation between the two perspectives. Show how that relation shapes the desire Du Bois describes in the following paragraph." },
  { id: "genealogy", stage: "Comparing methods and defending a thesis", title: "Distinguish origins from justification",
    idea: "A genealogy investigates the conditions under which a value was formed. Even if a proposed origin is correct, a further argument is needed to assess the value today. Read Nietzsche with both questions in view.",
    readings: [["nietzsche-genealogy", 3, "Nietzsche · Genealogy, first essay §10", "The revolt of the slaves in morals begins"]],
    task: "Trace the order of evaluation Nietzsche attributes to each outlook in §10. State one claim about origins and one evaluation of a way of living. What evidence would challenge each?",
    check: "Your two challenges should do different work. Historical counterevidence could undermine an origin story. A defence of the form of life it produced would require reasons about its value." },
  { id: "duration", stage: "Comparing methods and defending a thesis", title: "Reconstruct a difficult distinction",
    idea: "When a philosopher says our usual description distorts an experience, translate the claim into a case another reader can try. Bergson asks what changes when successive notes are heard as a melody and when they are represented as separate positions.",
    readings: [["bergson-time", 5, "Bergson · Time and Free Will, chapter II", "reversible relations of succession"]],
    task: "Hum a phrase, then draw one dot for each note. Identify what the diagram preserves and what it omits. Compare this with Augustine’s account of hearing a song. Formulate a disagreement precise enough that both passages bear on it.",
    check: "Distinguish a claim about the order of notes from a claim about how an earlier note qualifies the next. Allow the possibility that the authors answer different questions and support that reading if you adopt it." },
  { id: "capstone", stage: "Comparing methods and defending a thesis", title: "Defend and revise an independent thesis",
    idea: "Take responsibility for the inference between two readings. For instance, can an account of time that distinguishes memory, attention and expectation explain why a melody sounds like one phrase? Augustine and Bergson supply different resources for answering that question.",
    readings: [["augustine-confessions", 11, "Augustine · Confessions XI, the three presents", "three times (as we learned"], ["bergson-time", 5, "Bergson · Time and Free Will II, melody", "reversible relations of succession"]],
    task: "Use the time question or choose two earlier readings and a question of your own. Write a short essay with a thesis, a passage reference for each interpretation, and a reason to prefer your answer. Give the strongest objection in a paragraph of its own. Revise the thesis or defend its original scope.",
    check: "Could a reader locate both passages and reconstruct the step from each to your conclusion? Underline the sentence most vulnerable to the objection. State what you changed after considering it, or what evidence would make you change it." }
];

const learningDraft = (lesson) => "learning-" + lesson.id;
const learningAnswered = (lesson) => S.drafts.get(learningDraft(lesson))?.items.some((item) => item.t === "p" && item.x.trim());
const nextLesson = () => LEARNING.find((lesson) => !learningAnswered(lesson));
const learningCount = () => LEARNING.filter(learningAnswered).length;

function learningView() {
  const current = nextLesson();
  const count = learningCount();
  const lesson = LEARNING.find((l) => l.id === NAV.stack[NAV.stack.length - 1].lesson);
  const backBtn = '<button class="btn ghost backbtn" id="back">← Back</button>';
  if (!lesson) {
    const groups = [...new Set(LEARNING.map((l) => l.stage))];
    return backBtn + `<header class="gl-head"><div><h1>Learning</h1><p>A course in reading and writing philosophy. Begin with an ordinary question and finish by defending a thesis against an objection.</p><div class="sub">${count} of ${LEARNING.length} responses saved</div></div></header>
      ${current ? `<button class="btn primary" data-lesson="${current.id}">${count ? "Continue" : "Begin"} · ${esc(current.title)}</button>` : '<p>You have saved a response to every lesson. Reopen a lesson to revise its argument.</p>'}
      ${groups.map((g) => `<section class="group"><h2>${g}</h2><div class="gl-list">${LEARNING.filter((l) => l.stage === g).map((l) => `<button class="thinkrow" data-lesson="${l.id}"><b>${LEARNING.indexOf(l) + 1}. ${esc(l.title)}</b><span class="td">${learningAnswered(l) ? "Response saved" : l.readings.map((r) => esc(r[2].split(" · ")[0])).join(" and ")}</span></button>`).join("")}</div></section>`).join("")}`;
  }
  const id = learningDraft(lesson), draft = S.drafts.get(id), index = LEARNING.indexOf(lesson), next = LEARNING[index + 1];
  return backBtn + `<header class="gl-head"><div><div class="sub">Lesson ${index + 1} of ${LEARNING.length} · ${lesson.stage}</div><h1>${lesson.title}</h1></div></header>
    <section class="group"><p>${lesson.idea}</p>${lesson.readings.map(([slug, , label], i) => S.texts.has("classic-" + slug)
      ? `<button class="btn" data-learning-read="${i}">${esc(label)}</button>`
      : `<button class="btn" data-pathadd="classic-${slug}">Add reading · ${esc(label)}</button>`).join(" ")}</section>
    <section class="group"><h2>Your written exercise</h2><p>${lesson.task}</p><p class="hint">Make a first attempt, then return to the passage to check it. Your response is saved in Drafts.</p>
    ${draft ? `<button class="btn primary" data-draft="${id}">Open your response</button>` : '<button class="btn primary" id="learning-answer">Write your response</button>'}</section>
    <details class="group"><summary>Check your reasoning</summary><p>${lesson.check}</p></details>
    ${next ? `<button class="btn" data-lesson="${next.id}">Next · ${esc(next.title)}</button>` : '<button class="btn" id="openlearning">Course overview</button>'}`;
}

function activeLesson() {
  const view = NAV.stack[NAV.stack.length - 1];
  return view.screen === "learning" && LEARNING.find((l) => l.id === view.lesson);
}

async function readLearningPassage(i) {
  const reading = activeLesson()?.readings[i]; if (!reading) return;
  const [slug, section, , phrase] = reading, id = "classic-" + slug;
  const blocks = await loadContent(id); if (!blocks) return toast("The reading is unavailable on this device.");
  const range = stepRange(blocks, [id + "-s" + section]);
  const at = range ? blocks.findIndex((b, k) => k >= range[0] && k < range[1] && plain(b.x).includes(phrase)) : -1;
  if (at < 0) return readSection(id, id + "-s" + section);
  go({ screen: "reader", textId: id, at, flash: true });
}

function writeLearningResponse() {
  const lesson = activeLesson(); if (!lesson) return;
  const id = learningDraft(lesson);
  openSheet(`<h2>${lesson.title}</h2><p>${lesson.task}</p><div class="field"><label for="learning-text">Your response</label><textarea id="learning-text" name="answer" rows="8"></textarea></div>`, async (fd) => {
    const x = fd.get("answer").trim(); if (!x) return "Write a response before saving.";
    const previous = S.drafts.get(id), now = Date.now();
    await put("drafts", id, { ...previous, title: previous?.title || lesson.title, items: [...(previous?.items || []), { t: "p", x }], createdAt: previous?.createdAt || now, updatedAt: now });
  });
}
