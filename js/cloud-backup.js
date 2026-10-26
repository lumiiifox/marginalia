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
  if (repo.private !== true || repo.visibility !== 'private' || repo.archived || repo.disabled) throw new UErr('Choose an active private repository. Nothing was uploaded.');
  // Bind to the chosen repository identity; a rename or transferred name must be reconnected.
  if (c.repoId && c.repoId !== repo.id) throw new UErr('The repository identity changed. Reconnect before backing up.');
  return repo;
}
const cloudPath = (c) => `marginalia-backups/${c.device}.json`;
async function cloudUpload(force = false) {
  if (navigator.locks) return navigator.locks.request('marginalia-cloud-upload', { ifAvailable: true }, (lock) => lock ? cloudUploadLocked(force) : false);
  cloudError = 'This browser cannot coordinate automatic backups. Use Save backup.'; cloudDrawStatus(); return false;
}
async function cloudUploadLocked(force = false) {
  if (cloudBusy || !idb) return false;
  const c = cloudConfig(); if (!c) return false;
  if (!navigator.onLine) { cloudError = 'Offline; waiting to retry'; cloudDrawStatus(); return false; }
  cloudBusy = true; cloudError = ''; cloudDrawStatus();
  try {
    // Check visibility on every attempt, before sending any book or note.
    const repo = await cloudPrivate(c), data = await backupData();
    const stable = JSON.stringify({ ...data, exportedAt: undefined });
    const bytes = new TextEncoder().encode(stable);
    if (bytes.length > CLOUD_MAX) throw new UErr('Backup exceeds 50 MiB. Save a manual backup; automatic upload was skipped.');
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
    const path = cloudPath(c), branch = repo.default_branch;
    let sha;
    // A missing file is expected on first upload; other failures must never become writes.
    try {
      const old = await (await cloudRequest(c, `/contents/${path}?ref=${encodeURIComponent(branch)}`, { headers: { Accept: 'application/vnd.github.object+json' } })).json();
      if (old.type !== 'file' || typeof old.sha !== 'string') throw new UErr('The backup path is not a regular file.');
      sha = old.sha;
    } catch (e) { if (e.cause !== 404) throw e; }
    if (!force && c.hash === hash && c.sha === sha && sha) return true;
    const body = JSON.stringify(data), blob = new Blob([body], { type: 'application/json' });
    if (blob.size > CLOUD_MAX) throw new UErr('Backup exceeds 50 MiB. Save a manual backup.');
    const content = (await blobToDataURL(blob)).split(',')[1];
    // Disconnect/reconnect in another tab cancels work that has not yet been sent.
    if (localStorage.getItem(CLOUD_KEY) !== JSON.stringify(c)) return false;
    const result = await (await cloudRequest(c, `/contents/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Save Marginalia device backup', content, branch, ...(sha ? { sha } : {}) }) })).json();
    if (!result.content?.sha || !result.commit?.sha) throw new UErr('GitHub did not confirm the backup.');
    if (localStorage.getItem(CLOUD_KEY) === JSON.stringify(c)) cloudSave({ ...c, repoId: repo.id, hash, sha: result.content.sha, last: Date.now() });
    return true;
  } catch (e) {
    cloudError = e instanceof UErr ? e.message : 'Upload failed; your local library is unchanged. Will retry while open.';
    return false;
  } finally { cloudBusy = false; cloudDrawStatus(); }
}
function startCloudBackups() {
  if (cloudTimer) clearInterval(cloudTimer);
  cloudTimer = setInterval(() => { if (document.visibilityState === 'visible') cloudUpload(); }, CLOUD_INTERVAL);
  if (cloudConfig()) cloudUpload();
}
window.addEventListener('online', () => cloudUpload());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cloudUpload(); });
window.addEventListener('storage', (e) => { if (e.key === CLOUD_KEY) cloudDrawStatus(); });
function cloudSetup() {
  const old = cloudConfig();
  openSheet(`<h2>Automatic private backups</h2>
    <p class="hint">Create a dedicated private GitHub repository with a README. Create a fine-grained personal access token restricted to that repository, with Contents: read and write. Paste it here, never in a chat or the app's source code.</p>
    <p class="hint">This uploads your books' extracted text, covers, notes, drafts, reading paths, wishlist and reading progress. Original PDFs and Recently deleted are excluded, just as in Save backup. Files are readable by anyone you give access to that private repository; they are not encrypted by Marginalia.</p>
    <p class="hint">Each device has its own file. GitHub's file history keeps older copies. To move work between devices, choose Review remote backup. Restoring always asks before changing your library.</p>
    <div class="field"><label for="cloud-repo">Private repository (owner/name)</label><input id="cloud-repo" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(old?.repo || '')}" maxlength="180"></div>
    <div class="field"><label for="cloud-token">Fine-grained token</label><input id="cloud-token" type="password" autocomplete="off" maxlength="300"></div>
    <p class="hint">The token is saved in this browser so backups resume when you reopen the app. Scripts running on this site can access it. Restrict it to the dedicated backup repository and revoke it in GitHub when no longer needed.</p>
    <label><input id="cloud-consent" type="checkbox"> Save the token on this device and automatically upload my library to this private repository.</label>
    <p class="hint">Runs on opening, reconnecting, returning to the app, and every five minutes while visible. The app cannot back up while closed. Keep the repository private.</p>`, async () => {
      if (cloudBusy) return 'A backup is running. Wait for it to finish.';
      const repo = $('#cloud-repo').value.trim(), token = $('#cloud-token').value.trim();
      if (!/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(repo) || repo.endsWith('/.') || repo.endsWith('/..')) return 'Enter a repository as owner/name.';
      if (!/^github_pat_[A-Za-z0-9_]+$/.test(token)) return 'Enter a fine-grained GitHub token.';
      if (!$('#cloud-consent').checked) return 'Select the checkbox to enable uploads and save the token.';
      const c = { repo, token, device: old && old.repo.toLowerCase() === repo.toLowerCase() ? old.device : crypto.randomUUID() };
      const meta = await cloudPrivate(c); c.repoId = meta.id;
      cloudSave(c); cloudError = '';
      return () => { cloudDrawStatus(); cloudUpload(); };
    });
}
function cloudBackupPanel() {
  const c = cloudConfig();
  if (!c) return cloudSetup();
  openPanel(`<h2>Automatic backups</h2><p class="hint">Private repository: ${esc(c.repo)}. This device: ${esc(c.device.slice(0, 8))}.</p>
    <p class="hint">Last successful upload: ${c.last ? esc(new Date(c.last).toLocaleString()) : 'none'}. ${esc(cloudError)}</p>
    <p class="hint">Checks every five minutes while open, on returning and reconnecting. Changed libraries are uploaded; closed apps cannot run backups. Original PDFs and Recently deleted are excluded. Older copies remain in GitHub's file history.</p>
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
  await cloudPrivate(c);
  const response = await cloudRequest(c, `/contents/marginalia-backups/${name}`, { headers: { Accept: 'application/vnd.github.raw+json' } });
  const text = await response.text();
  if (new Blob([text]).size > CLOUD_MAX) throw new Error('Backup too large');
  const data = JSON.parse(text);
  if (data.app !== 'marginalia' || data.version !== 7 || !isObj(data.texts)) throw new Error('Unsupported backup');
  await showRestore(name, data, 'Private repository backup. Review before restoring.');
}
