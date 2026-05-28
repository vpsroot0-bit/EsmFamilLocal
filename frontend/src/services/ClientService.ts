import TcpSocket from 'react-native-tcp-socket';
import Zeroconf from 'react-native-zeroconf';
import dgram from 'react-native-udp';
import { DISCOVERY_SERVICE_TYPE } from '../utils/constants';

export type Discovered = { name: string; host: string; port: number };
type Listener = (ev: any) => void;

type RoundSnapshot = {
  letter: string;
  endsAt: number;
  index: number;
  total: number;
};

class ClientService {
  private listeners: Listener[] = [];
  private socket: any = null;
  private buffer = '';
  private zeroconf: Zeroconf | null = null;
  private udpListener: any = null;
  private myId: string | null = null;
  private currentRound: RoundSnapshot | null = null;

  on(l: Listener) {
    this.listeners.push(l);
    return () => { this.listeners = this.listeners.filter(x => x !== l); };
  }

  getCurrentRound(): RoundSnapshot | null {
    return this.currentRound;
  }

  startDiscovery(onFound: (s: Discovered) => void) {
    // mDNS
    try {
      this.zeroconf = new Zeroconf();
      this.zeroconf.on('resolved', (svc: any) => {
        if (svc?.name?.startsWith('EsmFamil_')) {
          onFound({ name: svc.name, host: svc.host, port: svc.port });
        }
      });
      this.zeroconf.scan(DISCOVERY_SERVICE_TYPE, 'tcp', 'local.');
    } catch { /* ignore */ }

    // UDP broadcast fallback
    try {
      this.udpListener = dgram.createSocket({ type: 'udp4', reusePort: true });
      this.udpListener.bind(8888, () => {
        try { this.udpListener.setBroadcast(true); } catch {/*ignore*/}
      });
      this.udpListener.on('message', (msg: any, rinfo: any) => {
        try {
          const txt = msg.toString('utf8');
          const obj = JSON.parse(txt);
          if (obj?.service === DISCOVERY_SERVICE_TYPE && obj?.port) {
            onFound({ name: obj.name || 'Game', host: rinfo.address, port: obj.port });
          }
        } catch { /* ignore */ }
      });
    } catch { /* ignore */ }
  }

  stopDiscovery() {
    try { this.zeroconf?.stop(); } catch {/*ignore*/}
    this.zeroconf = null;
    try { this.udpListener?.close(); } catch {/*ignore*/}
    this.udpListener = null;
  }

  connect(host: string, port: number, name: string) {
    this.disconnect();
    this.buffer = '';
    this.currentRound = null;

    try {
      this.socket = TcpSocket.createConnection({ host, port }, () => {
        try {
          this.socket.write(JSON.stringify({ type: 'JOIN', name }) + '\n');
        } catch { /* ignore */ }
        this.emit({ type: 'CONNECTED' });
      });

      this.socket.on('data', (data: any) => {
        this.buffer += data.toString('utf8');
        let idx: number;
        while ((idx = this.buffer.indexOf('\n')) >= 0) {
          const line = this.buffer.slice(0, idx).trim();
          this.buffer = this.buffer.slice(idx + 1);
          if (!line) continue;
          try {
            const m = JSON.parse(line);
            this.handleMessage(m);
          } catch { /* ignore */ }
        }
      });

      this.socket.on('close', () => this.emit({ type: 'DISCONNECTED' }));
      this.socket.on('error', (e: any) => this.emit({ type: 'ERROR', message: String(e?.message || e) }));
    } catch (e: any) {
      this.emit({ type: 'ERROR', message: String(e?.message || e) });
    }
  }

  disconnect() {
    try { this.socket?.destroy(); } catch {/*ignore*/}
    this.socket = null;
    this.currentRound = null;
  }

  submitAnswers(answers: Record<string, string>) {
    if (!this.socket) return;
    try {
      this.socket.write(JSON.stringify({ type: 'ANSWERS', answers }) + '\n');
    } catch { /* ignore */ }
  }

  sendStop() {
    if (!this.socket) return;
    try {
      this.socket.write(JSON.stringify({ type: 'STOP' }) + '\n');
    } catch { /* ignore */ }
  }

  private handleMessage(m: any) {
    if (m.type === 'WELCOME') {
      this.myId = m.id;
    } else if (m.type === 'ROUND_START') {
      this.currentRound = {
        letter: m.letter,
        endsAt: m.endsAt,
        index: m.index || 1,
        total: m.total || 1,
      };
    } else if (m.type === 'ROUND_END') {
      this.currentRound = null;
    }
    this.emit(m);
  }

  private emit(ev: any) {
    this.listeners.forEach(l => { try { l(ev); } catch { /* ignore */ } });
  }
}

export default new ClientService();
