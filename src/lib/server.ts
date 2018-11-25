import git from 'lib/git';
import inquirer, { Question } from 'lib/inquirer';
import logger from 'lib/logger';
import * as WebSocket from 'ws';

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

export default class Server {
  private clients: WebSocket[];
  private authenticatedIps: string[];
  private rejectedIps: string[];
  private server: WebSocket.Server;

  constructor(port: number) {
    this.clients = [];
    this.authenticatedIps = [];
    this.rejectedIps = [];
    this.server = new WebSocket.Server({ port });
    this.server.on('connection', (ws, req) =>
      this.authenticateClient(ws, req.connection.remoteAddress)
    );
  }

  public start() {
    logger.log('...starting...');
  }

  public send(type: string, payload?: any, socket?: WebSocket) {
    const data = JSON.stringify({ type, payload });
    if (socket != null) {
      socket.send(data);
      return;
    }
    this.clients.forEach(client => client.send(data));
  }

  public onAnyChange = async () => {
    const diff = await git.getUntrackedDiff();

    if (diff == null) {
      return;
    }

    this.send('COMPARE', diff.raw);
  };

  private accept(socket: WebSocket) {
    this.clients.push(socket);
    socket.on('message', data => {
      const { type, payload } = JSON.parse(data.toString());
      this.onMessage(socket, type, payload);
    });
    this.send('ACCEPTED', null, socket);
  }

  private authenticateClient = async (
    socket: WebSocket,
    ip: string | undefined
  ) => {
    if (ip == null || this.rejectedIps.includes(ip)) {
      return;
    }

    if (this.authenticatedIps.includes(ip)) {
      this.accept(socket);
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
      this.rejectedIps.push(ip);
      logger.warn(`Rejected ip: ${ip}`);
      return;
    }

    logger.log(`Accepted ip: ${ip}`);
    this.authenticatedIps.push(ip);
    this.accept(socket);
  };

  private async onMessage(socket: WebSocket, type: string, payload?: any) {
    if (type === 'REQUEST_PATCH') {
      const diff = await git.getUntrackedDiff();

      if (diff == null) {
        return;
      }

      this.send('PATCH', diff.patch, socket);
    }
  }
}
