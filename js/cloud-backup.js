// Optional private GitHub backups. No account or credential is bundled with the site.
// API contract: https://docs.github.com/en/rest/repos/contents
const CLOUD_KEY = 'mg-cloud-backup', CLOUD_INTERVAL = 5 * 60 * 1000, CLOUD_MAX = 50 * 1024 * 1024;
let cloudBusy = false, cloudError = '', cloudTimer = null;
function cloudConfig() {
  try {
    const c = JSON.parse(localStorage.getItem(CLOUD_KEY));
    return c && /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(c.repo) && /^github_pat_[A-Za-z0-9_]+$/.test(c.token)
      && /^[a-f0-9-]{36}$/.test(c.device) ? c : null;
  } catch { return null; }
}
function cloudSave(c) { localStorage.setItem(CLOUD_KEY, JSON.stringify(c)); }
function cloudBackupStatusHTML() {
  const c = cloudConfig();
  if (!c) return '<p class="hint" id="cloud-status">Automatic backups are off.</p>';
  return `<p class="hint" id="cloud-status" role="status">Private repository backup: ${cloudBusy ? 'saving…' : cloudError ? esc(cloudError) : c.last ? 'last saved ' + esc(new Date(c.last).toLocaleString()) : 'no successful upload yet'}. Backups run while the app is open and online.</p>`;
}
function cloudDrawStatus() {
  const el = $('#cloud-status'); if (el) el.outerHTML = cloudBackupStatusHTML();
  const warning = $('#cloud-warning-slot'); if (warning) warning.innerHTML = cloudBackupWarningHTML();
}
function cloudBackupWarningHTML() {
  const c = cloudConfig();
  const since = c && (c.verifiedAt || c.last || c.enabledAt);
  if (!since || Date.now() - since < 3 * DAY) return '';
  return `<div class="banner" role="alert"><b>Automatic backup needs attention.</b> No successful backup or verification in three days. ${esc(cloudError || 'Open backup settings to check the connection.')} <button class="btn" data-cloud-settings="1">Check backups</button></div>`;
}
async function cloudRequest(c, suffix = '', options = {}) {
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 60000);
  try {
    const r = await fetch(`https://api.github.com/repos/${c.repo}${suffix}`, {
      ...options, signal: ctrl.signal, credentials: 'omit', redirect: 'error', cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28',
        ...options.headers, Authorization: `Bearer ${c.token}` }
    });
    if (!r.ok) throw new UErr(r.status === 401 ? 'Token expired or invalid. Reconnect in Automatic backups.' : r.status === 403 ? 'GitHub denied access or limited requests. Check the token and try later.' : r.status === 409 ? 'The remote file changed. Retry the backup.' : `GitHub returned ${r.status}. Check the repository and token.`, { cause: r.status });
    return r;
  } finally { clearTimeout(timer); }
}
async function cloudPrivate(c) {
  const repo = await (await cloudRequest(c)).json();
  if (repo.private !== true || repo.visibility !== 'private' || repo.archived || repo.disabled) throw new UErr('Uploads stopped: choose an active private repository.');
  // Bind to the chosen repository identity; a rename or transferred name must be reconnected.
  if (c.repoId && c.repoId !== repo.id) throw new UErr('The repository identity changed. Reconnect before backing up.');
  return repo;
}
const cloudPath = (c) => `marginalia-backups/${c.device}.json`;
const CLOUD_READING = ['pos', 'posF', 'readAt', 'days'];
const cloudHash = async (text) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map((b) => b.toString(16).padStart(2, '0')).join('');
const cloudAssetPath = (hash) => `marginalia-backups/objects/${hash}.json`;
function cloudSameConnection(c) {
  const now = cloudConfig();
  return now && now.repo === c.repo && now.repoId === c.repoId && now.token === c.token && now.device === c.device;
}
async function cloudMeta(c, path, branch) {
  try {
    const m = await (await cloudRequest(c, `/contents/${path}?ref=${encodeURIComponent(branch)}`, { headers: { Accept: 'application/vnd.github.object+json' } })).json();
    if (m.type !== 'file' || typeof m.sha !== 'string') throw new UErr('The backup path is not a regular file.');
    return m;
  } catch (e) { if (e.cause === 404) return null; throw e; }
}
async function cloudRead(c, path, ref) {
  const r = await cloudRequest(c, `/contents/${path}${ref ? '?ref=' + encodeURIComponent(ref) : ''}`, { headers: { Accept: 'application/vnd.github.raw+json' } });
  const text = await r.text();
  if (new Blob([text]).size > CLOUD_MAX) throw new UErr('A backup file exceeds Marginalia’s 50 MiB per-file limit. Use a manual backup.');
  return text;
}
async function cloudWrite(c, path, text, branch, sha) {
  const blob = new Blob([text], { type: 'application/json' });
  if (blob.size > CLOUD_MAX) throw new UErr('A backup file exceeds Marginalia’s 50 MiB per-file limit. Use a manual backup.');
  const content = (await blobToDataURL(blob)).split(',')[1];
  // Privacy is rechecked for every write, including each individual asset.
  await cloudPrivate(c);
  if (!cloudSameConnection(c)) throw new UErr('Backup disconnected or changed before upload.');
  const result = await (await cloudRequest(c, `/contents/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: path.includes('/objects/') ? 'Store Marginalia book asset' : 'Save Marginalia notes and session', content, branch, ...(sha ? { sha } : {}) }) })).json();
  if (!result.content?.sha || !result.commit?.sha) throw new UErr('GitHub did not confirm the backup.');
  return result;
}
// Serializes tabs. Include reading only at a session boundary or an explicit Back up now.
async function cloudUpload(includeReading = S.screen !== 'reader') {
  if (navigator.locks) return navigator.locks.request('marginalia-cloud-upload', { ifAvailable: true }, (lock) => lock ? cloudUploadLocked(includeReading) : false);
  cloudError = 'This browser cannot coordinate automatic backups. Use Save backup.'; cloudDrawStatus(); return false;
}
async function cloudUploadLocked(includeReading) {
  if (cloudBusy || !idb) return false;
  let c = cloudConfig(); if (!c) return false;
  if (!c.enabledAt) { c = { ...c, enabledAt: c.last || Date.now() }; cloudSave(c); }
  if (!navigator.onLine) { cloudError = 'Offline; waiting to retry'; cloudDrawStatus(); return false; }
  cloudBusy = true; cloudError = ''; cloudDrawStatus();
  try {
    const repo = await cloudPrivate(c), branch = repo.default_branch, path = cloudPath(c);
    const meta = await cloudMeta(c, path, branch);
    // The write lease uses the metadata SHA: a concurrent manifest change rejects our write.
    const previous = meta ? JSON.parse(await cloudRead(c, path, branch)) : null;
    if (previous && (previous.app !== 'marginalia' || previous.version !== 7 || !isObj(previous.texts) || (previous.layout !== undefined && previous.layout !== 'split-1'))) throw new UErr('Remote backup format is unsupported. Nothing was replaced.');
    const data = await backupData(true), assets = { content: {}, covers: {} }, reading = {};
    // Keep metadata/annotations for classics; their bundled text and cover never leave this device.
    for (const [id, t] of Object.entries(data.texts)) {
      if (t.hasContent && !CLASSICS.includes(id) && !Object.hasOwn(data.content, id)) throw new UErr('An imported book’s text is missing locally. The previous backup was kept.');
      const saved = previous?.layout === 'split-1' ? previous.reading?.[id] : previous?.texts?.[id];
      reading[id] = Object.fromEntries(CLOUD_READING.filter((k) => (includeReading ? t : saved || {})[k] !== undefined).map((k) => [k, (includeReading ? t : saved)[k]]));
      for (const k of CLOUD_READING) delete t[k];
    }
    // Content-addressed objects are immutable. Upload missing ones first; publish the manifest last.
    for (const kind of ['content', 'covers']) for (const [id, value] of Object.entries(data[kind])) {
      if (!Object.hasOwn(data.texts, id)) continue;
      const text = JSON.stringify({ kind, value }), hash = await cloudHash(text), objectPath = cloudAssetPath(hash);
      assets[kind][id] = hash;
      if (!await cloudMeta(c, objectPath, branch)) {
        try { await cloudWrite(c, objectPath, text, branch); }
        catch (e) {
          // Another device may have created the same immutable object concurrently.
          if (![409, 422].includes(e.cause) || await cloudRead(c, objectPath, branch) !== text) throw e;
        }
      }
    }
    delete data.content; delete data.covers;
    const manifest = { ...data, layout: 'split-1', assets, reading };
    const signature = (v) => JSON.stringify({ ...v, exportedAt: undefined });
    if (previous && signature(previous) === signature(manifest)) {
      if (cloudSameConnection(c)) cloudSave({ ...c, verifiedAt: Date.now() });
      return true;
    }
    const result = await cloudWrite(c, path, JSON.stringify(manifest), branch, meta?.sha);
    if (cloudSameConnection(c)) cloudSave({ ...c, repoId: repo.id, sha: result.content.sha, last: Date.now(), verifiedAt: Date.now() });
    return true;
  } catch (e) {
    cloudError = e instanceof UErr ? e.message : 'Upload failed; your local library is unchanged. Will retry while open.';
    return false;
  } finally { cloudBusy = false; cloudDrawStatus(); }
}
// A session boundary is queued after savePos's IndexedDB writes. If a background attempt is
// already holding the lock, wait for it, then capture the completed session instead of dropping it.
function cloudSessionEnd() {
  if (!cloudConfig() || !navigator.locks) return;
  return navigator.locks.request('marginalia-cloud-upload', () => cloudUploadLocked(true)).catch(() => false);
}
function startCloudBackups() {
  if (cloudTimer) clearInterval(cloudTimer);
  cloudTimer = setInterval(() => { if (document.visibilityState === 'visible') cloudUpload(false); }, CLOUD_INTERVAL);
  if (cloudConfig()) cloudUpload();
}
window.addEventListener('online', () => cloudUpload());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cloudUpload(); else cloudSessionEnd(); });
window.addEventListener('storage', (e) => { if (e.key === CLOUD_KEY) cloudDrawStatus(); });
function cloudSetup() {
  const old = cloudConfig();
  openSheet(`<h2>Automatic private backups</h2>
    <p class="hint">Create a dedicated private GitHub repository with a README. Create a fine-grained personal access token restricted to that repository, with Contents: read and write. Paste it here, never in a chat or the app's source code.</p>
    <p class="hint">Imported books’ full extracted text, including copyrighted works, and covers are uploaded once per content version to GitHub’s servers as unencrypted JSON. Notes, drafts, terms, paths and wishlist use a separate small file. Bundled classics’ text and covers are excluded and rebuilt on restore; their notes and book metadata are preserved. Use Save backup to preserve your edits to a bundled classic’s text, structure or cover. Reading position is uploaded at session end. Original PDFs and Recently deleted are excluded, just as in Save backup. Files are readable by anyone you give access to that private repository; they are not encrypted by Marginalia.</p>
    <p class="hint">Each device has its own file. GitHub's file history keeps older copies. To move work between devices, choose Review remote backup. Restoring always asks before changing your library.</p>
    <div class="field"><label for="cloud-repo">Private repository (owner/name)</label><input id="cloud-repo" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(old?.repo || '')}" maxlength="180"></div>
    <div class="field"><label for="cloud-token">Fine-grained token</label><input id="cloud-token" type="password" autocomplete="off" maxlength="300"></div>
    <p class="hint">The token is saved in this browser so backups resume when you reopen the app. Every Pages project under the same origin (for example, lumiiifox.github.io) can read this token, even from a different project path. Restrict it to the dedicated backup repository and revoke it in GitHub when no longer needed.</p>
    <label><input id="cloud-consent" type="checkbox"> Save the token on this device and automatically upload my library to this private repository.</label>
    <p class="hint">Runs on opening, reconnecting, returning to the app, and every five minutes while visible. The app cannot back up while closed. Marginalia limits each file to 50 MiB. Keep the repository private.</p>`, async () => {
      if (cloudBusy) return 'A backup is running. Wait for it to finish.';
      const repo = $('#cloud-repo').value.trim(), token = $('#cloud-token').value.trim();
      if (!/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(repo) || repo.endsWith('/.') || repo.endsWith('/..')) return 'Enter a repository as owner/name.';
      if (!/^github_pat_[A-Za-z0-9_]+$/.test(token)) return 'Enter a fine-grained GitHub token.';
      if (!$('#cloud-consent').checked) return 'Select the checkbox to enable uploads and save the token.';
      const c = { repo, token, device: old && old.repo.toLowerCase() === repo.toLowerCase() ? old.device : crypto.randomUUID() };
      const meta = await cloudPrivate(c); c.repoId = meta.id; c.enabledAt = Date.now();
      cloudSave(c); cloudError = '';
      return () => { cloudDrawStatus(); cloudUpload(); };
    });
}
function cloudBackupPanel() {
  const c = cloudConfig();
  if (!c) return cloudSetup();
  openPanel(`<h2>Automatic backups</h2><p class="hint">Private repository: ${esc(c.repo)}. This device: ${esc(c.device.slice(0, 8))}.</p>
    <p class="hint">Last successful upload: ${c.last ? esc(new Date(c.last).toLocaleString()) : 'none'}. ${esc(cloudError)}</p>
    <p class="hint">Checks every five minutes while open, on returning and reconnecting. Only changed notes/metadata and new book assets are uploaded; reading position is saved at session end; closed apps cannot run backups. Original PDFs and Recently deleted are excluded. Older copies remain in GitHub's file history.</p>
    <div class="menu"><button class="menuitem" id="cloud-now">Back up now</button><button class="menuitem" id="cloud-list">Review remote backup</button><button class="menuitem" id="cloud-setup">Change repository or token</button><button class="menuitem" id="cloud-disconnect">Disconnect this device</button></div>`, (b) => {
      if (b.id === 'cloud-now') cloudUpload(true).then((ok) => toast(ok ? 'Private backup saved.' : cloudError || 'A backup is already running.'));
      if (b.id === 'cloud-setup') cloudSetup();
      if (b.id === 'cloud-list') cloudList().catch(() => toast('Could not read remote backups. Check the connection, repository and token.'));
      if (b.id === 'cloud-disconnect') {
        localStorage.removeItem(CLOUD_KEY); cloudError = ''; cloudDrawStatus();
        toast('Disconnected. Remote files remain. Revoke the token in GitHub to remove its access. An upload already sent may finish.');
      }
    });
}
async function cloudList() {
  const c = cloudConfig(); if (!c) return;
  await cloudPrivate(c);
  const list = await (await cloudRequest(c, '/contents/marginalia-backups')).json();
  if (!Array.isArray(list)) throw new Error('Invalid backup directory');
  const files = list.filter((f) => f.type === 'file' && /^[a-f0-9-]{36}\.json$/.test(f.name) && f.size <= CLOUD_MAX);
  openPanel(`<h2>Review a device backup</h2><p class="hint">Each device keeps a separate file. Choose one to preview its records and saved date before restoring. Your own device is ${esc(c.device.slice(0, 8))}.</p><div class="menu">${files.map((f, i) => `<button class="menuitem" data-cloud-file="${i}">Device ${esc(f.name.slice(0, 8))}${f.name === c.device + '.json' ? ' (this device)' : ''}</button>`).join('') || '<p class="hint">No backups found.</p>'}</div>`, (b) => {
    const f = files[Number(b.dataset.cloudFile)]; if (!f) return;
    cloudReview(c, f.name).catch(() => toast('Could not open this backup. Nothing in your library changed.'));
  });
}
async function cloudReview(c, name) {
  if (!/^[a-f0-9-]{36}\.json$/.test(name)) throw new Error('Invalid backup name');
  const repo = await cloudPrivate(c);
  const data = JSON.parse(await cloudRead(c, `marginalia-backups/${name}`, repo.default_branch));
  if (data.app !== 'marginalia' || data.version !== 7 || !isObj(data.texts)) throw new Error('Unsupported backup');
  if (data.layout !== undefined && data.layout !== 'split-1') throw new Error('Unsupported layout');
  if (data.layout === 'split-1') {
    if (!isObj(data.assets) || !isObj(data.reading)) throw new Error('Invalid manifest');
    data.content = {}; data.covers = {};
    for (const kind of ['content', 'covers']) {
      if (!isObj(data.assets[kind])) throw new Error('Invalid assets');
      for (const [id, hash] of Object.entries(data.assets[kind])) {
        if (!Object.hasOwn(data.texts, id) || !/^[a-f0-9]{64}$/.test(hash) || CLASSICS.includes(id)) throw new Error('Invalid asset reference');
        const raw = await cloudRead(c, cloudAssetPath(hash), repo.default_branch);
        if (await cloudHash(raw) !== hash) throw new Error('Backup asset checksum failed');
        const asset = JSON.parse(raw);
        if (asset.kind !== kind || !VALID[kind](asset.value)) throw new Error('Invalid asset');
        Object.defineProperty(data[kind], id, { value: asset.value, enumerable: true });
      }
    }
    for (const [id, t] of Object.entries(data.texts)) {
      if (!VALID.texts(t)) throw new Error('Invalid book metadata');
      const reading = data.reading[id];
      if (reading !== undefined && (!isObj(reading) || Object.keys(reading).some((k) => !CLOUD_READING.includes(k)))) throw new Error('Invalid reading position');
      Object.assign(t, reading || {});
      if (!VALID.texts(t)) throw new Error('Invalid reading record');
      if (CLASSICS.includes(id)) {
        const r = await fetch(`data/books/${id}.json`); if (!r.ok) throw new Error('Bundled classic unavailable');
        const book = await r.json(); if (!VALID.content(book.content)) throw new Error('Invalid classic');
        data.content[id] = book.content;
        const cover = await fetch(`data/books/${id}.jpg`);
        if (cover.ok) data.covers[id] = await blobToDataURL(await cover.blob());
      } else if (t.hasContent && !Object.hasOwn(data.content, id)) throw new Error('Missing book asset');
    }
  }
  await showRestore(name, data, 'Private repository backup. Review before restoring.');
}
