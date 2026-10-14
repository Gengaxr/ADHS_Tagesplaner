const DEFAULT_MINUTES = 10;
const MAX_MINUTES = 60;

/** Standardzonen je Raum, jede Zone ist ein überschaubares Stück von höchstens 10 Minuten. */
export const DEFAULT_ROOMS = {
  Wohnzimmer: [
    { title: 'Müll und Geschirr einsammeln', minutes: 5 },
    { title: 'Couch ordnen, Decken und Kissen', minutes: 5 },
    { title: 'Couchtisch freiräumen', minutes: 5 },
    { title: 'Schreibtisch aufräumen', minutes: 10 },
    { title: 'Boden freiräumen, Dinge wegbringen', minutes: 10 },
  ],
  Schlafzimmer: [
    { title: 'Wäsche vom Boden und Stuhl einsammeln', minutes: 5 },
    { title: 'Bett machen', minutes: 5 },
    { title: 'Kleiderstange aufhängen, was herumliegt', minutes: 10 },
    { title: 'Kleiderstange aussortieren, was du nicht trägst', minutes: 10 },
    { title: 'Nachttisch freiräumen', minutes: 5 },
  ],
  Bad: [
    { title: 'Waschbecken und Spiegel abwischen', minutes: 5 },
    { title: 'Toilette reinigen', minutes: 5 },
    { title: 'Dusche oder Wanne abspülen', minutes: 10 },
    { title: 'Handtücher wechseln', minutes: 5 },
    { title: 'Boden wischen', minutes: 5 },
  ],
};

const MATCHERS = [
  ['Wohnzimmer', /wohnzimmer|wohnstube/i],
  ['Schlafzimmer', /schlafzimmer|kleiderstange|kleiderschrank/i],
  ['Bad', /(^|[^a-zäöüß])bad/i],
];

/** Schlägt vor, wie sich eine Aufgabe in kleine Stücke zerlegen lässt; null bei leerer Eingabe. */
export function suggestSplit(title, custom = {}) {
  const t = String(title ?? '').trim();
  if (!t) return null;
  const hit = MATCHERS.find(([, re]) => re.test(t));
  if (hit) {
    const name = hit[0];
    const zones = (custom[name]?.length ? custom[name] : DEFAULT_ROOMS[name]).map((z) => ({ ...z }));
    return { name, generic: false, zones };
  }
  return {
    name: t,
    generic: true,
    zones: [
      { title: `${t}: Anfangen, nur das Nötigste`, minutes: 5 },
      { title: `${t}: Hauptteil`, minutes: 10 },
      { title: `${t}: Abschließen und wegräumen`, minutes: 5 },
    ],
  };
}

/** Liest Zonen aus Text, eine pro Zeile: "Titel | Minuten". Ungültige Minuten werden 10. */
export function parseZones(text) {
  return String(text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, rest] = line.split('|').map((x) => x.trim());
      const n = Number(rest);
      const minutes = Number.isInteger(n) && n >= 1 && n <= MAX_MINUTES ? n : DEFAULT_MINUTES;
      return { title, minutes };
    })
    .filter((z) => z.title);
}

export function formatZones(zones) {
  return zones.map((z) => `${z.title} | ${z.minutes}`).join('\n');
}
