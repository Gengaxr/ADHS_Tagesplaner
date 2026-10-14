import { parseEventsParam } from './bridge.js';
import { buildBriefing } from './briefing.js';
import { createStore } from './store.js';
import { fetchWeather } from './weather.js';
import { toSpeechText, speak, pickGermanVoice } from './speech.js';
import { createTimer, remainingMs, formatMmSs } from './timer.js';

const $ = (id) => document.getElementById(id);
const DAY_NAMES = [['Mo', 1], ['Di', 2], ['Mi', 3], ['Do', 4], ['Fr', 5], ['Sa', 6], ['So', 0]];
const params = new URLSearchParams(location.search);

function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}

function safeStorage() {
  try {
    const s = window.localStorage;
    s.setItem('planer.probe', '1');
    s.removeItem('planer.probe');
    return s;
  } catch {
    return null;
  }
}

const storage = safeStorage();
const store = createStore(storage);
const read = (k) => { try { return storage?.getItem(k) ?? null; } catch { return null; } };
const write = (k, v) => { try { storage?.setItem(k, v); } catch { /* ohne Speicher weiter */ } };

const pad = (n) => String(n).padStart(2, '0');
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clock = () => params.get('now') || `${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`;
const today = () => params.get('date') || isoDate(new Date());
const tomorrow = () => {
  const d = new Date(`${today()}T12:00:00`);
  d.setDate(d.getDate() + 1);
  return isoDate(d);
};

const state = { weather: null, events: parseEventsParam(location.search), timer: null, tick: null, lastBriefing: null };

function currentBriefing() {
  return buildBriefing({
    name: read('planer.name') || '',
    date: today(),
    now: clock(),
    events: state.events,
    tasks: store.getTasks(today()),
    anchors: store.getAnchors(),
    weather: state.weather,
  });
}

function renderBand(b) {
  const band = $('band');
  band.replaceChildren();
  for (const i of b.timeline) {
    const li = el('li', null, `kind-${i.kind}`);
    li.append(el('time', i.allDay ? 'ganztags' : i.start));
    const pill = el('div', i.title, 'pill');
    if (i.minutes && i.kind !== 'free') pill.append(el('small', `${i.minutes} Min`));
    li.append(pill);
    band.append(li);
  }
  $('emptyNote').textContent = b.emptyNote || '';
  $('moreLine').textContent = b.moreCount > 0 ? `+ ${b.moreCount} weitere ${b.moreCount === 1 ? 'Aufgabe' : 'Aufgaben'}, die heute noch warten dürfen` : '';
}

function stopTimer() {
  clearInterval(state.tick);
  state.tick = null;
  state.timer = null;
}

function renderStep(b) {
  const body = $('stepBody');
  body.replaceChildren();
  const doneCount = store.getTasks(today()).filter((t) => t.done).length;
  $('doneCount').textContent = doneCount > 0 ? `Heute geschafft: ${doneCount}` : '';
  const card = el('div', null, 'card');
  if (!b.firstStep) {
    card.append(el('p', doneCount > 0 ? 'Alles erledigt, was du dir vorgenommen hast.' : 'Gerade ist nichts dran. Du kannst unten etwas eintragen.', 'what'));
    body.append(card);
    return;
  }
  const open = store.getTasks(today()).filter((t) => !t.done);
  card.append(el('p', b.firstStep.title, 'what'));
  if (!state.timer) {
    card.append(el('p', `${b.firstStep.minutes} Minuten, nur das`, 'dur'));
    const start = el('button', 'Timer starten', 'primary');
    start.type = 'button';
    start.addEventListener('click', () => startTimer(b.firstStep));
    card.append(start);
  } else {
    const count = el('p', formatMmSs(remainingMs(state.timer, Date.now())), 'count');
    count.id = 'countdown';
    count.setAttribute('role', 'timer');
    card.append(count);
    const done = el('button', 'Fertig', 'primary');
    done.type = 'button';
    done.addEventListener('click', () => {
      store.setDone(b.firstStep.taskId, true);
      stopTimer();
      render();
    });
    card.append(done);
  }
  if (open[1]) card.append(el('p', `Danach: ${open[1].title}`, 'next'));
  body.append(card);
}

function startTimer(step) {
  state.timer = createTimer(step.minutes, Date.now());
  state.tick = setInterval(() => {
    const c = $('countdown');
    if (!c) return;
    const left = remainingMs(state.timer, Date.now());
    c.textContent = left > 0 ? formatMmSs(left) : 'Zeit ist um. Fertig oder noch ein bisschen?';
    if (left === 0) clearInterval(state.tick);
  }, 500);
  render();
}

function listItem(text, onRemove, check) {
  const li = el('li');
  if (check) li.append(check);
  li.append(el('span', text));
  const rm = el('button', 'Entfernen');
  rm.type = 'button';
  rm.setAttribute('aria-label', `${text} entfernen`);
  rm.addEventListener('click', onRemove);
  li.append(rm);
  return li;
}

function renderLists() {
  const tl = $('taskList');
  tl.replaceChildren();
  const rows = [[today(), 'heute'], [tomorrow(), 'morgen']].flatMap(([d, label]) =>
    store.getTasks(d).map((t) => ({ t, label })));
  if (!rows.length) tl.append(el('li', 'Noch keine Aufgaben.', 'empty'));
  for (const { t, label } of rows) {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = t.done;
    box.setAttribute('aria-label', `${t.title} erledigt`);
    box.addEventListener('change', () => { store.setDone(t.id, box.checked); render(); });
    tl.append(listItem(`${t.title} (${t.minutes} Min, ${label})`, () => { store.removeTask(t.id); render(); }, box));
  }
  const al = $('anchorList');
  al.replaceChildren();
  const anchors = store.getAnchors();
  if (!anchors.length) al.append(el('li', 'Noch keine Anker.', 'empty'));
  for (const a of anchors) {
    const days = DAY_NAMES.filter(([, n]) => a.days.includes(n)).map(([s]) => s).join(' ');
    al.append(listItem(`${a.time} ${a.title} (${a.minutes} Min, ${days})`, () => { store.removeAnchor(a.id); render(); }));
  }
}

function render() {
  const b = currentBriefing();
  state.lastBriefing = b;
  $('dateLabel').textContent = b.dateLabel;
  $('greeting').textContent = b.greeting;
  $('weatherLine').textContent = b.weatherLine || '';
  renderBand(b);
  renderStep(b);
  renderLists();
}

function setupForms() {
  const days = $('days');
  for (const [label, n] of DAY_NAMES) {
    const l = el('label');
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.name = 'day';
    c.value = String(n);
    c.checked = true;
    l.append(c, document.createTextNode(label));
    days.append(l);
  }
  $('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    store.addTask({
      title: String(f.get('title')).trim(),
      minutes: Number(f.get('minutes')) || 10,
      firstStep: String(f.get('firstStep') || '').trim() || undefined,
      date: f.get('when') === 'tomorrow' ? tomorrow() : today(),
    });
    e.target.reset();
    render();
  });
  $('anchorForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const chosen = f.getAll('day').map(Number);
    store.addAnchor({
      title: String(f.get('title')).trim(),
      time: String(f.get('time')),
      minutes: Number(f.get('minutes')) || 30,
      days: chosen.length ? chosen : [0, 1, 2, 3, 4, 5, 6],
    });
    e.target.reset();
    for (const c of days.querySelectorAll('input')) c.checked = true;
    render();
  });
  const nameInput = $('nameForm').elements.name;
  nameInput.value = read('planer.name') || '';
  $('nameForm').addEventListener('submit', (e) => {
    e.preventDefault();
    write('planer.name', nameInput.value.trim());
    render();
  });
  setupVoices();
  $('exportBtn').addEventListener('click', () => {
    const box = $('exportBox');
    box.hidden = false;
    box.value = store.exportJson();
    box.select();
  });
  $('speakBtn').addEventListener('click', async () => {
    const hint = $('speakHint');
    hint.textContent = '';
    const result = await speak(toSpeechText(state.lastBriefing), undefined, undefined, undefined, read('planer.voice') || '');
    if (result === 'blocked') hint.textContent = 'Nichts zu hören? Prüfe, ob dein iPhone stumm geschaltet ist, und die Lautstärke.';
    if (result === 'unsupported') hint.textContent = 'Dieser Browser kann nicht vorlesen.';
  });
}

function setupVoices() {
  const select = $('voiceSelect');
  let found = 0;
  const fill = () => {
    const synth = window.speechSynthesis;
    const all = synth?.getVoices?.() ?? [];
    const de = all.filter((v) => /^de([-_]|$)/i.test(v.lang ?? ''));
    const list = de.length ? de : all;
    if (list.length === found) return;
    found = list.length;
    const wanted = read('planer.voice') || pickGermanVoice(all)?.name || '';
    select.replaceChildren();
    for (const v of list) {
      const o = el('option', de.length ? v.name : `${v.name} (${v.lang})`);
      o.value = v.name;
      o.selected = v.name === wanted;
      select.append(o);
    }
    $('voiceInfo').textContent = !all.length
      ? 'Dein Browser meldet noch keine Stimmen. Das kann einige Sekunden dauern.'
      : de.length
        ? `${de.length} deutsche Stimmen gefunden (von ${all.length} insgesamt). Bessere Stimmen lädst du in den iPhone-Einstellungen unter Bedienungshilfen, Gesprochene Inhalte, Stimmen.`
        : `Keine deutsche Stimme gefunden, es werden alle ${all.length} Stimmen gezeigt.`;
  };
  fill();
  // iOS meldet Stimmen oft verspätet und ohne "voiceschanged": ein paar Mal nachfragen
  let tries = 0;
  const poll = setInterval(() => {
    fill();
    if (++tries >= 20) clearInterval(poll);
  }, 500);
  window.speechSynthesis?.addEventListener?.('voiceschanged', fill);
  select.addEventListener('pointerdown', fill);
  $('voiceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    write('planer.voice', select.value);
    $('voiceInfo').textContent = 'Gespeichert.';
  });
  $('voiceTest').addEventListener('click', () => {
    speak('Guten Morgen. So klingt diese Stimme.', undefined, undefined, undefined, select.value);
  });
}

function locate() {
  const saved = read('planer.loc');
  if (saved) {
    const [lat, lon] = saved.split(',').map(Number);
    loadWeather(lat, lon);
  }
  navigator.geolocation?.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      write('planer.loc', `${latitude.toFixed(2)},${longitude.toFixed(2)}`);
      loadWeather(latitude, longitude);
    },
    () => {},
    { timeout: 6000, maximumAge: 3600000 },
  );
}

async function loadWeather(lat, lon) {
  const w = await fetchWeather(lat, lon, today());
  if (w) {
    state.weather = w;
    render();
  }
}

if (window.navigator.standalone === true) {
  $('ctxHint').textContent =
    'Das ist die Home-Bildschirm-App. Sie hat einen eigenen Speicher, getrennt von Safari. Der Wecker öffnet Safari und sieht diese Aufgaben nicht. Lege das Symbol neu an und schalte dabei "Als Web-App öffnen" aus.';
}

setupForms();
render();
locate();
