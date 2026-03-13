import { appendFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

import { GroupManager } from './group';

const port = parseInt(process.argv[2]);

const server = createServer((req, res) => {
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server });

const manager = new GroupManager();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);

  let token = url.searchParams.get('token');
  if (token == null || !manager.getGroup(token)) {
    console.log(`Join failed: group ${token} not found`);
    token = manager.createGroup();
    console.log(`Group created: ${token}`);
  }

  const added = manager.addClient(token, ws);
  if (!added) {
    ws.close(4004, 'Group not found');
    return;
  }

  ws.on('message', async (data) => {
    await appendFile('data/log.txt', `${token} ${data.toString()}\n`);

    manager.handleMessage(token, ws, data.toString());
  });

  ws.on('close', () => {
    manager.removeClient(token, ws);
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error in group ${token}:`, err);
    manager.removeClient(token, ws);
  });
});

server.listen(port, () => {
  console.log(`MoneySplit server listening on port ${port}`);
});
