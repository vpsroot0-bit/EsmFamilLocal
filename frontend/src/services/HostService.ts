import TcpSocket from 'react-native-tcp-socket';
import Zeroconf from 'react-native-zeroconf';
import {
  PORT, SERVICE_TYPE, CATEGORIES,
  SCORE_UNIQUE, SCORE_DUPLICATE, STOP_COLLECTION_MS,
} from '../utils/constants';
import { randomLetter, startsWithLetter, normalizePersian } from '../utils/letters';

type Client = {
  id: string;
  socket: any;
  name: string | null;
  answers: Record<string, string> | null;
};
type Listener = (event: any) => void;

export type RoundSnapshot = {
  letter: string;
  endsAt: number;
  durationMs: number;
  categories: readonly string[];
};

class HostService {
  private server: any = null;
  private zeroconf: Zeroconf | null = null;
  private clients: Map<string, Client> = new Map();
  private buffers: Map<string, string> = new Map();
  private listeners: Set<Listener> = new Set();

  private roundActive = false;
  private currentLetter: string | null = null;
  private currentEndsAt = 0;
  private currentDurationMs = 0;

  private endTimer: any = null;
  private stopCollectionTimer: any = null;

  hostName = 'میزبان';

  on(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private emit(ev: any) { this.listeners.forEach(l => l(ev)); }

  async start(hostName: string) {
    if (this.server) return; // already started
    this.hostName = hostName || 'میزبان';
    this.server = TcpSocket.createServer((socket: any) => this.onConnection(socket));
    this.server.listen({ port: PORT, host: '0.0.0.0' });
    this.server.on('error', (err: any) => this.emit({ type: 'ERROR', message: String(err) }));

    try {
      this.zeroconf = new Zeroconf();
      this.zeroconf.publishService(SERVICE_TYPE, 'tcp', 'local.', `EsmFamil_${this.hostName}`, PORT);
    } catch { /* ignore */ }

    this.clients.set('host', { id: 'host', socket: null, name: this.hostName, answers: null });
    this.emitLobby();
  }

  private onConnection(socket: any) {
    const id = Math.random().toString(36).slice(2, 9);
    this.clients.set(id, { id, socket, name: null, answers: null });
    this.buffers.set(id, '');
    socket.on('data', (data: Buffer) => this.onData(id, data));
    socket.on('close', () => { this.clients.delete(id); this.buffers.delete(id); this.emitLobby(); });
    socket.on('error', () => { this.clients.delete(id); this.buffers.delete(id); this.emitLobby(); });
  }

  private onData(id: string, data: Buffer) {
    const prev = this.buffers.get(id) || '';
    const buf = prev + data.toString('utf8');
    const parts = buf.split('\n');
    this.buffers.set(id, parts.pop() || '');
    for (const line of parts) {
      if (!line.trim()) continue;
      try { this.handleMessage(id, JSON.parse(line)); } catch { /* ignore */ }
    }
  }

  private handleMessage(id: string, msg: any) {
    const client = this.clients.get(id);
    if (!client) return;

    if (msg.type === 'JOIN') {
      client.name = String(msg.name || '').slice(0, 20) || 'مهمان';
      this.emitLobby();
      // If a round is currently active, sync the new client into it.
      if (this.roundActive && client.socket) {
        this.send(client.socket, this.roundStartPayload());
      }
    } else if (msg.type === 'ANSWERS' && this.roundActive) {
      client.answers = msg.answers || {};
    } else if (msg.type === 'STOP' && this.roundActive) {
      // Any client requested stop. Trigger collection phase.
      this.requestStop();
    }
  }

  private send(socket: any, msg: any) {
    try { socket.write(JSON.stringify(msg) + '\n'); } catch { /* ignore */ }
  }

  private broadcast(msg: any) {
    this.clients.forEach(c => { if (c.socket) this.send(c.socket, msg); });
    this.emit(msg);
  }

  private emitLobby() {
    const players = Array.from(this.clients.values()).map(c => ({ id: c.id, name: c.name || 'مهمان' }));
    this.broadcast({ type: 'LOBBY', players });
  }

  // -------- Public API --------

  /** Snapshot of the current round (or null if no round). Used by GameScreen on mount to hydrate. */
  getCurrentRound(): RoundSnapshot | null {
    if (!this.roundActive || !this.currentLetter) return null;
    return {
      letter: this.currentLetter,
      endsAt: this.currentEndsAt,
      durationMs: this.currentDurationMs,
      categories: CATEGORIES,
    };
  }

  /** Start a new round. durationSeconds comes from Settings. */
  startRound(durationSeconds: number) {
    if (this.clients.size === 0) return;
    this.clearTimers();

    this.roundActive = true;
    this.currentLetter = randomLetter();
    this.currentDurationMs = Math.max(5, durationSeconds) * 1000;
    this.currentEndsAt = Date.now() + this.currentDurationMs;
    this.clients.forEach(c => (c.answers = null));

    this.broadcast(this.roundStartPayload());

    // Auto-end if nobody stops first.
    this.endTimer = setTimeout(() => this.requestStop(), this.currentDurationMs);
  }

  private roundStartPayload() {
    return {
      type: 'ROUND_START',
      letter: this.currentLetter,
      categories: CATEGORIES,
      durationMs: this.currentDurationMs,
      endsAt: this.currentEndsAt,
    };
  }

  /** Save host's own answers (host is the in-memory 'host' client). */
  submitHostAnswers(answers: Record<string, string>) {
    const host = this.clients.get('host');
    if (host) host.answers = answers;
  }

  /**
   * Called when ANY player presses STOP (host directly, or client via STOP message).
   * Broadcasts STOP_TRIGGERED so every UI submits & locks, then waits a short
   * window to collect final answers, then computes and broadcasts results.
   */
  requestStop() {
    if (!this.roundActive) return;
    if (this.stopCollectionTimer) return; // already collecting

    if (this.endTimer) { clearTimeout(this.endTimer); this.endTimer = null; }

    this.broadcast({ type: 'STOP_TRIGGERED' });

    this.stopCollectionTimer = setTimeout(() => {
      this.stopCollectionTimer = null;
      this.endRoundAndScore();
    }, STOP_COLLECTION_MS);
  }

  private endRoundAndScore() {
    if (!this.roundActive) return;
    this.roundActive = false;

    const letter = this.currentLetter || '';

    // Group equal normalized answers per category (case-insensitive in Persian).
    const counts: Record<string, Record<string, number>> = {};
    CATEGORIES.forEach(cat => {
      counts[cat] = {};
      this.clients.forEach(c => {
        const raw = (c.answers?.[cat] || '').trim();
        if (!raw) return;
        if (!startsWithLetter(raw, letter)) return; // invalid: doesn't start with letter
        const key = normalizePersian(raw);
        counts[cat][key] = (counts[cat][key] || 0) + 1;
      });
    });

    const results = Array.from(this.clients.values()).map(c => {
      let score = 0;
      const breakdown: Record<string, { value: string; points: number; reason: string }> = {};
      CATEGORIES.forEach(cat => {
        const raw = (c.answers?.[cat] || '').trim();
        if (!raw) {
          breakdown[cat] = { value: '', points: 0, reason: 'خالی' };
          return;
        }
        if (!startsWithLetter(raw, letter)) {
          breakdown[cat] = { value: raw, points: 0, reason: 'حرف اول اشتباه' };
          return;
        }
        const key = normalizePersian(raw);
        const n = counts[cat][key] || 0;
        const pts = n === 1 ? SCORE_UNIQUE : SCORE_DUPLICATE;
        score += pts;
        breakdown[cat] = { value: raw, points: pts, reason: n === 1 ? 'یکتا' : 'تکراری' };
      });
      return {
        name: c.name || 'مهمان',
        answers: c.answers || {},
        breakdown,
        score,
      };
    });

    results.sort((a, b) => b.score - a.score);
    this.broadcast({ type: 'ROUND_END', letter, results });
    this.currentLetter = null;
  }

  private clearTimers() {
    if (this.endTimer) { clearTimeout(this.endTimer); this.endTimer = null; }
    if (this.stopCollectionTimer) { clearTimeout(this.stopCollectionTimer); this.stopCollectionTimer = null; }
  }

  stop() {
    this.clearTimers();
    try { this.server?.close(); } catch { /* ignore */ }
    try { this.zeroconf?.unpublishService(`EsmFamil_${this.hostName}`); } catch { /* ignore */ }
    try { this.zeroconf?.stop(); } catch { /* ignore */ }
    this.clients.clear();
    this.buffers.clear();
    this.server = null;
    this.zeroconf = null;
    this.roundActive = false;
    this.currentLetter = null;
  }
}

export default new HostService();
