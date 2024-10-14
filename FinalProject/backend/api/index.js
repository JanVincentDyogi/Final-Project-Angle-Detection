const WebSocket = require("ws");

const port = process.env.PORT || 8443;
const wss = new WebSocket.Server({ port });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
    wss.broadcast(message);
  });
});

wss.broadcast = function (data) {
  this.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

console.log(`WebSocket server running on port ${port}`);
