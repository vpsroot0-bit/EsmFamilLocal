import TcpSocket from 'react-native-tcp-socket';
import dgram from 'react-native-udp';
import { PORT, DISCOVERY_SERVICE_TYPE, CATEGORIES, STOP_GRACE_MS } from '../utils/constants';
import { pickRandomLetter, normalizeAnswer } from '../utils/letters';

type Listener = (ev: any) => void;

type ClientConn = {
  id: string;
  name: string;
  socket: any;
  buffer: string;
};

type RoundSnapshot = {
  letter: string;
  endsAt: number;
  index: number;       // 1-based current round number
  total: number;       // total rounds in tournament
};

type Submission = { id: string; name: string; answers: Record<string, string> };

class HostService {
  private listeners: Listener[] = [];
  private server: any = null;
  private clients = new Map<string, ClientConn>();
  private udpAnnouncer: any = null;
  private announceInterval: any = null;
  private currentRound: RoundSnapshot | null = null;
  private hostName = '';
  private hostId = 'host';
  private submissions: Submission[] = [];
  private stopTimer: any = null;

  // tournament
  private totalRounds = 5;
  private roundIndex = 0;                 // increments to 1,2,...
  private tournamentScores = new Map<string, { name: string; total: number }>();
  private roundLog: { letter: string; results: any[] }[] = [];

  // ---------- public API ----------

  on(l: Listener) {
    this.listeners.push(l);
    return () => { this.listeners = this.listeners.filter(x => x !== l); };
  }

  async start(hostName: string, totalRounds: number) {
    this.hostName = hostName;
    this.totalRounds = totalRounds;
    this.roundIndex = 0;
    this.tournamentScores.clear();
    this.roundLog = [];
    this.submissions = [];
    this.currentRound = null;

    // Track host as a "player" too
    this.tournamentScores.set(this.hostId, { name: hostName, total: 0 });

    await this.startTcp();
    this.startUdpAnnounce();
    this.emitLobby();
  }

  stop() {
    try { this.server?.close(); } catch { /* ignore */ }
    this.server = null;
    this.clients.forEach(c => { try { c.socket.destroy(); } catch {/*ignore*/} });
    this.clients.clear();
    if (this.announceInterval) { clearInterval(this.announceInterval); this.announceInterval = null; }
    try { this.udpAnnouncer?.close(); } catch { /* ignore */ }
    this.udpAnnouncer = null;
    if (this.stopTimer) { clearTimeout(this.stopTimer); this.stopTimer = null; }
    this.currentRound = null;
    this.submissions = [];
  }

  getCurrentRound(): RoundSnapshot | null {
    return this.currentRound;
  }

  getTournamentInfo() {
    return { roundIndex: this.roundIndex, totalRounds: this.totalRounds };
  }

  /** Begin next round. Returns false if tournament is already over. */
  startRound(durationSeconds: number): boolean {
    if (this.roundIndex >= this.totalRounds) return false;

    this.roundIndex += 1;
    const letter = pickRandomLetter();
    const endsAt = Date.now() + durationSeconds * 1000;

    this.currentRound = {
      letter,
      endsAt,
      index: this.roundIndex,
      total: this.totalRounds,
    };
    this.submissions = [];
    if (this.stopTimer) { clearTimeout(this.stopTimer); this.stopTimer = null; }

    const payload = {
      type: 'ROUND_START',
      letter,
      endsAt,
      index: this.roundIndex,
      total: this.totalRounds,
    };
    this.broadcast(payload);
    this.emit(payload);

    // Auto-stop when timer expires
    setTimeout(() => {
      if (this.currentRound && this.currentRound.letter === letter && !this.stopTimer) {
        this.requestStop();
      }
    }, durationSeconds * 1000 + 100);

    return true;
  }

  /** Called when host taps STOP or a client sends STOP. */
  requestStop() {
    if (!this.currentRound) return;
    if (this.stopTimer) return; // already stopping
    const msg = { type: 'STOP_TRIGGERED' };
    this.broadcast(msg);
    this.emit(msg);
    // Give clients a grace window to submit
    this.stopTimer = setTimeout(() => this.finalizeRound(), STOP_GRACE_MS);
  }

  submitHostAnswers(answers: Record<string, string>) {
    if (!this.currentRound) return;
    this.upsertSubmission({ id: this.hostId, name: this.hostName, answers });
  }

  // ---------- internals ----------

  private emit(ev: any) {
    this.listeners.forEach(l => { try { l(ev); } catch { /* ignore */ } });
  }

  private emitLobby() {
    const players = [
      { id: this.hostId, name: this.hostName },
      ...Array.from(this.clients.values()).map(c => ({ id: c.id, name: c.name })),
    ];
    this.emit({ type: 'LOBBY', players });
  }

  private broadcast(obj: any) {
    const line = JSON.stringify(obj) + '\n';
    this.clients.forEach(c => {
      try { c.socket.write(line); } catch { /* ignore */ }
    });
  }

  private sendTo(id: string, obj: any) {
    const c = this.clients.get(id);
    if (!c) return;
    try { c.socket.write(JSON.stringify(obj) + '\n'); } catch { /* ignore */ }
  }

  private upsertSubmission(s: Submission) {
    const i = this.submissions.findIndex(x => x.id === s.id);
    if (i >= 0) this.submissions[i] = s; else this.submissions.push(s);
  }

  private finalizeRound() {
    if (!this.currentRound) return;
    const { letter } = this.currentRound;

    // Ensure host has a submission entry (may be empty)
    if (!this.submissions.find(s => s.id === this.hostId)) {
      this.upsertSubmission({ id: this.hostId, name: this.hostName, answers: {} });
    }
    // Ensure every connected client has an entry too
    this.clients.forEach(c => {
      if (!this.submissions.find(s => s.id === c.id)) {
        this.upsertSubmission({ id: c.id, name: c.name, answers: {} });
      }
    });

    const results = scoreRound(letter, this.submissions);

    // Update tournament totals
    results.forEach(r => {
      const entry = this.tournamentScores.get(r.id) || { name: r.name, total: 0 };
      entry.name = r.name;
      entry.total += r.score;
      this.tournamentScores.set(r.id, entry);
    });
    this.roundLog.push({ letter, results });

    const isLast = this.roundIndex >= this.totalRounds;
    const standings = Array.from(this.tournamentScores.entries())
      .map(([id, v]) => ({ id, name: v.name, total: v.total }))
      .sort((a, b) => b.total - a.total);

    const msg: any = {
      type: 'ROUND_END',
      letter,
      results,
      index: this.roundIndex,
      total: this.totalRounds,
      isLast,
      standings,
    };

    this.broadcast(msg);
    this.emit(msg);

    this.currentRound = null;
    this.stopTimer = null;
  }

  private async startTcp() {
    return new Promise<void>((resolve, reject) => {
      try {
        this.server = TcpSocket.createServer((socket: any) => {
          const id = `c_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
          let registered = false;
          const conn: ClientConn = { id, name: '', socket, buffer: '' };

          socket.on('data', (data: any) => {
            conn.buffer += data.toString('utf8');
            let idx: number;
            while ((idx = conn.buffer.indexOf('\n')) >= 0) {
              const line = conn.buffer.slice(0, idx).trim();
              conn.buffer = conn.buffer.slice(idx + 1);
              if (!line) continue;
              try {
                const m = JSON.parse(line);
                this.handleClientMessage(conn, m, () => { registered = true; });
              } catch { /* ignore malformed */ }
            }
          });

          socket.on('close', () => {
            this.clients.delete(id);
            if (registered) this.emitLobby();
          });
          socket.on('error', () => { /* swallow */ });
        });

        this.server.listen({ port: PORT, host: '0.0.0.0' }, () => resolve());
        this.server.on('error', (e: any) => reject(e));
      } catch (e) {
        reject(e);
      }
    });
  }

  private handleClientMessage(conn: ClientConn, m: any, onRegister: () => void) {
    if (m.type === 'JOIN') {
      conn.name = String(m.name || 'Player').slice(0, 20);
      this.clients.set(conn.id, conn);
      this.tournamentScores.set(conn.id, { name: conn.name, total: 0 });
      onRegister();
      this.sendTo(conn.id, { type: 'WELCOME', id: conn.id });
      // sync current round if any
      if (this.currentRound) {
        this.sendTo(conn.id, {
          type: 'ROUND_START',
          letter: this.currentRound.letter,
          endsAt: this.currentRound.endsAt,
          index: this.currentRound.index,
          total: this.currentRound.total,
        });
      }
      this.emitLobby();
    } else if (m.type === 'ANSWERS') {
      const c = this.clients.get(conn.id);
      if (!c || !this.currentRound) return;
      this.upsertSubmission({ id: c.id, name: c.name, answers: m.answers || {} });
    } else if (m.type === 'STOP') {
      this.requestStop();
    }
  }

  private startUdpAnnounce() {
    try {
      this.udpAnnouncer = dgram.createSocket({ type: 'udp4', reusePort: true });
      this.udpAnnouncer.bind(0, () => {
        try { this.udpAnnouncer.setBroadcast(true); } catch { /* ignore */ }
        const msg = Buffer.from(JSON.stringify({
          service: DISCOVERY_SERVICE_TYPE,
          name: 'EsmFamil_' + this.hostName,
          port: PORT,
        }));
        this.announceInterval = setInterval(() => {
          try {
            this.udpAnnouncer.send(msg, 0, msg.length, 8888, '255.255.255.255');
          } catch { /* ignore */ }
        }, 1500);
      });
    } catch { /* ignore */ }
  }
}

// ---------- scoring ----------

function scoreRound(letter: string, subs: Submission[]) {
  const normLetter = normalizeAnswer(letter);

  // map: category -> map<normalizedValue, count>
  const counts: Record<string, Map<string, number>> = {};
  CATEGORIES.forEach(cat => {
    counts[cat] = new Map();
    subs.forEach(s => {
      const raw = (s.answers[cat] || '').trim();
      if (!raw) return;
      const n = normalizeAnswer(raw);
      if (!n) return;
      if (!n.startsWith(normLetter)) return;
      counts[cat].set(n, (counts[cat].get(n) || 0) + 1);
    });
  });

  const results = subs.map(s => {
    const breakdown: Record<string, { value: string; points: number; reason: string }> = {};
    let total = 0;
    CATEGORIES.forEach(cat => {
      const raw = (s.answers[cat] || '').trim();
      if (!raw) {
        breakdown[cat] = { value: '', points: 0, reason: 'خالی' };
        return;
      }
      const n = normalizeAnswer(raw);
      if (!n.startsWith(normLetter)) {
        breakdown[cat] = { value: raw, points: 0, reason: 'حرف نامناسب' };
        return;
      }
      const c = counts[cat].get(n) || 1;
      const pts = c === 1 ? 10 : 5;
      breakdown[cat] = { value: raw, points: pts, reason: c === 1 ? 'یکتا' : 'تکراری' };
      total += pts;
    });
    return { id: s.id, name: s.name, score: total, breakdown };
  });

  results.sort((a, b) => b.score - a.score);
  return results;
}

export default new HostService();
