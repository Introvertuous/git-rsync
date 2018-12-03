import * as shortid from 'shortid';
import * as WebSocket from 'ws';
import { publishService } from '../lib/bonjour';
import { PORT } from '../lib/config';
import git from '../lib/git';
import inquirer, { Question } from '../lib/inquirer';
import logger from '../lib/logger';
import watcher from '../lib/watcher';

interface AuthAnswer {
  known: string;
}

const getAuthQuestions = (ip: string): Question[] => [
  {
    message: `Do you know this ip? (N/y) ${ip}`,
    name: 'known',
    type: 'input',
  },
];

const clients: WebSocket[] = [];
const authenticated: string[] = [];
const rejected: string[] = [];

function accept(socket: WebSocket) {
  clients.push(socket);
  socket.on('message', data => {
    const { type, payload } = JSON.parse(data.toString());
    onMessage(socket, type, payload);
  });
  send('ACCEPTED', null, socket);
}

async function onMessage(socket: WebSocket, type: string, payload?: any) {
  if (type === 'REQUEST_PATCH') {
    const diff = await git.getUntrackedDiff();

    if (diff == null) {
      return;
    }

    send('PATCH', diff.patch, socket);
  }
}

async function authenticateClient(socket: WebSocket, ip: string | undefined) {
  if (ip == null || rejected.includes(ip)) {
    return;
  }

  if (authenticated.includes(ip)) {
    accept(socket);
    return;
  }

  /**
   * TODO: this was obviously a quick and simple auth to get a demo working,
   * it is certainly not secure at all.
   */
  const authQuestions = getAuthQuestions(ip);
  const { known } = await inquirer.prompt<AuthAnswer>(authQuestions);
  const normalizedKnown = known.toLowerCase();
  if (normalizedKnown !== 'y' && normalizedKnown !== 'yes') {
    rejected.push(ip);
    logger.warn(`Rejected ip: ${ip}`);
    return;
  }

  logger.log(`Accepted ip: ${ip}`);
  authenticated.push(ip);
  accept(socket);
}

function send(type: string, payload?: any, socket?: WebSocket) {
  const data = JSON.stringify({ type, payload });
  if (socket != null) {
    socket.send(data);
    return;
  }
  clients.forEach(client => client.send(data));
}

export default async function action() {
  await git.open();

  publishService('master').on('error', () => {
    logger.warn(`Automatic publish failed, attempting to use generated id...`);
    const id = shortid.generate();
    publishService(id);
    logger.log(`Your ID: ${id}`);
  });

  const server = new WebSocket.Server({ port: PORT });

  server.on('connection', (ws, req) => {
    authenticateClient(ws, req.connection.remoteAddress);
  });

  watcher.onAnyChange(async () => {
    const diff = await git.getUntrackedDiff();

    if (diff == null) {
      return;
    }

    send('COMPARE', diff.raw);
  });
}
