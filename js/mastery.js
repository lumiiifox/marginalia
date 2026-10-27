// Marginalia: mastery, the collection you build by reading checked material. One of the app's scripts, loaded in order by index.html.
/* ---------- mastery ----------
   Only entries that passed an audit count (VERIFIED_TERMS, VERIFIED_THINKERS, every CONNECTION, every close-reading station), so a
   reward always rests on checked material. Each item climbs through stages:
     met       you opened it (a glossary entry, a thinker's card, a card that shows the connection)
     answered  you got it right: Quiz yourself (terms, thinkers' works), Guess the thinker, a step of Connect two thinkers
     used      it appears in your own notes (a term's name or your link to it, a thinker's name)
   A close-reading station has one stage, read: a note of yours on one of its passages (closeState).
   Met and answered are kept in the "mastery" store as { met, ans } (times), keyed "term:<id>", "thinker:<id>", "conn:<from>><to>";
   used and read are worked out from your notes each time, so deleting a note can take them back. An item you haven't met is within
   reach when something next to it is met (a related term, its thinker, the other end of a connection, the station before), and
   locked otherwise: its name shows once it is within reach. Earning a stage shows a toast and, on a phone, a short buzz. */
const MASTERY_STAGES = { term: ["met", "ans", "used"], thinker: ["met", "ans", "used"], conn: ["met", "ans"], station: ["read"] };
const STAGE_NAMES = { met: "Met", ans: "Answered", used: "Used in your notes", read: "Read" };
const MASTERY_KIND_NAMES = { term: ["Concepts", "concept"], thinker: ["Thinkers", "thinker"], conn: ["Connections", "connection"], station: ["Close-reading stations", "station"] };
const connId = (c) => `${c.from}>${connTo(c).join("+")}`;
const masteryKey = (kind, id) => `${kind}:${id}`;
const VERIFIED_SET = { term: new Set(VERIFIED_TERMS), thinker: new Set(VERIFIED_THINKERS), conn: new Set(CONNECTIONS.map(connId)) };
const validMastery = (v) => isObj(v) && Object.keys(v).every((k) => k === "met" || k === "ans") && optNum(v.met) && optNum(v.ans) && (v.met !== undefined || v.ans !== undefined);

function connName(c) {
  const verb = (CONN_KINDS[c.kind] || [c.kind])[0].toLowerCase();
  return `${THINKER.get(c.from)?.sn || c.from} ${verb} ${connTo(c).map((x) => THINKER.get(x)?.sn || x).join(" and ")}`;
}
// Every item in the collection, in reading-route order within each kind.
function masteryItems() {
  const tmap = termMap(), out = [];
  for (const id of VERIFIED_TERMS) { const g = tmap.get(id); if (g) out.push({ kind: "term", id, name: g.t, g }); }
  for (const id of VERIFIED_THINKERS) { const p = THINKER.get(id); if (p) out.push({ kind: "thinker", id, name: p.n, p }); }
  for (const c of CONNECTIONS) out.push({ kind: "conn", id: connId(c), name: connName(c), c });
  for (const P of PATHS.filter((x) => x.kind === "close")) {
    let prev = null;
    for (const st of closeStations(P)) { out.push({ kind: "station", id: `${P.id}:${st.id}`, name: st.n, P, st, prev }); prev = `${P.id}:${st.id}`; }
  }
  return out;
}
// Which stages an item has reached: { met, ans, used, read } as booleans. `ctx` caches note lookups for one drawing.
function masteryStages(item, ctx = {}) {
  const rec = S.mastery.get(masteryKey(item.kind, item.id)) || {}, out = { met: !!rec.met, ans: !!rec.ans, used: false, read: false };
  if (item.kind === "term") out.used = termNotes(item.g).length > 0 || [...S.texts.values()].some((t) => (t.termMarks || []).some((m) => m.id === item.id));
  else if (item.kind === "thinker") {
    // every note folded once per drawing, then each thinker's names looked for in them (what thinkerNotes does, note by note)
    // Folding a note is the slow part, so only notes whose plain lowercase text holds one of the names (accents stripped) are folded.
    const plainOf = (x) => x.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    const raw = ctx.raw || (ctx.raw = [...S.notes.values()].map((n) => { const x = [n.passage, n.gloss].filter(Boolean).join("\n"); return [x, plainOf(x)]; }));
    const needles = thinkerNeedles(item.p), names = [...new Set([item.p.n, item.p.sn])].map(plainOf);
    out.used = needles.length > 0 && raw.some(([x, low]) => names.some((nm) => low.includes(nm)) && findNeedles(linkFold(x), needles).length);
  }
  else if (item.kind === "station") {
    if (ctx.noLoad && !S.content.get(item.P.book)) return out; // the home screen doesn't load a book just to count
    const state = ctx[item.P.id] || (ctx[item.P.id] = closeState(item.P));
    out.read = (state.out.get(item.st.id)?.notes.length || 0) > 0;
  }
  if (out.ans || out.used || out.read) out.met = true; // answering or using something means you met it
  return out;
}
const stagesDone = (item, s) => MASTERY_STAGES[item.kind].filter((k) => s[k]).length;
const masteredAll = (item, s) => stagesDone(item, s) === MASTERY_STAGES[item.kind].length;
// Within reach: something next to it is met (or, for a station, the one before it is read; the first station always is).
function withinReach(item, metKeys) {
  const has = (kind, id) => metKeys.has(masteryKey(kind, id));
  if (item.kind === "station") return !item.prev || metKeys.has(masteryKey("station", item.prev));
  if (item.kind === "term") return (item.g.p || []).some((p) => has("thinker", p)) || [...(LINKS.see.get(item.id) || []), ...(LINKS.vs.get(item.id) || [])].some((t) => has("term", t));
  if (item.kind === "thinker") return connectionsOf(item.id).some((c) => has("conn", connId(c))) || VERIFIED_TERMS.some((t) => has("term", t) && (GLOSSARY_BY_ID.get(t)?.p || []).includes(item.id))
    || THINKERS.some((x) => (x.i.includes(item.id) || item.p.i.includes(x.id)) && has("thinker", x.id));
  return [item.c.from, ...connTo(item.c)].some((p) => has("thinker", p));
}
// The whole collection worked out once: each item's stages, and the met keys used for "within reach". Kept until a note, a book,
// the collection or a loaded book changes (masteryKeyNow), so drawing the home screen again costs almost nothing.
const GLOSSARY_BY_ID = new Map(GLOSSARY.map((g) => [g.id, g]));
let MASTERY_CACHE = null;
function masteryKeyNow(noLoad) {
  let n = 0, m = 0, t = 0;
  for (const x of S.notes.values()) n += (x.updatedAt || x.createdAt || 0) % 1e9;
  for (const x of S.mastery.values()) m += (x.met ? 1 : 0) + (x.ans ? 2 : 0);
  for (const x of S.texts.values()) t += (x.updatedAt || 0) % 1e9;
  const loaded = PATHS.filter((P) => P.kind === "close" && S.content.get(P.book)).length;
  return [S.notes.size, n, S.mastery.size, m, S.texts.size, t, S.terms.size, noLoad ? 0 : 1, loaded].join("|");
}
function masteryState(opts = {}) {
  const key = masteryKeyNow(!!opts.noLoad);
  if (MASTERY_CACHE && MASTERY_CACHE.key === key) return MASTERY_CACHE.M;
  const M = masteryStateFresh(opts);
  MASTERY_CACHE = { key, M };
  return M;
}
function masteryStateFresh(opts) {
  const ctx = { noLoad: !!opts.noLoad }, items = masteryItems().map((it) => ({ ...it, s: masteryStages(it, ctx) }));
  const metKeys = new Set(items.filter((it) => it.s.met || it.s.read).map((it) => masteryKey(it.kind, it.id)));
  for (const it of items) it.reach = it.s.met || it.s.read || withinReach(it, metKeys);
  const steps = items.reduce((a, it) => a + MASTERY_STAGES[it.kind].length, 0), got = items.reduce((a, it) => a + stagesDone(it, it.s), 0);
  return { items, steps, got, pct: steps ? Math.round((100 * got) / steps) : 0, mastered: items.filter((it) => masteredAll(it, it.s)).length };
}

/* ---------- earning ---------- */
// Called where you meet or answer something. Unverified items and stages already earned do nothing.
async function earn(kind, id, stage) {
  if (!VERIFIED_SET[kind] || !VERIFIED_SET[kind].has(id) || !S.mastery) return false;
  const key = masteryKey(kind, id), rec = S.mastery.get(key) || {};
  if (rec[stage]) return false;
  const now = Date.now(), next = { ...rec, [stage]: now, ...(rec.met ? {} : { met: now }) };
  S.mastery.set(key, next);
  if (idb) await idbDo("mastery", (st) => st.put(next, key)).catch(() => {});
  const item = masteryItems().find((it) => it.kind === kind && it.id === id);
  if (item) celebrate(item, stage === "ans" && !rec.met ? "ans" : stage);
  return true;
}
// A card showing these thinkers' connections has been seen: each connection on it is met.
function earnConnectionsOf(id) { for (const c of connectionsOf(id)) earn("conn", connId(c), "met"); }
// "Used" and "read" come from your notes: after a note is saved, anything newly used or read is celebrated once.
let USED_SEEN = null;
function usedNow() {
  const ctx = { noLoad: true }, out = new Set();
  for (const it of masteryItems()) {
    const s = masteryStages(it, ctx); if (s.used || s.read) out.add(masteryKey(it.kind, it.id));
  }
  return out;
}
function masteryNoteChanged(noteId) {
  if (!S.mastery || S.mode !== "ready") return;
  const now = usedNow(), n = S.notes.get(noteId);
  if (USED_SEEN && n) for (const key of now) if (!USED_SEEN.has(key)) {
    const it = masteryItems().find((x) => masteryKey(x.kind, x.id) === key);
    if (!it) continue;
    // only what this note itself brings: a station's passage it falls in, a term or thinker it names
    const mine = it.kind === "station" ? n.textId === it.P.book && (closeState(it.P).out.get(it.st.id)?.notes || []).some(([id]) => id === noteId) : it.kind === "term" ? termNotes(it.g).some(([id]) => id === noteId) || (S.texts.get(n.textId)?.termMarks || []).some((m) => m.id === it.id) : thinkerNotes(thinkerNeedles(it.p)).some(([id]) => id === noteId);
    if (mine) celebrate(it, it.kind === "station" ? "read" : "used");
  }
  USED_SEEN = now;
}
// The instant part: a toast that pops, the stage pips, and a short buzz where the phone allows it. Things earned together (a card
// that meets a thinker and their connections) arrive as one toast.
let EARNED = [], EARN_T = 0;
function celebrate(item, stage) {
  EARNED.push([item, stage]); clearTimeout(EARN_T); EARN_T = setTimeout(flushEarned, 60);
}
function flushEarned() {
  const list = EARNED; EARNED = []; if (!list.length) return;
  const line = ([item, stage]) => {
    const s = masteryStages(item), stages = MASTERY_STAGES[item.kind], full = stages.every((k) => s[k]);
    return { full, text: `${full && stages.length > 1 ? "Mastered" : STAGE_NAMES[stage]}: ${item.name} ${stages.map((k) => (s[k] ? "●" : "○")).join("")}` };
  };
  const lines = list.map(line), full = lines.some((x) => x.full);
  const msg = lines.length === 1 ? lines[0].text : `${lines.length} collected: ${list.map(([it]) => it.name).join(" · ")}`;
  toast(msg, { label: "Collection", run: () => go({ screen: "mastery" }) });
  const el = $("#toast"); void el.offsetWidth; el.classList.add("earn");
  try { if (navigator.vibrate && !matchMedia("(prefers-reduced-motion: reduce)").matches) navigator.vibrate(full ? [18, 60, 30] : 18); } catch {}
}

/* ---------- the collection screen (S.screen "mastery") and its card on the home screen ---------- */
function masteryCardHTML() {
  if (!S.mastery) return "";
  const M = masteryState({ noLoad: true });
  return `<button class="refcard pathcard" id="openmastery"><span class="rc-t">Mastery</span><span class="rc-s">${M.got ? `${M.pct}% · ${M.mastered} of ${M.items.length} mastered` : `${M.items.length} checked concepts, thinkers, connections and stations to collect`}</span><span class="rc-meter" aria-hidden="true"><i style="width:${M.pct}%"></i></span><span class="rc-go" aria-hidden="true">›</span></button>`;
}
function masteryTile(it) {
  const stages = MASTERY_STAGES[it.kind], done = stagesDone(it, it.s), full = done === stages.length;
  const cls = full ? "mastered" : done ? "started" : it.reach ? "reach" : "locked";
  const open = it.kind === "term" ? `data-term="${esc(it.id)}"` : it.kind === "thinker" ? `data-thinker="${esc(it.id)}"` : it.kind === "conn" ? `data-thinker="${esc(it.c.from)}"` : `data-mpath="${esc(it.P.id)}"`;
  const pips = stages.map((k) => `<i class="${it.s[k] ? "on" : ""}" title="${esc(STAGE_NAMES[k])}"></i>`).join("");
  const label = cls === "locked" ? `<span class="mt-n">Locked</span><span class="mt-h">Meet something next to it</span>` : `<span class="mt-n">${esc(it.name)}</span>`;
  const state = full ? "mastered" : stages.map((k) => `${STAGE_NAMES[k]}: ${it.s[k] ? "yes" : "not yet"}`).join(", ");
  return `<button class="mtile ${cls}" ${cls === "locked" ? "disabled" : open} aria-label="${esc(cls === "locked" ? `A locked ${MASTERY_KIND_NAMES[it.kind][1]}` : `${it.name}, ${state}`)}">${label}<span class="mt-pips">${pips}</span></button>`;
}
function masteryView() {
  const M = masteryState();
  const kinds = Object.keys(MASTERY_STAGES).map((kind) => {
    const list = M.items.filter((it) => it.kind === kind); if (!list.length) return "";
    const n = list.filter((it) => masteredAll(it, it.s)).length;
    const open = list.filter((it) => it.reach), locked = list.length - open.length;
    const rest = locked ? `<div class="mtile locked" role="note"><span class="mt-n">${locked} still locked</span><span class="mt-h">${kind === "station" ? "Each opens when you've read the station before it" : "Each unlocks when you meet something next to it"}</span></div>` : "";
    return `<section class="group"><div class="label">${MASTERY_KIND_NAMES[kind][0]}<span class="cnt">${n} of ${list.length}</span></div><div class="mtiles">${open.map(masteryTile).join("")}${rest}</div></section>`;
  }).join("");
  const known = M.items.filter((it) => (it.kind === "term" || it.kind === "thinker") && it.s.used);
  const explain = known.length ? `<section class="group"><div class="label">In your own words<span class="cnt">${known.length}</span></div>
    <p class="hint">Checked concepts and thinkers that your notes now use.</p><div class="chips">${known.map((it) => `<button class="chip" ${it.kind === "term" ? `data-term="${esc(it.id)}"` : `data-thinker="${esc(it.id)}"`}>${esc(it.name)}</button>`).join("")}</div></section>` : "";
  return `<div><button class="btn ghost" id="back" style="padding-left:0">← Back</button></div>
    <header class="gl-head"><div><h1>Mastery</h1><div class="sub">${M.got ? `${M.pct}% of every stage, ${M.mastered} of ${M.items.length} mastered` : "Nothing collected yet"}</div></div></header>
    <div class="mmeter" role="img" aria-label="${M.pct}% collected"><i style="width:${M.pct}%"></i></div>
    <p class="hint">Only entries that passed a checked audit count, so everything here rests on sources. Open an entry to meet it, get it right in a puzzle to answer it, and use it in a note of your own. More arrive as audits land.</p>
    <p class="mlegend"><span><i class="on"></i> Met</span><span><i class="on"></i><i class="on"></i> Answered</span><span><i class="on"></i><i class="on"></i><i class="on"></i> Used in your notes</span></p>
    ${explain}${kinds}`;
}
