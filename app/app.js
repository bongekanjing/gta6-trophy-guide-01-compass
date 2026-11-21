// Leonida Trophy Compass — offline tracker for the 55 GTA VI trophies.
// Plain ES module, no dependencies. Progress lives in localStorage; the
// trophy data is fetched once from app/data/trophies.json (a file of this
// app, so the guide works with the network off when served locally).

const STORE_KEY = 'leonida-trophy-compass-v1';
const DATA_URL = 'data/trophies.json';
const DEMO_EARNED = [2, 3, 4, 8, 9, 15, 16, 20, 21, 28, 33, 42, 52];
const KIND_LABELS = {
  story: 'Story', side: 'Side quest', collectible: 'Collectible',
  activity: 'Activity', world: 'World & combat', money: 'Money', platinum: 'Platinum',
};

const $ = (sel) => document.querySelector(sel);
const listEl = $('#trophy-list');
const detailEl = $('#detail');
const params = new URLSearchParams(location.search);

let trophies = [];
let state = loadState();
let selectedId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return normalizeState(parsed);
    }
  } catch { /* corrupted save: start fresh */ }
  return { earned: {}, spoiler: false, hideEarned: false, kind: 'all', grade: 'all', search: '' };
}

function normalizeState(s) {
  return {
    earned: (s.earned && typeof s.earned === 'object') ? s.earned : {},
    spoiler: !!s.spoiler,
    hideEarned: !!s.hideEarned,
    kind: typeof s.kind === 'string' ? s.kind : 'all',
    grade: typeof s.grade === 'string' ? s.grade : 'all',
    search: typeof s.search === 'string' ? s.search : '',
  };
}

function saveState() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

function isEarned(t) { return !!state.earned[t.id]; }
function toggleEarned(id) {
  if (state.earned[id]) delete state.earned[id]; else state.earned[id] = true;
  saveState();
  render();
}

function medal(t) {
  const marks = { platinum: '◆', gold: '●', silver: '●', bronze: '●' };
  return `<span class="medal grade-${t.grade}" title="${t.grade} trophy" aria-label="${t.grade}">${marks[t.grade]}</span>`;
}

// "Story · bronze" but just "Platinum" when kind and grade are the same word.
function kindGrade(t) {
  const kind = KIND_LABELS[t.kind] || t.kind;
  return kind.toLowerCase() === t.grade ? kind : `${kind} &middot; ${t.grade}`;
}

function detailMeta(t) {
  const kind = KIND_LABELS[t.kind] || t.kind;
  const grade = t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
  let s = `${grade} trophy`;
  if (kind.toLowerCase() !== t.grade) s += ` &middot; ${kind}`;
  if (t.target) s += ` &middot; PSN target: ${t.target.toLocaleString()}`;
  if (t.hidden) s += ' &middot; Hidden on PSN until earned';
  return s;
}

function roadmapStage(id) {
  const i = ROADMAP.findIndex((s) => s.trophies.includes(id));
  return i === -1 ? null : ROADMAP[i].stage;
}

function displayName(t) {
  // Spoiler setting: story trophies stay hidden until earned.
  if (state.spoiler && t.hidden && !isEarned(t)) return 'Hidden trophy';
  return t.name;
}

function displayDescription(t) {
  if (state.spoiler && t.hidden && !isEarned(t)) return 'A story trophy. Earn it to reveal its name and description.';
  return t.description;
}

function trophyMatches(t) {
  if (state.kind !== 'all' && t.kind !== state.kind) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.hideEarned && isEarned(t)) return false;
  if (state.search) {
    const q = state.search.toLowerCase();
    const hay = `${t.name} ${t.description} ${t.guide} ${KIND_LABELS[t.kind] || ''}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderProgress() {
  const earned = trophies.filter(isEarned).length;
  const total = trophies.length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  $('#earned-count').textContent = earned;
  $('#progress-fill').style.width = `${pct}%`;
  $('#progress-label').textContent = `${pct}% toward the platinum — ${total - earned} to go`;
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const have = trophies.filter((t) => t.grade === g && isEarned(t)).length;
    const all = trophies.filter((t) => t.grade === g).length;
    return `<li><span class="medal grade-${g}">●</span> ${g}: ${have}/${all}</li>`;
  }).join('');
  $('#grade-counts').innerHTML = counts;
  const missables = trophies.filter((t) => t.missable).length;
  $('#missable-count').textContent = missables;
}

function renderList() {
  const visible = trophies.filter(trophyMatches);
  $('#result-line').textContent = visible.length === trophies.length
    ? `Showing all ${trophies.length} trophies.`
    : `Showing ${visible.length} of ${trophies.length} trophies.`;
  listEl.innerHTML = visible.map((t) => {
    const earned = isEarned(t);
    const target = t.target ? `<span class="target">PSN target: ${t.target.toLocaleString()}</span>` : '';
    const miss = t.missable ? '<span class="badge missable">Missable — do early</span>' : '';
    const hid = t.hidden ? '<span class="badge hidden">Hidden on PSN</span>' : '';
    return `<li class="trophy ${earned ? 'earned' : ''} ${selectedId === t.id ? 'selected' : ''}" data-id="${t.id}">
      <label class="check-row">
        <input type="checkbox" data-earned="${t.id}" ${earned ? 'checked' : ''} aria-label="Mark ${t.name} as earned">
        ${medal(t)}
        <span class="trophy-text">
          <span class="trophy-name">${escapeHtml(displayName(t))}</span>
          <span class="trophy-desc">${escapeHtml(displayDescription(t))}</span>
          <span class="trophy-meta">${kindGrade(t)} ${target} ${miss} ${hid}</span>
        </span>
      </label>
    </li>`;
  }).join('') || '<li class="empty">No trophies match these filters. Clear the search or widen the filters.</li>';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.innerHTML = `<h2>Pick a trophy</h2>
      <p>Select any trophy in the list to read its full guide: what to do, where and how, when it can be missed, and the sources behind each fact.</p>
      <p>The guides are written from the official trophy descriptions. Where a place or step is not pinned down by the official list, the guide says so plainly instead of inventing one.</p>`;
    return;
  }
  const earned = isEarned(t);
  detailEl.innerHTML = `
    <h2>${medal(t)} ${escapeHtml(displayName(t))}</h2>
    <p class="detail-desc">${escapeHtml(displayDescription(t))}</p>
    <p class="detail-meta">${detailMeta(t)}</p>
    ${roadmapStage(t.id) ? `<p class="detail-stage">Roadmap: ${escapeHtml(roadmapStage(t.id))}</p>` : ''}
    ${t.missable ? '<p class="badge missable big">Missable — do this one early</p>' : ''}
    <h3>Guide</h3>
    <p>${escapeHtml(t.guide)}</p>
    <h3>Sources</h3>
    <p class="sources">${escapeHtml(t.sources)}</p>
    <button type="button" class="earn-btn" data-earned="${t.id}">${earned ? 'Mark as not earned' : 'Mark as earned'}</button>`;
}

const ROADMAP = [
  { stage: 'Stage 1 — Story first', trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    text: 'Play the main missions in order. The chapter trophies (Chapters 1–4 and the final mission) and the named mission trophies all pop as the story moves. Nothing here can be missed, and finishing the story opens free roam for everything else.' },
  { stage: 'Stage 2 — Missables, while the story is still open', trophies: [33, 34, 37, 39, 44, 46, 49, 51],
    text: 'Do the eight flagged trophies before the final mission: the two partner trophies, the airport departure, the quiet jewelry-store robbery, the Ocean Beach cocktail, the bowling alley, and the two that need the right moment (a failed-then-won retry, and a melee drive-by). See the Missables page for each one.' },
  { stage: 'Stage 3 — Side strands and the open world', trophies: [22, 23, 24, 25, 26, 27, 28, 29, 43, 45, 47, 48, 50],
    text: 'Clear the five character strands (Andy, Kenton, Billy, Randy, Tyrone), finish 8 stranger strands, meditate at all 18 spots, hunt Bret\'s unique animal, rob one illegal operation per gang, and let the odd encounters find you. Most of this is best done between story chapters, when you want a break from the main missions.' },
  { stage: 'Stage 4 — Activities and collections', trophies: [15, 16, 17, 18, 19, 20, 21, 30, 31, 32, 35, 36, 38, 40, 41, 42, 55],
    text: 'Sample all 9 activity types, then work the long counts: 250 stunts, 20 different race wins, 14 drone-race locations, 50 challenges, 100 vehicles discovered, 10 registered to Scooter Bros, 3 card sets, 100 WAiNK check-ins, and all 52 areas of Leonida. The shooting range — gold in all 42 challenges — is the longest single grind; save it for last in this stage.' },
  { stage: 'Stage 5 — Money, then the platinum', trophies: [52, 53, 54, 14, 1],
    text: 'Launder $250,000 of Marked Bills, spend $100,000 across the shops, and buy all 8 garage properties. When the stats page reads 100% completion, the gold for A Long Road pops — and with it, the platinum, Vice Got a Price!' },
];

function renderRoadmap() {
  $('#roadmap').innerHTML = ROADMAP.map((s) => {
    const done = s.trophies.filter((id) => state.earned[id]).length;
    const names = s.trophies.map((id) => {
      const t = trophies.find((x) => x.id === id);
      return t ? `<li class="${isEarned(t) ? 'done' : ''}">${escapeHtml(t.name)}</li>` : '';
    }).join('');
    return `<li class="stage"><h3>${escapeHtml(s.stage)} <span class="stage-count">${done}/${s.trophies.length}</span></h3>
      <p>${escapeHtml(s.text)}</p><ul class="stage-trophies">${names}</ul></li>`;
  }).join('');
}

function renderMissables() {
  const list = trophies.filter((t) => t.missable);
  $('#missable-list').innerHTML = list.map((t) => `
    <article class="missable-card ${isEarned(t) ? 'earned' : ''}">
      <h3>${medal(t)} ${escapeHtml(t.name)}</h3>
      <p class="detail-desc">${escapeHtml(t.description)}</p>
      <p>${escapeHtml(t.guide)}</p>
      <button type="button" data-earned="${t.id}">${isEarned(t) ? 'Earned ✓' : 'Mark as earned'}</button>
    </article>`).join('');
}

function render() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function showView(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => { v.hidden = v.id !== `view-${name}`; });
  if (location.hash !== `#${name}`) history.replaceState(null, '', `#${name}`);
}

function bindControls() {
  $('#search').value = state.search;
  $('#search').addEventListener('input', (e) => { state.search = e.target.value; saveState(); renderList(); });
  $('#kind-filter').value = state.kind;
  $('#kind-filter').addEventListener('change', (e) => { state.kind = e.target.value; saveState(); renderList(); });
  $('#grade-filter').value = state.grade;
  $('#grade-filter').addEventListener('change', (e) => { state.grade = e.target.value; saveState(); renderList(); });
  $('#spoiler-toggle').checked = state.spoiler;
  $('#spoiler-toggle').addEventListener('change', (e) => { state.spoiler = e.target.checked; saveState(); render(); });
  $('#hide-earned').checked = state.hideEarned;
  $('#hide-earned').addEventListener('change', (e) => { state.hideEarned = e.target.checked; saveState(); renderList(); });
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showView(b.dataset.view)));
  document.addEventListener('click', (e) => {
    const earnedBtn = e.target.closest('[data-earned]');
    if (earnedBtn) { toggleEarned(Number(earnedBtn.dataset.earned)); return; }
    const row = e.target.closest('.trophy');
    if (row) { selectedId = Number(row.dataset.id); renderList(); renderDetail(); }
  });
  $('#export-btn').addEventListener('click', exportBackup);
  $('#import-file').addEventListener('change', importBackup);
  $('#reset-btn').addEventListener('click', () => {
    if (confirm('Clear all earned trophies and settings in this browser?')) {
      state = { earned: {}, spoiler: false, hideEarned: false, kind: 'all', grade: 'all', search: '' };
      selectedId = null;
      saveState();
      bindControlValues();
      render();
    }
  });
}

function bindControlValues() {
  $('#search').value = state.search;
  $('#kind-filter').value = state.kind;
  $('#grade-filter').value = state.grade;
  $('#spoiler-toggle').checked = state.spoiler;
  $('#hide-earned').checked = state.hideEarned;
}

function exportBackup() {
  const blob = new Blob([JSON.stringify({ app: 'leonida-trophy-compass', version: 1, exported: new Date().toISOString(), state }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = $('#export-link');
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function importBackup(e) {
  const file = e.target.files && e.target.files[0];
  const status = $('#import-status');
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const incoming = parsed && parsed.state ? parsed.state : parsed;
    state = normalizeState(incoming);
    saveState();
    bindControlValues();
    render();
    status.textContent = `Imported progress: ${Object.keys(state.earned).length} trophies earned.`;
  } catch {
    status.textContent = 'That file could not be read as a Leonida Trophy Compass backup.';
  }
  e.target.value = '';
}

async function boot() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`could not load ${DATA_URL}: ${res.status}`);
  const data = await res.json();
  trophies = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(trophies) || trophies.length === 0) throw new Error('trophy list is empty');

  // Demo mode (?demo=1) seeds a sample playthrough for screenshots and
  // first-run previews; it only fills an empty save, never overwrites one.
  if (params.get('demo') === '1' && Object.keys(state.earned).length === 0) {
    DEMO_EARNED.forEach((id) => { state.earned[id] = true; });
    saveState();
  }
  if (params.get('spoiler') === '1') state.spoiler = true;
  const preselect = Number(params.get('trophy'));
  selectedId = trophies.some((t) => t.id === preselect) ? preselect : (params.get('demo') === '1' ? 17 : null);

  bindControls();
  render();
  const hash = (location.hash || '#checklist').slice(1);
  showView(['checklist', 'roadmap', 'missables', 'save'].includes(hash) ? hash : 'checklist');
  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (['checklist', 'roadmap', 'missables', 'save'].includes(h)) showView(h);
  });
}

boot().catch((err) => {
  listEl.innerHTML = `<li class="empty">The trophy list could not be loaded (${escapeHtml(err.message)}). Open this guide from its own folder or a local server so data/trophies.json can be read.</li>`;
});
