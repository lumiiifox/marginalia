// Wishlist records remain separate from imported books. Suggestions are sourced editorial pairings, computed locally.
const bookWords = (s) => fold(String(s || '')).normalize('NFD').replace(/\p{M}/gu, '').replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const bookTitleKey = (s) => bookWords(String(s || '').split(':')[0]).replace(/^(the|a|an) /, '');
function sameBookAuthor(a, b) {
  a = bookWords(a); b = bookWords(b);
  if (!a || !b) return false;
  return a.split(' ').sort().join(' ') === b.split(' ').sort().join(' ') || (` ${a} `).includes(` ${b} `) || (` ${b} `).includes(` ${a} `);
}
const sameBook = (a, b) => bookWords(a.title) === bookWords(b.title) && (sameBookAuthor(a.author, b.author) || (!bookWords(a.author) && !bookWords(b.author)));
// Work matching tolerates edition subtitles; deduplicating wishlist entries keeps the full title.
const companionMatches = (t, base) => sameBookAuthor(t.author, base.author) && [base.title, ...base.aliases].some((n) => bookTitleKey(n) === bookTitleKey(t.title));
const wishedBook = (b) => [...S.wishlist].find(([, w]) => sameBook(w, b));
const ownedBook = (b) => [...S.texts].find(([, t]) => sameBook(t, b));
function safeBookURL(s) {
  if (!s) return true;
  try { const u = new URL(s); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; }
}
function validWish(w) {
  const limits = { title: 1000, author: 1000, note: 10000, url: 2000, forBook: 199 };
  return isObj(w) && Object.keys(w).every((k) => [...Object.keys(limits), 'status', 'createdAt', 'updatedAt'].includes(k))
    && Object.entries(limits).every(([k, n]) => typeof w[k] === 'string' && w[k].length <= n)
    && w.title.trim().length > 0 && ['wanted', 'obtained'].includes(w.status) && safeBookURL(w.url)
    && (!w.forBook || goodId(w.forBook)) && Number.isFinite(w.createdAt) && Number.isFinite(w.updatedAt);
}
function wishSheet(id = null, forBook = '') {
  const old = id && S.wishlist.get(id); if (id && !old) return;
  const w = old || { title: '', author: '', note: '', url: '', forBook, status: 'wanted' };
  const field = (k, label, max) => `<div class="field"><label for="wish-${k}">${label}</label><input id="wish-${k}" maxlength="${max}" value="${esc(w[k])}"></div>`;
  openSheet(`<h2>${old ? 'Edit wishlist book' : 'Add to wishlist'}</h2>
    ${field('title', 'Title', 1000)}${field('author', 'Author', 1000)}${field('url', 'Publisher or catalogue link (optional)', 2000)}
    <div class="field"><label for="wish-note">Why I want to read it</label><textarea id="wish-note" rows="3" maxlength="10000">${esc(w.note)}</textarea></div>
    <div class="field"><label for="wish-forBook">Read alongside (optional)</label><select id="wish-forBook"><option value="">No linked book</option>${[...S.texts].sort((a,b)=>a[1].title.localeCompare(b[1].title)).map(([key,t])=>`<option value="${esc(key)}"${key===w.forBook?' selected':''}>${esc(t.title)}${t.author ? ` — ${esc(t.author)}` : ''}</option>`).join('')}${w.forBook && !S.texts.has(w.forBook) ? `<option value="${esc(w.forBook)}" selected>Linked book unavailable</option>` : ''}</select></div>
    <div class="field"><label for="wish-status">Status</label><select id="wish-status"><option value="wanted"${w.status==='wanted'?' selected':''}>Want to read</option><option value="obtained"${w.status==='obtained'?' selected':''}>Obtained</option></select></div>`, async () => {
      const next = Object.fromEntries(['title','author','url','note','forBook','status'].map((k)=>[k,$(`#wish-${k}`).value.trim()]));
      Object.assign(next, { createdAt: old?.createdAt || Date.now(), updatedAt: Date.now() });
      if (!validWish(next)) return 'Enter a title and a valid http or https link, or leave the link empty.';
      const duplicate = [...S.wishlist].find(([key, v]) => key !== id && sameBook(v, next));
      if (duplicate) return 'That title and author are already on your wishlist. Edit the existing entry instead.';
      await put('wishlist', id || 'wish-' + gid(), next);
      return () => { render(); toast('Wishlist saved.'); };
    });
}
async function deleteWish(id) {
  const w = S.wishlist.get(id); if (!w) return;
  const tid = await trashAndRemove('wish', w.title, [['wishlist', id, w]]);
  render(); delToast('Removed from wishlist.', tid);
}
const WISH_SAVING = new Set();
async function wishRecommendation(id, forBook = '') {
  const r = READING_COMPANIONS.find((r)=>r.id===id); if (!r || WISH_SAVING.has(id)) return;
  const old = wishedBook(r); if (old) return wishSheet(old[0]);
  WISH_SAVING.add(id);
  try {
    const now = Date.now();
    await put('wishlist', 'wish-' + gid(), { title:r.title, author:r.author, note:r.why, url:r.url, forBook:S.texts.has(forBook)?forBook:'', status:'wanted', createdAt:now, updatedAt:now });
    toast('Added to your wishlist.');
  } finally { WISH_SAVING.delete(id); }
}
function wishlistView() {
  const list = [...S.wishlist].filter(([,w])=>validWish(w)).sort((a,b)=>(a[1].status==='obtained')-(b[1].status==='obtained') || b[1].createdAt-a[1].createdAt);
  return `<div><button class="linkbtn" id="back">← Back</button></div>${banner()}<header class="gl-head"><div><h1>Wishlist</h1><p class="sub">Books to return to, and reasons to read them.</p></div><button class="btn primary" id="newwish">Add a book</button></header>
    <button class="linkbtn" id="openrecommendations">Find reading recommendations</button>
    ${list.length ? `<div class="discovery-list">${list.map(([id,w])=>{ const own=ownedBook(w), related=S.texts.get(w.forBook);return `<article class="discovery-card" data-wish-id="${esc(id)}"><div class="label">${own?'On your shelf':w.status==='obtained'?'Obtained':'Want to read'}</div><h2>${esc(w.title)}</h2>${w.author?`<p class="discovery-author">${esc(w.author)}</p>`:''}${w.note?`<p class="discovery-note">${esc(w.note)}</p>`:''}${related?`<p class="hint">Read alongside <button class="linkbtn" data-open="${esc(w.forBook)}">${esc(related.title)}</button></p>`:w.forBook?'<p class="hint">The linked book is no longer on your shelf.</p>':''}<div class="noteacts">${own?`<button class="btn" data-open="${esc(own[0])}">Open book</button>`:''}${w.url?`<a href="${esc(w.url)}" target="_blank" rel="noopener noreferrer">Book link ↗</a>`:''}<button class="linkbtn" data-wishedit="${esc(id)}">Edit</button><button class="linkbtn danger" data-wishdelete="${esc(id)}">Remove</button></div></article>`;}).join('')}</div>`:'<p class="empty">Save a title even before you own a copy. Add a research question or a note about the edition you want.</p>'}`;
}
function recommendationsFor(tid = null, all = false) {
  const anchors = tid ? (S.texts.has(tid) ? [[tid,S.texts.get(tid)]] : []) : [...S.texts].sort((a,b)=>(b[1].status==='reading')-(a[1].status==='reading') || lastActive(b[1])-lastActive(a[1])).concat([...S.wishlist].filter(([,w])=>w.status==='wanted').map(([,w])=>['',w]));
  return READING_COMPANIONS.map((r)=>({r, matches:anchors.filter(([,t])=>companionMatches(t,r.base))})).filter(({r,matches})=>all || (matches.length && (tid || !ownedBook(r))))
    .sort((a,b)=> (a.matches.length ? anchors.indexOf(a.matches[0]) : Infinity) - (b.matches.length ? anchors.indexOf(b.matches[0]) : Infinity));
}
function recommendationsView() {
  const tid = S.recBook || null, t = tid && S.texts.get(tid), all = !tid && S.recAll, list = recommendationsFor(tid,all);
  const linked = tid ? [...S.wishlist].filter(([,w]) => validWish(w) && w.forBook === tid && !list.some(({r}) => sameBook(r,w))) : [];
  return `<div><button class="linkbtn" id="back">← Back</button></div><header><h1>${tid?'Companion books':'Reading recommendations'}</h1><p class="discovery-intro">${t?`To read alongside <em>${esc(t.title)}</em>.`:all?'Browse the reading list.':'Suggestions for books on your shelf and wishlist.'}</p></header>
    <details class="discovery-about"><summary>How suggestions are chosen</summary><p class="hint">Selected scholarship, with a reason for each pairing and a source you can inspect. Matches use titles and authors; coverage currently includes six works by Aristotle, Spinoza, Deleuze and Guattari, Kant and Nietzsche.</p></details>
    <div class="noteacts"><button class="linkbtn" id="openwishlist">Your wishlist</button>${tid?`<button class="btn" data-wishfor="${esc(tid)}">Add your own companion</button>`:`<button class="linkbtn" id="rec-browse">${all?'For your reading':'Browse all suggestions'}</button>`}</div>
    ${list.length?`<div class="discovery-list">${list.map(({r,matches})=>{ const own=ownedBook(r), wish=wishedBook(r), anchor=matches[0]; return `<article class="discovery-card" data-rec-id="${r.id}"><div class="label">${esc(r.kind)}</div><h2>${esc(r.title)}</h2><p class="discovery-author">${esc(r.author)}</p><p class="hint">Companion to ${esc(r.base.author)}’s <em>${esc(r.base.title)}</em>${anchor&&!anchor[0]?' on your wishlist':''}</p><p>${esc(r.why)}</p><a class="discovery-source" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.source)} ↗</a><div class="noteacts">${own?`<button class="btn" data-open="${esc(own[0])}">On your shelf · Open</button>`:wish?`<button class="btn" data-wishedit="${esc(wish[0])}">${wish[1].status==='obtained'?'Obtained':'On your wishlist'} · Edit</button>`:`<button class="btn" data-wishrec="${r.id}" data-wishanchor="${esc(anchor?.[0]||'')}">Add to wishlist</button>`}</div></article>`;}).join('')}</div>`:`<p class="empty">${tid?'No sourced pairing for this book yet. You can add a companion of your own.':'No new matches in the current reading list. Browse all suggestions, or add titles and authors to your wishlist.'}</p>`}
    ${linked.length ? `<section><h2>Your companion selections</h2><div class="discovery-list">${linked.map(([id,w])=>`<article class="discovery-card"><h3>${esc(w.title)}</h3><p class="discovery-author">${esc(w.author)}</p><p class="discovery-note">${esc(w.note)}</p><button class="linkbtn" data-wishedit="${esc(id)}">Edit wishlist entry</button></article>`).join('')}</div></section>` : ''}`;
}
