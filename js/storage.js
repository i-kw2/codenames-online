const PREFIX = 'surveyShowdown:';

function safeParse(value, fallback) {
  try { return value == null ? fallback : JSON.parse(value); }
  catch { return fallback; }
}

function available() {
  try {
    const key = `${PREFIX}__test`;
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch { return false; }
}

export const storage = {
  available,
  get(key, fallback = null) {
    if (!available()) return fallback;
    return safeParse(localStorage.getItem(PREFIX + key), fallback);
  },
  set(key, value) {
    if (!available()) return false;
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) {
    if (!available()) return false;
    try { localStorage.removeItem(PREFIX + key); return true; }
    catch { return false; }
  }
};

export const DEFAULT_SETTINGS = Object.freeze({
  language: 'en',
  sound: true,
  music: false,
  sfxVolume: 0.6,
  musicVolume: 0.25,
  aiDifficulty: 'medium',
  roundTime: 60,
  virtualKeyboard: false,
  reducedMotion: false,
  playerName: 'Player 1'
});

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...(storage.get('settings', {}) || {}) };
}

export function saveSettings(settings) { storage.set('settings', settings); }

export function loadStats() {
  return { gamesPlayed: 0, wins: 0, losses: 0, highestScore: 0, totalScore: 0, correct: 0, wrong: 0, ...(storage.get('stats', {}) || {}) };
}

export function saveStats(stats) { storage.set('stats', stats); }
export function loadCustomQuestions() { return storage.get('customQuestions', []) || []; }
export function saveCustomQuestions(qs) { storage.set('customQuestions', qs); }
