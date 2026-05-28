import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_ROUND_SECONDS,
  DEFAULT_TOTAL_ROUNDS,
  MIN_ROUND_SECONDS,
  MAX_ROUND_SECONDS,
  MIN_ROUNDS,
  MAX_ROUNDS,
} from './constants';

const KEY = 'esmfamil_settings_v2';

export type Settings = {
  roundSeconds: number;
  totalRounds: number;
  playerName: string;
  soundEnabled: boolean;
};

const DEFAULTS: Settings = {
  roundSeconds: DEFAULT_ROUND_SECONDS,
  totalRounds: DEFAULT_TOTAL_ROUNDS,
  playerName: '',
  soundEnabled: true,
};

function sanitize(s: Partial<Settings>): Settings {
  const out = { ...DEFAULTS, ...s };
  if (!Number.isFinite(out.roundSeconds)) out.roundSeconds = DEFAULT_ROUND_SECONDS;
  out.roundSeconds = Math.max(MIN_ROUND_SECONDS, Math.min(MAX_ROUND_SECONDS, Math.round(out.roundSeconds)));
  if (!Number.isFinite(out.totalRounds)) out.totalRounds = DEFAULT_TOTAL_ROUNDS;
  out.totalRounds = Math.max(MIN_ROUNDS, Math.min(MAX_ROUNDS, Math.round(out.totalRounds)));
  out.playerName = (out.playerName || '').slice(0, 20);
  out.soundEnabled = !!out.soundEnabled;
  return out;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const cur = await loadSettings();
  const next = sanitize({ ...cur, ...patch });
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
