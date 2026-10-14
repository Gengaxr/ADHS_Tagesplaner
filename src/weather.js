const RAIN_THRESHOLD = 50;
const FIRST_AWAKE_HOUR = 7;

/** Macht aus der Open-Meteo-Antwort die Wetterdaten für einen Tag; null, wenn nichts Brauchbares da ist. */
export function parseOpenMeteo(json, date) {
  const h = json?.hourly;
  const tempNow = json?.current?.temperature_2m;
  if (!h || !Array.isArray(h.time) || !Array.isArray(h.precipitation_probability)) return null;
  if (typeof tempNow !== 'number') return null;

  let rainFromHour = null;
  for (let i = 0; i < h.time.length; i++) {
    const [d, t] = String(h.time[i]).split('T');
    const hour = Number(t?.slice(0, 2));
    if (d !== date || hour < FIRST_AWAKE_HOUR) continue;
    if (h.precipitation_probability[i] >= RAIN_THRESHOLD) {
      rainFromHour = hour;
      break;
    }
  }
  return { tempNow: Math.round(tempNow), rainFromHour, dryUntilHour: rainFromHour };
}

/** Holt das Wetter; bei jedem Fehler kommt null zurück, nie eine Ausnahme. */
export async function fetchWeather(lat, lon, date, fetchFn = globalThis.fetch) {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=temperature_2m,precipitation_probability&current=temperature_2m' +
      '&timezone=auto&forecast_days=2';
    const res = await fetchFn(url);
    if (!res.ok) return null;
    return parseOpenMeteo(await res.json(), date);
  } catch {
    return null;
  }
}
