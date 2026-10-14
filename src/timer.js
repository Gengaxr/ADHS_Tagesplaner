export function createTimer(minutes, nowMs) {
  return { endsAt: nowMs + minutes * 60000 };
}

export function remainingMs(timer, nowMs) {
  return Math.max(0, timer.endsAt - nowMs);
}

export function formatMmSs(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
