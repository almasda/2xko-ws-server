// index.js
const WebSocket = require('ws');

// Ambil PORT dari environment variable
const PORT = process.env.PORT || 8080;

// Buat WebSocket server
const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on port ${PORT}`);

// Menyimpan state tiap room
const rooms = {};

wss.on('connection', (ws, req) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Pastikan client mengirim 'room' info
      const room = data.room;
      if (!room) return;

      // Simpan client ke room
      if (!rooms[room]) rooms[room] = [];
      if (!rooms[room].includes(ws)) rooms[room].push(ws);

      // Broadcast state ke semua client dalam room
      rooms[room].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'state',
            local: data.local || {},
            remote: data.remote || {}
          }));
        }
      });

      // Broadcast win info jika ada
      if (data.type === 'win' && data.winner) {
        rooms[room].forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'win',
              winner: data.winner
            }));
          }
        });
      }

    } catch (err) {
      console.error('Invalid message received:', err);
    }
  });

  ws.on('close', () => {
    // Hapus client dari semua room
    Object.keys(rooms).forEach(room => {
      rooms[room] = rooms[room].filter(client => client !== ws);
      if (rooms[room].length === 0) delete rooms[room];
    });
    console.log('Client disconnected');
  });

  ws.send(JSON.stringify({ type: 'connected', msg: 'Welcome to 2XKO server!' }));
});
