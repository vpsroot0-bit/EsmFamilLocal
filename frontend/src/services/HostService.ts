import TcpSocket from 'react-native-tcp-socket';
import Zeroconf from 'react-native-zeroconf';
import { PORT, SERVICE_TYPE, CATEGORIES, ROUND_DURATION_MS } from '../utils/constants';
import { randomLetter } from '../utils/letters';

type Client = { id: string; socket: any; name: string | null; answers: Record<string, string> | null };
type Listener = (event: any) => void;

class HostService {
  private server: any = null;
  private zeroconf: Zeroconf | null = null;
  private clients: Map<string, Client> = new Map();
  private buffers: Map<string, string> = new Map();
  private listeners: Set<Listener> = new Set();
  private roundActive = false;
  private currentLetter: string | null = null;
  private endTimer: any = null;
  hostName = 'میزبان';

  on(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private emit(ev: any) { this.listeners.forEach(l => l(ev)); }

  async start(hostName: string) {
    this.hostName = hostName || 'میزبان';
    this.server = TcpSocket.createServer((socket: any) => this.onConnection(socket));
    this.server.listen({ port: PORT, host: '0.0.0.0' });
    this.server.on('error', (err: any) => this.emit({ type: 'ERROR', message: String(err) }));

    try {
      this.zeroconf = new Zeroconf();
      this.zeroconf.publishService(SERVICE_TYPE, 'tcp', 'local.', `EsmFamil_${this.hostName}`, PORT);
    } catch (e) {}

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
      try { this.handleMessage(id, JSON.parse(line)); } catch {}
    }
  }

  private handleMessage(id: string, msg: any) {
    const client = this.clients.get(id);
    if (!client) return;
    if (msg.type === 'JOIN') {
      client.name = String(msg.name || '').slice(0, 20) || 'مهمان';
      this.emitLobby();
    } else if (msg.type === 'ANSWERS' && this.roundActive) {
      client.answers = msg.answers || {};
    }
  }

  private send(socket: any, msg: any) {
    try { socket.write(JSON.stringify(msg) + '\n'); } catch {}
  }
  private broadcast(msg: any) {
    this.clients.forEach(c => { if (c.socket) this.send(c.socket, msg); });
    this.emit(msg);
  }
  private emitLobby() {
    const players = Array.from(this.clients.values()).map(c => ({ id: c.id, name: c.name || 'مهمان' }));
    this.broadcast({ type: 'LOBBY', players });
  }

  startRound() {
    if (this.clients.size === 0) return;
    this.roundActive = true;
    this.currentLetter = randomLetter();
    this.clients.forEach(c => (c.answers = null));
    this.broadcast({
      type: 'ROUND_START',
      letter: this.currentLetter,
      categories: CATEGORIES,
      durationMs: ROUND_DURATION_MS,
      endsAt: Date.now() + ROUND_DURATION_MS,
    });
    if (this.endTimer) clearTimeout(this.endTimer);
    this.endTimer = setTimeout(() => this.endRound(), ROUND_DURATION_MS);
  }

  submitHostAnswers(answers: Record<string, string>) {
    const host = this.clients.get('host');
    if (host) host.answers = answers;
  }

  endRound() {
    if (!this.roundActive) return;
    this.roundActive = false;
    if (this.endTimer) { clearTimeout(this.endTimer); this.endTimer = null; }
    const letter = this.currentLetter || '';
    const counts: Record<string, Record<string, number>> = {};
    CATEGORIES.forEach(cat => {
      counts[cat] = {};
      this.clients.forEach(c => {
        const a = (c.answers?.[cat] || '').trim();
        if (a) counts[cat][a] = (counts[cat][a] || 0) + 1;
      });
    });
    const results = Array.from(this.clients.values()).map(c => {
      let score = 0;
      CATEGORIES.forEach(cat => {
        const a = (c.answers?.[cat] || '').trim();
        if (!a) return;
        if (!a.startsWith(letter)) return;
        score += counts[cat][a] === 1 ? 10 : 5;
      });
      return { name: c.name || 'مهمان', answers: c.answers || {}, score };
    });
    results.sort((a, b) => b.score - a.score);
    this.broadcast({ type: 'ROUND_END', letter, results });
  }

  stop() {
    try { this.server?.close(); } catch {}
    try { this.zeroconf?.unpublishService(`EsmFamil_${this.hostName}`); } catch {}
    try { this.zeroconf?.stop(); } catch {}
    this.clients.clear();
    this.buffers.clear();
    this.server = null;
    this.zeroconf = null;
  }
}

export default new HostService();
