import TcpSocket from 'react-native-tcp-socket';
import Zeroconf from 'react-native-zeroconf';
import { PORT, SERVICE_TYPE } from '../utils/constants';

type Listener = (event: any) => void;
export type Discovered = { name: string; host: string; port: number };

class ClientService {
  private socket: any = null;
  private buffer = '';
  private listeners: Set<Listener> = new Set();
  private zeroconf: Zeroconf | null = null;
  playerName = '';

  on(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private emit(ev: any) { this.listeners.forEach(l => l(ev)); }

  startDiscovery(onFound: (s: Discovered) => void) {
    try {
      this.zeroconf = new Zeroconf();
      this.zeroconf.on('resolved', (service: any) => {
        const name = service.name || '';
        if (!name.startsWith('EsmFamil_')) return;
        const host = (service.addresses && service.addresses[0]) || service.host;
        if (!host) return;
        onFound({ name, host, port: service.port || PORT });
      });
      this.zeroconf.on('error', () => {});
      this.zeroconf.scan(SERVICE_TYPE, 'tcp', 'local.');
    } catch {}
  }

  stopDiscovery() {
    try { this.zeroconf?.stop(); } catch {}
    this.zeroconf = null;
  }

  connect(host: string, port: number, name: string) {
    this.playerName = name;
    this.socket = TcpSocket.createConnection({ host, port }, () => {
      this.send({ type: 'JOIN', name });
      this.emit({ type: 'CONNECTED' });
    });
    this.socket.on('data', (data: Buffer) => this.onData(data));
    this.socket.on('error', (err: any) => this.emit({ type: 'ERROR', message: String(err) }));
    this.socket.on('close', () => this.emit({ type: 'DISCONNECTED' }));
  }

  private onData(data: Buffer) {
    this.buffer += data.toString('utf8');
    const parts = this.buffer.split('\n');
    this.buffer = parts.pop() || '';
    for (const line of parts) {
      if (!line.trim()) continue;
      try { this.emit(JSON.parse(line)); } catch {}
    }
  }

  send(msg: any) {
    try { this.socket?.write(JSON.stringify(msg) + '\n'); } catch {}
  }

  submitAnswers(answers: Record<string, string>) {
    this.send({ type: 'ANSWERS', answers });
  }

  disconnect() {
    try { this.socket?.destroy(); } catch {}
    this.socket = null;
    this.buffer = '';
  }
}

export default new ClientService();
