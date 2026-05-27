import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_ROUND_SECONDS, MIN_ROUND_SECONDS, MAX_ROUND_SECONDS } from './constants';

export type Settings = {
  roundSeconds: number;
  playerName: string;
};

const KEY = '@esmfamil:settings:v2';

const defaults: Settings = {
  roundSeconds: DEFAULT_ROUND_SECONDS,
  playerName: '',
};

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw);
    return {
      roundSeconds: clamp(
        Number(parsed.roundSeconds) || DEFAULT_ROUND_SECONDS,
        MIN_ROUND_SECONDS,
        MAX_ROUND_SECONDS,
      ),
      playerName: String(parsed.playerName || ''),
    };
  } catch {
    return { ...defaults };
  }
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const cur = await loadSettings();
  const next: Settings = { ...cur, ...patch };
  if (typeof patch.roundSeconds === 'number') {
    next.roundSeconds = clamp(patch.roundSeconds, MIN_ROUND_SECONDS, MAX_ROUND_SECONDS);
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}
