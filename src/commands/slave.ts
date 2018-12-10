import ip from 'ip';
import WebSocket from 'ws';
import { findService } from '../lib/bonjour';
import { PORT } from '../lib/config';
import git from '../lib/git';
import logger from '../lib/logger';

let socket: WebSocket | null = null;

function send(type: string, payload?: any) {
  if (socket == null) {
    return;
  }
  socket.send(JSON.stringify({ type, payload }));
}

async function onMessage(type: string, payload?: any) {
  if (type === 'ACCEPTED') {
    send('REQUEST_PATCH');
  } else if (type === 'PATCH') {
    await git.stash();

    if (!payload) {
      return;
    }

    await git.apply(payload);
  } else if (type === 'COMPARE') {
    const diff = await git.getUntrackedDiff();

    if (diff == null || diff.raw === payload) {
      return;
    }

    send('REQUEST_PATCH');
  }
}

export default async function action(masterId: string = 'master') {
  await git.open();

  const service = await findService(masterId);

  if (service == null) {
    logger.err(`Cannot find master service...`);
    process.exit();
    return;
  }

  logger.log(`Your ip address: ${ip.address()}`);
  const { addresses } = service;

  socket = new WebSocket(`ws://${addresses[0]}:${PORT}`);

  socket.on('message', data => {
    const { type, payload } = JSON.parse(data.toString());
    onMessage(type, payload);
  });

  socket.on('close', () => {
    logger.err('Master service has closed...');
    process.exit();
  });
}
