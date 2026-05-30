const WebSocket = require('ws');
const url = require('url');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log('WebSocket server running on port', PORT);

// Menyimpan client per room
const rooms = {};

wss.on('connection', (ws, req) => {
  const parameters = url.parse(req.url, true);
  const roomId = parameters.query.room || 'default';
  if (!rooms[roomId]) rooms[roomId] = new Set();
  rooms[roomId].add(ws);

  console.log(`New client joined room: ${roomId} - total: ${rooms[roomId].size}`);

  // Kirim ID unik ke client (opsional)
  ws.send(JSON.stringify({ type: 'id', id: Math.random().toString(36).substr(2, 9) }));

  // Broadcast state ke semua client di room yang sama
  ws.on('message', (message) => {
    let data;
    try { data = JSON.parse(message); } catch(e) { return; }

    if (data.type === 'input' || data.type === 'state') {
      rooms[roomId].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'state', state: data.state || data }));
        }
      });
    }
  });

  ws.on('close', () => {
    rooms[roomId].delete(ws);
    console.log(`Client left room: ${roomId} - total: ${rooms[roomId].size}`);
    if (rooms[roomId].size === 0) delete rooms[roomId];
  });
});
