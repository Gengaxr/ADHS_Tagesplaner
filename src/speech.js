const clean = (s) => String(s).replace(/[!|]/g, ' ').replace(/\s+/g, ' ').trim();
const hour = (hhmm) => Number(hhmm.slice(0, 2));

function weatherSentence(line) {
  const m = /^(-?\d+)°, (.*)$/.exec(line);
  if (!m) return null;
  return `Draußen sind es ${m[1]} Grad, ${m[2]}.`;
}

function itemSentence(i) {
  if (i.kind === 'task') return `${clean(i.title)}, ${i.minutes} Minuten`;
  if (i.kind === 'event') return `um ${hour(i.start)} Uhr ${clean(i.title)}`;
  if (i.kind === 'anchor') return `um ${hour(i.start)} Uhr ${clean(i.title)}`;
  return null;
}

/** Baut den gesprochenen Text: kurz, duzend, ohne Ausrufezeichen. */
export function toSpeechText(b) {
  const parts = [`${clean(b.greeting)}.`];
  if (b.weatherLine) {
    const w = weatherSentence(b.weatherLine);
    if (w) parts.push(w);
  }
  if (b.emptyNote) parts.push(clean(b.emptyNote));

  const spoken = b.timeline.map(itemSentence).filter(Boolean);
  if (spoken.length) parts.push(`Heute steht an: ${spoken.join('; ')}.`);
  if (b.moreCount > 0) parts.push(`Dazu noch ${b.moreCount} weitere.`);
  if (b.firstStep) {
    parts.push(`Dein erster kleiner Schritt: ${clean(b.firstStep.title)}, ${b.firstStep.minutes} Minuten.`);
  }
  return parts.join(' ');
}

const isGerman = (v) => /^de([-_]|$)/i.test(v.lang ?? '');

/** Wählt die gewünschte deutsche Stimme, sonst die natürlichste: Premium, Erweitert/Enhanced, irgendeine. */
export function pickGermanVoice(voices, preferredName) {
  const de = (voices ?? []).filter(isGerman);
  return (
    (preferredName ? de.find((v) => v.name === preferredName) : undefined) ??
    de.find((v) => /premium/i.test(v.name)) ??
    de.find((v) => /erweitert|enhanced/i.test(v.name)) ??
    de[0] ??
    null
  );
}

/** Spricht den Text. Gibt "started", "blocked" (iOS lässt nichts hören) oder "unsupported" zurück. */
export function speak(text, synth = globalThis.speechSynthesis, voices, waitMs = 2000, preferredName = '') {
  if (!synth || typeof synth.speak !== 'function') return Promise.resolve('unsupported');
  return new Promise((resolve) => {
    const u = new globalThis.SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    const voice = pickGermanVoice(voices ?? synth.getVoices?.() ?? [], preferredName);
    if (voice) u.voice = voice;
    let done = false;
    const finish = (r) => {
      if (!done) {
        done = true;
        resolve(r);
      }
    };
    u.onstart = () => finish('started');
    u.onerror = () => finish('blocked');
    synth.cancel();
    synth.speak(u);
    setTimeout(() => finish('blocked'), waitMs);
  });
}
