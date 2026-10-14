import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOpenMeteo, fetchWeather } from '../src/weather.js';

const DATE = '2026-10-14';

function sample(rainFrom) {
  const time = [];
  const temp = [];
  const rain = [];
  for (const d of ['2026-10-14', '2026-10-15']) {
    for (let h = 0; h < 24; h++) {
      time.push(`${d}T${String(h).padStart(2, '0')}:00`);
      temp.push(10 + h / 4);
      rain.push(d === DATE && rainFrom !== null && h >= rainFrom ? 80 : 5);
    }
  }
  return {
    current: { temperature_2m: 14.4 },
    hourly: { time, temperature_2m: temp, precipitation_probability: rain },
  };
}

test('trocken bis 15 Uhr, ab 16 Uhr Regen', () => {
  const w = parseOpenMeteo(sample(16), DATE);
  assert.equal(w.tempNow, 14);
  assert.equal(w.rainFromHour, 16);
  assert.equal(w.dryUntilHour, 16);
});

test('ganzer Tag trocken: keine Regenstunde', () => {
  const w = parseOpenMeteo(sample(null), DATE);
  assert.equal(w.rainFromHour, null);
  assert.equal(w.dryUntilHour, null);
});

test('Regen mitten in der Nacht zählt nicht als Regen ab Tagesbeginn', () => {
  const j = sample(null);
  j.hourly.precipitation_probability[2] = 90;
  assert.equal(parseOpenMeteo(j, DATE).rainFromHour, null);
});

test('unbrauchbare Antwort ergibt null', () => {
  assert.equal(parseOpenMeteo({}, DATE), null);
  assert.equal(parseOpenMeteo(null, DATE), null);
});

test('fetchWeather gibt bei Netzfehler oder Fehlerantwort null zurück und wirft nie', async () => {
  const boom = async () => { throw new Error('offline'); };
  const bad = async () => ({ ok: false, json: async () => ({}) });
  assert.equal(await fetchWeather(52.5, 13.4, DATE, boom), null);
  assert.equal(await fetchWeather(52.5, 13.4, DATE, bad), null);
});

test('fetchWeather fragt Open-Meteo mit Standort ab und parst die Antwort', async () => {
  let url = '';
  const ok = async (u) => { url = u; return { ok: true, json: async () => sample(16) }; };
  const w = await fetchWeather(52.5, 13.4, DATE, ok);
  assert.equal(w.rainFromHour, 16);
  assert.match(url, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(url, /latitude=52\.5/);
  assert.match(url, /longitude=13\.4/);
});
