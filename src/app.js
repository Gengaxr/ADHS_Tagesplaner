import { parseEventsParam } from './bridge.js?v=13';
import { buildBriefing } from './briefing.js?v=13';
import { createStore } from './store.js?v=13';
import { fetchWeather } from './weather.js?v=13';
import { toSpeechText, speak, pickGermanVoice, shortcutSpeakUrl } from './speech.js?v=13';
import { createTimer, remainingMs, formatMmSs } from './timer.js?v=13';
import { buildClosing, isFeierabendTime } from './closing.js?v=13';
import { suggestSplit, parseZones, formatZones, DEFAULT_ROOMS } from './split.js?v=13';
import {
  DEFAULT_VISIT_STEPS, startVisit, currentStep, completeStep, skipStep, msLeft, visitSummary, fitCount, shortcutTimerUrl,
} from './visit.js?v=13';

const $ = (id) => document.getElementById(id);
const DAY_NAMES = [['Mo', 1], ['Di', 2], ['Mi', 3], ['Do', 4], ['Fr', 5], ['Sa', 6], ['So', 0]];
const params = new URLSearchParams(location.search);
const SPEAK_SHORTCUT = 'Briefing vorlesen';

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

const state = { visit: null, visitEnded: false, visitTick: null, view: params.get('feierabend') === '1' ? 'closing' : 'day', weather: null, events: parseEventsParam(location.search), timer: null, tick: null, lastBriefing: null };

// Termine kommen nur über den Kurzbefehl in der Adresse. Für den Tag merken, damit das Symbol sie auch zeigt.
if (params.has('events')) {
  write('planer.events', JSON.stringify({ date: today(), events: state.events }));
} else {
  try {
    const cached = JSON.parse(read('planer.events') || 'null');
    if (cached?.date === today() && Array.isArray(cached.events)) state.events = cached.events;
  } catch {
    // kaputter Zwischenspeicher: ohne Termine weitermachen
  }
}

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

function closingItem(text, buttons, cls) {
  const li = el('li', null, cls);
  li.append(el('span', text));
  for (const [label, fn] of buttons) {
    const b = el('button', label);
    b.type = 'button';
    b.addEventListener('click', fn);
    li.append(b);
  }
  return li;
}

function renderClosing() {
  const c = buildClosing({ date: today(), tomorrow: tomorrow(), tasks: store.getTasks(today()).concat(store.getTasks(tomorrow())), anchors: store.getAnchors() });
  $('closingSummary').textContent = c.summary;
  const done = $('closingDone');
  done.replaceChildren(...c.doneToday.map((t) => closingItem(`${t.title}`, [], 'done')));
  $('closingOpenBox').hidden = c.openToday.length === 0;
  $('closingOpen').replaceChildren(...c.openToday.map((t) => closingItem(t.title, [
    ['Auf morgen', () => { store.moveTask(t.id, tomorrow()); render(); }],
    ['Loslassen', () => { store.removeTask(t.id); render(); }],
  ])));
  const tm = [
    ...c.tomorrowAnchors.map((a) => closingItem(`${a.time} ${a.title}`, [])),
    ...c.tomorrowTasks.map((t) => closingItem(`${t.title} (${t.minutes} Min)`, [['Entfernen', () => { store.removeTask(t.id); render(); }]])),
  ];
  $('closingTomorrow').replaceChildren(...(tm.length ? tm : [el('li', 'Morgen ist noch frei. Das ist okay.', 'empty')]));
  const doneToday = read('planer.feierabend') === today();
  $('closingBye').textContent = doneToday ? 'Gute Nacht. Morgen früh wartet dein Briefing.' : '';
}

function render() {
  const b = currentBriefing();
  const closing = state.view === 'closing';
  const visiting = state.view === 'visit';
  const day = !closing && !visiting;
  $('dayView').hidden = !day;
  $('closingView').hidden = !closing;
  $('visitView').hidden = !visiting;
  $('closingBtn').hidden = !day;
  $('visitBtn').hidden = !day;
  $('speakBtn').hidden = !day;
  $('lateHint').hidden = !day || !isFeierabendTime(clock()) || read('planer.feierabend') === today();
  if (visiting) renderVisit();
  if (closing) renderClosing();
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
    if (read('planer.viaShortcut') === '1') {
      location.href = shortcutSpeakUrl(toSpeechText(state.lastBriefing), SPEAK_SHORTCUT);
      return;
    }
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
  const via = $('viaShortcut');
  via.checked = read('planer.viaShortcut') === '1';
  $('voiceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    write('planer.voice', select.value);
    write('planer.viaShortcut', via.checked ? '1' : '0');
    $('voiceInfo').textContent = 'Gespeichert.';
  });
  $('voiceTest').addEventListener('click', () => {
    if (via.checked) {
      location.href = shortcutSpeakUrl('Guten Morgen. So klingt diese Stimme.', SPEAK_SHORTCUT);
      return;
    }
    speak('Guten Morgen. So klingt diese Stimme.', undefined, undefined, undefined, select.value);
  });
}

function showSplit(box, title, date, after) {
  box.replaceChildren();
  const s = suggestSplit(title, store.getTemplates());
  if (!s) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.append(el('h3', s.generic ? 'Einfache Aufteilung' : `Vorschlag für ${s.name}`));
  if (s.generic) box.append(el('p', 'Dafür gibt es keine Vorlage. So lässt es sich in drei kleine Schritte teilen.', 'note'));
  const list = el('ul', null, 'list');
  const picks = [];
  for (const z of s.zones) {
    const li = el('li');
    const c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = true;
    c.setAttribute('aria-label', z.title);
    picks.push([c, z]);
    li.append(c, el('span', `${z.title} (${z.minutes} Min)`));
    list.append(li);
  }
  const add = el('button', 'Ausgewählte eintragen', 'primary');
  add.type = 'button';
  add.addEventListener('click', () => {
    for (const [c, z] of picks) {
      if (c.checked) store.addTask({ title: s.generic ? z.title : `${s.name}: ${z.title}`, minutes: z.minutes, date });
    }
    box.hidden = true;
    box.replaceChildren();
    after();
  });
  const cancel = el('button', 'Abbrechen');
  cancel.type = 'button';
  cancel.addEventListener('click', () => {
    box.hidden = true;
    box.replaceChildren();
  });
  box.append(list, add, cancel);
}

function setupSplit() {
  $('splitBtn').addEventListener('click', () => {
    const f = $('taskForm').elements;
    showSplit($('splitBox'), f.title.value, f.when.value === 'tomorrow' ? tomorrow() : today(), () => {
      $('taskForm').reset();
      render();
    });
  });
  $('closingSplitBtn').addEventListener('click', () => {
    const f = $('closingAddForm').elements;
    showSplit($('closingSplitBox'), f.title.value, tomorrow(), () => {
      $('closingAddForm').reset();
      render();
    });
  });
  const room = $('zonesRoom');
  const text = $('zonesText');
  const ALL = { ...DEFAULT_ROOMS, Besuch: DEFAULT_VISIT_STEPS };
  for (const name of Object.keys(ALL)) {
    const o = el('option', name === 'Besuch' ? 'Besuch (Reihenfolge)' : name);
    o.value = name;
    room.append(o);
  }
  const load = () => {
    const custom = store.getTemplates()[room.value];
    text.value = formatZones(custom?.length ? custom : ALL[room.value]);
    $('zonesInfo').textContent = custom?.length ? 'Eigene Zonen.' : 'Standardzonen.';
  };
  room.addEventListener('change', load);
  load();
  $('zonesForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const zones = parseZones(text.value);
    if (zones.length) {
      store.setTemplate(room.value, zones);
      $('zonesInfo').textContent = 'Gespeichert.';
    } else {
      store.resetTemplate(room.value);
      load();
    }
  });
  $('zonesReset').addEventListener('click', () => {
    store.resetTemplate(room.value);
    load();
  });
}

function visitSteps() {
  const custom = store.getTemplates().Besuch;
  return custom?.length ? custom : DEFAULT_VISIT_STEPS;
}

function saveVisit() {
  if (state.visit) write('planer.visit', JSON.stringify(state.visit));
  else write('planer.visit', '');
}

function renderVisit() {
  const v = state.visit;
  const phase = !v ? 'choose' : state.visitEnded ? 'summary' : 'run';
  $('visitChoose').hidden = phase !== 'choose';
  $('visitRun').hidden = phase !== 'run';
  $('visitSummary').hidden = phase !== 'summary';
  if (phase === 'choose') {
    const minutes = Number($('visitMinutes').value) || 20;
    const steps = visitSteps();
    const n = fitCount(steps, minutes);
    $('visitFit').textContent = n
      ? `In ${minutes} Minuten schaffst du etwa ${n} ${n === 1 ? 'Schritt' : 'Schritte'}. Du machst immer nur einen auf einmal.`
      : 'Es gibt keine Schritte. Lege unter "Zonen bearbeiten" die Besuch-Reihenfolge an.';
    for (const b of $('visitChips').children) b.setAttribute('aria-pressed', String(Number(b.dataset.m) === minutes));
  }
  if (phase === 'run') {
    updateVisitCountdown();
    const step = currentStep(v);
    if (!step) {
      endVisit();
      return;
    }
    $('visitStep').textContent = step.title;
    $('visitStepMin').textContent = `${step.minutes} Minuten, nur das`;
    const next = v.steps[v.index + 1];
    $('visitNext').textContent = next ? `Danach: ${next.title}` : 'Das ist der letzte Schritt.';
    $('visitProgress').textContent = v.done.length ? `Bisher geschafft: ${v.done.length}` : '';
  }
  if (phase === 'summary') {
    const s = visitSummary(v, Date.now());
    $('visitSummaryText').textContent = s.text;
    $('visitDoneList').replaceChildren(...s.doneTitles.map((t) => closingItem(t, [], 'done')));
    $('visitLeftBox').hidden = s.remainingTitles.length === 0;
    $('visitLeftList').replaceChildren(...s.remainingTitles.map((t) => closingItem(t, [])));
  }
}

function updateVisitCountdown() {
  const v = state.visit;
  if (!v) return;
  const left = msLeft(v, Date.now());
  $('visitCountdown').textContent = left > 0 ? `Besuch in ${formatMmSs(left)}` : 'Die Zeit ist um. Mach fertig, was du gerade tust.';
}

function endVisit() {
  clearInterval(state.visitTick);
  state.visitEnded = true;
  render();
}

function beginVisit(minutes) {
  state.visit = startVisit(Date.now(), minutes, visitSteps());
  state.visitEnded = false;
  saveVisit();
  clearInterval(state.visitTick);
  state.visitTick = setInterval(updateVisitCountdown, 500);
  render();
  const timerUrl = read('planer.visitTimer') === '1' ? shortcutTimerUrl(minutes) : null;
  // Der Kurzbefehl startet den iPhone-Timer und öffnet die Seite danach wieder; der Besuch ist bereits gespeichert
  if (timerUrl) location.href = timerUrl;
}

function leaveVisit() {
  clearInterval(state.visitTick);
  state.visit = null;
  state.visitEnded = false;
  saveVisit();
  state.view = 'day';
  render();
  window.scrollTo(0, 0);
}

function setupVisit() {
  const chips = $('visitChips');
  for (const m of [10, 20, 30, 45, 60]) {
    const b = el('button', `${m} Min`);
    b.type = 'button';
    b.dataset.m = String(m);
    b.addEventListener('click', () => { $('visitMinutes').value = String(m); renderVisit(); });
    chips.append(b);
  }
  $('visitMinutes').addEventListener('input', renderVisit);
  const timerBox = $('visitTimerBox');
  timerBox.checked = read('planer.visitTimer') === '1';
  timerBox.addEventListener('change', () => write('planer.visitTimer', timerBox.checked ? '1' : '0'));
  $('visitBtn').addEventListener('click', () => { state.view = 'visit'; render(); window.scrollTo(0, 0); });
  $('visitBackBtn').addEventListener('click', leaveVisit);
  $('visitAgainBtn').addEventListener('click', leaveVisit);
  $('visitStartBtn').addEventListener('click', () => beginVisit(Math.min(240, Math.max(5, Number($('visitMinutes').value) || 20))));
  $('visitDoneBtn').addEventListener('click', () => { state.visit = completeStep(state.visit); saveVisit(); render(); });
  $('visitSkipBtn').addEventListener('click', () => { state.visit = skipStep(state.visit); saveVisit(); render(); });
  $('visitEndBtn').addEventListener('click', endVisit);
  // Ein laufender Besuch übersteht das Neuladen der Seite
  try {
    const saved = JSON.parse(read('planer.visit') || 'null');
    if (saved && Array.isArray(saved.steps) && Date.now() < saved.endsAt + 30 * 60000) {
      state.visit = saved;
      state.view = 'visit';
      state.visitTick = setInterval(updateVisitCountdown, 500);
    }
  } catch {
    // kaputter Stand: ignorieren
  }
  const direct = Number(params.get('besuch'));
  if (direct >= 5 && direct <= 240) {
    state.view = 'visit';
    beginVisit(direct);
  }
}

function setupClosing() {
  const open = () => { state.view = 'closing'; render(); window.scrollTo(0, 0); };
  $('closingBtn').addEventListener('click', open);
  $('lateBtn').addEventListener('click', open);
  $('closingBackBtn').addEventListener('click', () => { state.view = 'day'; render(); window.scrollTo(0, 0); });
  $('closingDoneBtn').addEventListener('click', () => { write('planer.feierabend', today()); render(); });
  $('closingAddForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    store.addTask({ title: String(f.get('title')).trim(), minutes: Number(f.get('minutes')) || 10, date: tomorrow() });
    e.target.reset();
    render();
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
setupSplit();
setupClosing();
setupVisit();
render();
locate();
