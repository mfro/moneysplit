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

wss.on('connection', (socket, req) => {
  const url = new URL(req.url ?? '/', `http://localhost:${port}`);

  let version = url.searchParams.get('version');
  if (version !== VERSION.toString()) {
    console.log(`version mismatch: ${version}`);
    socket.close(4004, CLOSE_REASON_VERSION_MISMATCH)
    return;
  }

  let instance;

  let token = url.searchParams.get('token');
  if (token) {
    instance = manager.findGroup(token);

    if (!instance) {
      console.log(`group not found: ${token}`);
      socket.close(4004, CLOSE_REASON_GROUP_NOT_FOUND);
      return;
    }
  } else {
    instance = manager.createGroup();
    console.log(`group created: ${instance.token}`);
  }

  instance.addClient(socket);
});

server.listen(port, () => {
  console.log(`MoneySplit server listening on port ${port}`);
});
