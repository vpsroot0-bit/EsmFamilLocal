// Reference-only Node implementation of the EsmFamil host logic.
// The real host runs inside the React Native app (see frontend/src/services/HostService.ts).

const net = require('net');
const PORT = 8765;

const LETTERS = ['آ','ب','پ','ت','ث','ج','چ','ح','خ','د','ذ','ر','ز','ژ','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ک','گ','ل','م','ن','و','ه','ی'];
const CATEGORIES = ['نام','فامیل','شهر','کشور','غذا','حیوان','اشیاء','رنگ'];

const clients = new Map();
let roundActive = false;
let currentLetter = null;

function send(socket, msg) { socket.write(JSON.stringify(msg) + '\n'); }
function broadcast(msg) { clients.forEach(c => send(c.socket, msg)); }
function lobby() { return Array.from(clients, ([id, c]) => ({ id, name: c.name || 'مهمان' })); }

const server = net.createServer(socket => {
  const id = Math.random().toString(36).slice(2);
  clients.set(id, { socket, name: null, answers: null });
  let buffer = '';
  socket.on('data', chunk => {
    buffer += chunk.toString();
    let idx;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      try { handle(id, JSON.parse(line)); } catch (e) {}
    }
  });
  socket.on('close', () => { clients.delete(id); broadcast({ type:'LOBBY', players: lobby() }); });
  socket.on('error', () => {});
});

function handle(id, msg) {
  const c = clients.get(id);
  if (!c) return;
  if (msg.type === 'JOIN') {
    c.name = String(msg.name || '').slice(0, 20) || 'مهمان';
    broadcast({ type:'LOBBY', players: lobby() });
  } else if (msg.type === 'ANSWERS' && roundActive) {
    c.answers = msg.answers || {};
  }
}

function startRound(durationMs = 90000) {
  roundActive = true;
  currentLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  clients.forEach(c => c.answers = null);
  broadcast({ type:'ROUND_START', letter: currentLetter, categories: CATEGORIES, durationMs });
  setTimeout(endRound, durationMs);
}

function endRound() {
  roundActive = false;
  const counts = {};
  CATEGORIES.forEach(cat => {
    counts[cat] = {};
    clients.forEach(c => {
      const a = (c.answers?.[cat] || '').trim();
      if (a) counts[cat][a] = (counts[cat][a] || 0) + 1;
    });
  });
  const results = Array.from(clients.values()).map(c => {
    let score = 0;
    CATEGORIES.forEach(cat => {
      const a = (c.answers?.[cat] || '').trim();
      if (!a) return;
      if (!a.startsWith(currentLetter)) return;
      score += counts[cat][a] === 1 ? 10 : 5;
    });
    return { name: c.name, answers: c.answers || {}, score };
  });
  broadcast({ type:'ROUND_END', results });
}

server.listen(PORT, '0.0.0.0', () => console.log('Host reference listening on', PORT));
module.exports = { startRound, endRound };
