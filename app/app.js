// Leonida Trophy Compass — offline GTA VI trophy tracker.
// Data ships with the app in data/trophies.json; nothing is fetched from the
// network. Progress lives in localStorage; a share link carries it in ?earned=.

const STORAGE_KEY = 'leonida-trophy-compass-v1';
const POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABEL = {
  story: 'Story', stranger: 'Strangers', activity: 'Activity',
  collectible: 'Collectible', combat: 'Combat', crime: 'Crime',
  exploration: 'Exploration', money: 'Money', completion: 'Completion',
  misc: 'Other', platinum: 'Platinum',
};

const SOURCES = [
  ['PowerPyx', 'GTA 6 Trophy Guide & Roadmap — difficulty 4/10, about 200 hours, one playthrough; the only possibly missable trophy.', ''],
  ['GameMapa', 'All 55 GTA 6 Trophies — the platinum at a glance, the three-step roadmap, the one trophy you might miss.', 'https://gamemapa.com/en/gta-6/guides/gta-6-trophy-achievement-list/'],
  ['EGamers', 'GTA 6 Trophy List: All 55 Trophies — hidden/visible split, the missable question, which steps are unconfirmed.', 'https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/'],
  ['Vice City Hustle', 'GTA 6 Trophy List: All 55 Trophies — the one missable, 100% thresholds, stunt and meditation counts.', 'https://www.vicecityhustle.com/guides/gta-6-trophy-list-all-55-trophies'],
  ['Push Square', 'GTA 6: Trophy Guide & Roadmap (WIP) — the full list with per-trophy notes.', 'https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap'],
  ['Insider Gaming', 'Complete GTA 6 Trophy List — non-hidden and hidden tables.', 'https://insider-gaming.com/complete-gta-6-trophy-list-how-to-get-all-trophies-achievements/'],
  ['Mobalytics', 'Grand Theft Auto 6 — Full Trophy List & Walkthrough — one possible missable; free roam after the story.', 'https://mobalytics.gg/gamebase/guides/grand-theft-auto-6-all-trophies'],
  ['GTABase', 'Achievement and trophy lists; reported steps for Catch Me If You Can, Challenging Tank, Personal Best and Actions Speak Louder (via EGamers).', ''],
  ['games.gg', 'GTA 6 Trophy List — VCIA jet at terminals E3/E4; 500 profile actions for Actions Speak Louder.', 'https://games.gg/grand-theft-auto-vi/guides/complete-grand-theft-auto-6-trophy-list/'],
  ['TrueAchievements', 'Grand Theft Auto VI Achievements — the 55 achievements, 1,000 Gamerscore.', 'https://www.trueachievements.com/game/Grand-Theft-Auto-VI/achievements'],
  ['GTA Vibes', 'GTA 6 Trophy List — story, side-mission, crime and 100% groupings.', 'https://www.gtavibes.com/guides/gta-6-trophy-list-achievements'],
  ['TechWiser', 'Stranger mission chains have windows tied to story progress (via EGamers).', ''],
];

const UNCONFIRMED = [
  ['In The Beginning…', 'Which Ocean Beach bar counts is not yet known (PowerPyx, via EGamers).'],
  ['Capital Offense', 'GTABase thinks it is crashing a car out through a showroom window — unconfirmed (EGamers).'],
  ['Bad Luck, I Guess', 'The exact trigger is not yet known (PowerPyx, via EGamers).'],
  ['The Truth Is Out There', 'GTABase thinks it is a strange event somewhere in Leonida — unconfirmed (EGamers).'],
  ['Ten Pin', 'The exact melee drive-by setup is not yet known (PowerPyx, via EGamers).'],
  ['Fair Game', 'Which animal Bret wants is unconfirmed (EGamers).'],
  ['Personal Best', 'GTABase reports maxing Strength for both characters — a single source.'],
  ['Actions Speak Louder', 'GTABase reports 500 Criminal Profile actions — a single source.'],
  ['Positive Mental Attitude', 'Whether the Chapter 1 balcony meditation is required is unconfirmed — do it anyway.'],
];

const ROADMAP = [
  ['Stage 1 — Story first, one playthrough', '60–80 hours',
   'Play the five chapters and finish the 12 story trophies. In Chapter 1, follow Lucia to the balcony at Jason’s house one morning and accept the meditation prompt — the one possibly missable trophy. Take stranger missions when they appear, scan new vehicles with WAiNK It and try each activity once. Keep a manual save at the start and end of every chapter: there is no mission replay. Keep cheats off; they disable trophies and saving.'],
  ['Stage 2 — The 100% checklist', 'about 100 hours',
   'After the story, the checklist opens under Progress, then Stats, then 100% Completion. It is lenient — PowerPyx puts it at roughly 60% of true completion: most side quests are not required and collectibles only partly. It asks for 300 stunts and 15 of the 18 meditation spots, so even a missed Chapter 1 meditation cannot cost you this trophy. Work the checklist in free roam, using the Progress menu to see what is left.'],
  ['Stage 3 — Strangers & cleanup', 'about 10 hours',
   'Finish the 8 stranger mission strands — they are not part of the 100% checklist, so they are easy to leave behind. Then clean up whatever is left on the list: cards, garages, the last races and robberies. The platinum pops the moment the last of the other 54 is earned.'],
];

let data = null;
let trophies = [];
const state = {
  earned: new Set(),
  spoiler: false,
  filter: 'all',
  grade: 'all',
  kind: 'all',
  sort: 'default',
  query: '',
  detailId: null,
  view: 'checklist',
};

const $ = (id) => document.getElementById(id);

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) saved.earned.forEach((id) => state.earned.add(id));
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  } catch { /* a corrupt save is ignored; the list still renders */ }
}

function saveStored() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...state.earned], spoiler: state.spoiler }));
  } catch { /* private mode: progress just does not persist */ }
}

function readParams() {
  const p = new URLSearchParams(location.search);
  if (p.get('view')) state.view = p.get('view');
  if (p.get('grade')) state.grade = p.get('grade');
  if (p.get('kind')) state.kind = p.get('kind');
  if (p.get('q')) state.query = p.get('q');
  if (p.get('spoiler') === 'on') state.spoiler = true;
  if (p.get('open')) state.detailId = Number(p.get('open'));
  if (p.get('earned')) {
    p.get('earned').split(',').map(Number).filter((n) => Number.isInteger(n))
      .forEach((id) => state.earned.add(id));
  }
}

function trophyHidden(t) {
  return state.spoiler && t.hidden && !state.earned.has(t.id);
}

function visibleTrophies() {
  const q = state.query.trim().toLowerCase();
  let list = trophies.filter((t) => {
    if (state.grade !== 'all' && t.grade !== state.grade) return false;
    if (state.kind !== 'all' && t.kind !== state.kind) return false;
    if (state.filter === 'missable' && !t.missable) return false;
    if (state.filter === 'hidden' && !t.hidden) return false;
    if (state.filter === 'earned' && !state.earned.has(t.id)) return false;
    if (state.filter === 'remaining' && state.earned.has(t.id)) return false;
    if (q) {
      if (trophyHidden(t)) return false;
      const hay = `${t.name} ${t.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  if (state.sort === 'grade') {
    list = [...list].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name));
  } else if (state.sort === 'name') {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  }
  return list;
}

function pointsEarned() {
  return trophies.reduce((sum, t) => sum + (state.earned.has(t.id) ? POINTS[t.grade] : 0), 0);
}

function pointsTotal() {
  return trophies.reduce((sum, t) => sum + POINTS[t.grade], 0);
}

function renderProgress() {
  const n = state.earned.size;
  const total = trophies.length;
  $('progress-fill').style.width = total ? `${Math.round((n / total) * 100)}%` : '0%';
  $('progress-text').textContent = `${n} of ${total} earned · ${pointsEarned()} of ${pointsTotal()} PSN points`;
  $('grade-counts').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => {
      const got = trophies.filter((t) => t.grade === g && state.earned.has(t.id)).length;
      const all = trophies.filter((t) => t.grade === g).length;
      return `${got}/${all} ${g}`;
    }).join(' · ');
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderList() {
  const list = visibleTrophies();
  const box = $('trophy-list');
  box.replaceChildren();
  $('result-count').textContent = `Showing ${list.length} of ${trophies.length} trophies`;
  for (const t of list) {
    const hidden = trophyHidden(t);
    const card = el('article', 'trophy-card' + (state.earned.has(t.id) ? ' is-earned' : ''));
    const check = el('input');
    check.type = 'checkbox';
    check.checked = state.earned.has(t.id);
    check.setAttribute('aria-label', `Mark ${hidden ? 'hidden trophy' : t.name} as earned`);
    check.addEventListener('change', () => {
      if (check.checked) state.earned.add(t.id);
      else state.earned.delete(t.id);
      saveStored();
      renderProgress();
      renderList();
      if (state.detailId === t.id) renderDetail();
    });
    const main = el('div', 'trophy-main');
    const name = el('h3', 'trophy-name', hidden ? 'Hidden trophy — earn it to reveal' : t.name);
    const desc = el('p', 'trophy-desc', hidden ? 'A story trophy. Its name and description stay hidden until you earn it.' : t.description);
    const meta = el('p', 'trophy-meta');
    const grade = el('span', `grade-badge grade-${t.grade}`, t.grade);
    meta.append(grade, document.createTextNode(` · ${KIND_LABEL[t.kind] ?? t.kind} · difficulty ${t.difficulty}/5 · ${t.time}`));
    if (t.missable) meta.append(document.createTextNode(' · '), el('span', 'missable-flag', 'POSSIBLY MISSABLE'));
    if (t.hidden && !hidden) meta.append(document.createTextNode(' · '), el('span', 'hidden-flag', 'hidden'));
    const guideBtn = el('button', 'guide-button', 'Read the guide');
    guideBtn.type = 'button';
    guideBtn.addEventListener('click', () => { state.detailId = t.id; renderDetail(); });
    main.append(name, desc, meta, guideBtn);
    card.append(check, main);
    box.append(card);
  }
  if (!list.length) box.append(el('p', 'loading', 'No trophies match these filters.'));
}

function renderDetail() {
  const body = $('detail-body');
  body.replaceChildren();
  const t = trophies.find((x) => x.id === state.detailId);
  if (!t) {
    body.append(el('p', 'detail-empty', 'Select a trophy to read its guide, steps and sources.'));
    return;
  }
  const hidden = trophyHidden(t);
  body.append(el('h3', 'detail-name', hidden ? 'Hidden trophy' : t.name));
  body.append(el('p', 'detail-desc', hidden ? 'Its name and description stay hidden until you earn it.' : t.description));
  const meta = el('p', 'detail-meta', `${t.grade} · ${KIND_LABEL[t.kind] ?? t.kind} · difficulty ${t.difficulty}/5 · ${t.time}`);
  body.append(meta);
  if (t.missable && t.missable_note) {
    body.append(el('p', 'detail-missable', `Missable: ${t.missable_note}`));
  }
  if (!hidden) {
    body.append(el('p', 'detail-guide', t.guide));
    const steps = el('ol', 'detail-steps');
    t.steps.forEach((s) => steps.append(el('li', null, s)));
    body.append(el('h4', null, 'Steps'), steps);
    const src = el('ul', 'detail-sources');
    t.sources.forEach((s) => src.append(el('li', null, s)));
    body.append(el('h4', null, 'Sources'), src);
  } else {
    body.append(el('p', 'detail-guide', 'Earn this trophy to reveal its guide.'));
  }
}

function renderRoadmap() {
  const p = data.platinum;
  $('roadmap-intro').textContent =
    `One playthrough is enough. PowerPyx rates the platinum ${p.difficulty} and ${p.time}; there are no online trophies and no mission replay, so keep a manual save at the start and end of each chapter. ${p.cheats}.`;
  const ol = $('roadmap-steps');
  ol.replaceChildren();
  for (const [title, hours, text] of ROADMAP) {
    const li = el('li', 'roadmap-step');
    li.append(el('h3', null, `${title} — ${hours}`), el('p', null, text));
    ol.append(li);
  }
}

function renderMissables() {
  const banner = $('missable-banner');
  banner.replaceChildren();
  const t = trophies.find((x) => x.missable);
  const strong = el('strong', null, 'Positive Mental Attitude');
  const p1 = el('p', null, '');
  p1.append(strong, document.createTextNode(' (meditate at every spot) is the only trophy the guides flag as possibly missable. During Chapter 1, one morning at Jason’s house, Lucia meditates on the balcony — follow her and accept the prompt. That meditation is gone after Chapter 1, and nobody has confirmed whether the trophy requires it, so do it. The 100% checklist only asks for 15 of the 18 spots.'));
  banner.append(p1);
  const steps = el('ol', 'detail-steps');
  t.steps.forEach((s) => steps.append(el('li', null, s)));
  banner.append(steps);
  const src = el('p', 'detail-meta', `Sources: ${t.sources.join(', ')}`);
  banner.append(src);

  const watch = $('watch-list');
  watch.replaceChildren();
  [
    'Stranger mission strands follow story progress — take a stranger’s missions when they appear instead of leaving them all to the end (TechWiser).',
    'Kenton goes quiet for a while mid-game; his missions come back (GameMapa).',
    'Some optional missions expire, and a few fences disappear for good (GameMapa).',
    'The last meditation spot needs Jason and Lucia playable together, which opens after Chapter 2 (Vice City Hustle).',
  ].forEach((s) => watch.append(el('li', null, s)));
  $('cannot-miss').textContent =
    'Everything else can be finished after the story: every story trophy, the 100% checklist, all the counters and all the stranger strands. Every character tied to a trophy is still around in free roam after the ending, and Jason and Lucia’s relationship does not matter (GameMapa). One thing to avoid is the Irredeemable criminal profile: it is permanent and makes the police more aggressive.';
}

function renderSources() {
  const list = $('source-list');
  list.replaceChildren();
  for (const [name, note, url] of SOURCES) {
    const li = el('li');
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = name;
      a.rel = 'noopener';
      li.append(a, document.createTextNode(` — ${note}`));
    } else {
      li.append(el('strong', null, name), document.createTextNode(` — ${note}`));
    }
    list.append(li);
  }
  const unc = $('unconfirmed-list');
  unc.replaceChildren();
  UNCONFIRMED.forEach(([name, note]) => {
    const li = el('li');
    li.append(el('strong', null, name), document.createTextNode(` — ${note}`));
    unc.append(li);
  });
}

function setView(view) {
  state.view = view;
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach((s) => { s.hidden = s.id !== `view-${view}`; });
}

function bindControls() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $('search-input').value = state.query;
  $('search-input').addEventListener('input', (e) => { state.query = e.target.value; renderList(); });
  $('grade-select').value = state.grade;
  $('grade-select').addEventListener('change', (e) => { state.grade = e.target.value; renderList(); });
  $('kind-select').value = state.kind;
  $('kind-select').addEventListener('change', (e) => { state.kind = e.target.value; renderList(); });
  $('sort-select').value = state.sort;
  $('sort-select').addEventListener('change', (e) => { state.sort = e.target.value; renderList(); });
  $('spoiler-toggle').checked = state.spoiler;
  $('spoiler-toggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveStored();
    renderList();
    renderDetail();
  });
  document.querySelectorAll('#filter-chips .chip').forEach((b) => b.addEventListener('click', () => {
    state.filter = b.dataset.filter;
    document.querySelectorAll('#filter-chips .chip').forEach((c) => c.classList.toggle('is-active', c === b));
    renderList();
  }));
  $('share-button').addEventListener('click', async () => {
    const url = new URL(location.href);
    url.searchParams.set('earned', [...state.earned].sort((a, b) => a - b).join(','));
    try {
      await navigator.clipboard.writeText(url.toString());
      $('share-button').textContent = 'Link copied';
      setTimeout(() => { $('share-button').textContent = 'Copy share link'; }, 2000);
    } catch { /* clipboard unavailable: the link is still in the address bar */ }
  });
  $('export-button').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...state.earned].sort((x, y) => x - y) })], { type: 'application/json' }));
    a.download = 'gta6-trophy-progress.json';
    a.click();
  });
  $('import-button').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (Array.isArray(ids)) {
        state.earned = new Set(ids.filter((n) => Number.isInteger(n) && n >= 1 && n <= trophies.length));
        saveStored();
        renderProgress();
        renderList();
        renderDetail();
      }
    } catch { /* a bad file changes nothing */ }
  });
  $('reset-button').addEventListener('click', () => {
    state.earned.clear();
    saveStored();
    renderProgress();
    renderList();
    renderDetail();
  });
}

async function init() {
  const res = await fetch('data/trophies.json');
  data = await res.json();
  trophies = data.trophies;
  loadStored();
  readParams();
  bindControls();
  setView(['checklist', 'roadmap', 'missables', 'sources'].includes(state.view) ? state.view : 'checklist');
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
  renderSources();
  // Screenshot harness hook: signals that the first render is done.
  window.__shotReady = true;
}

init();
