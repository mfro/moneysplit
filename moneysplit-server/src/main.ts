import { appendFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { WebSocketServer } from 'ws';

import { GroupManager } from './group';
import { CLOSE_REASON_GROUP_NOT_FOUND, CLOSE_REASON_VERSION_MISMATCH, VERSION } from 'moneysplit-common';

const port = parseInt(process.argv[2]);

const server = createServer((req, res) => {
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server });

const manager = new GroupManager();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);

  let version = url.searchParams.get('version');
  if (version != VERSION.toString()) {
    console.log(`version mismatch: ${version}`);
    ws.close(4004, CLOSE_REASON_VERSION_MISMATCH)
    return;
  }

  let token = url.searchParams.get('token');
  if (!token) {
    token = manager.createGroup();
    console.log(`group created: ${token}`);
  }

  const success = manager.addClient(token, ws);
  if (!success) {
    console.log(`group not found: ${token}`);
    ws.close(4004, CLOSE_REASON_GROUP_NOT_FOUND);
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
