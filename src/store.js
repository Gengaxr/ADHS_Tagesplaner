const KEY = 'planer.v1';

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function load(storage) {
  try {
    const raw = storage?.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && Array.isArray(data.tasks) && Array.isArray(data.anchors)) {
      data.templates = data.templates && typeof data.templates === 'object' ? data.templates : {};
      data.log = Array.isArray(data.log) ? data.log : [];
      return data;
    }
  } catch {
    // kaputte oder nicht lesbare Daten: mit leerem Stand weitermachen
  }
  return { tasks: [], anchors: [], templates: {}, log: [] };
}

/** Speichert Aufgaben und Anker; ohne nutzbaren Speicher bleibt alles im Arbeitsspeicher. */
export function createStore(storage) {
  const data = load(storage);
  const save = () => {
    try {
      storage?.setItem(KEY, JSON.stringify(data));
    } catch {
      // Speicher voll oder gesperrt (privater Modus): im Arbeitsspeicher weiter
    }
  };

  return {
    getTasks: (date) => data.tasks.filter((t) => t.date === date),
    addTask({ title, minutes, firstStep, date }) {
      const task = { id: newId(), title, minutes, done: false, date };
      if (firstStep) task.firstStep = firstStep;
      data.tasks.push(task);
      save();
      return task;
    },
    setDone(id, done) {
      const t = data.tasks.find((x) => x.id === id);
      if (t) t.done = done;
      save();
    },
    moveTask(id, date) {
      const t = data.tasks.find((x) => x.id === id);
      if (t) t.date = date;
      save();
    },
    removeTask(id) {
      data.tasks = data.tasks.filter((t) => t.id !== id);
      save();
    },
    getAnchors: () => data.anchors.slice(),
    addAnchor({ title, time, minutes, days }) {
      const anchor = { id: newId(), title, time, minutes, days };
      data.anchors.push(anchor);
      save();
      return anchor;
    },
    removeAnchor(id) {
      data.anchors = data.anchors.filter((a) => a.id !== id);
      save();
    },
    getLog: () => data.log.slice(),
    addLog(entry) {
      data.log.push(entry);
      save();
    },
    getTemplates: () => ({ ...data.templates }),
    setTemplate(name, zones) {
      data.templates[name] = zones;
      save();
    },
    resetTemplate(name) {
      delete data.templates[name];
      save();
    },
    exportJson: () =>
      JSON.stringify({ version: 1, tasks: data.tasks, anchors: data.anchors, templates: data.templates, log: data.log }, null, 2),
  };
}
