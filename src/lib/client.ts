import git from 'lib/git';
import logger from 'lib/logger';
import * as WebSocket from 'ws';

export default class Client {
  private socket: WebSocket;

  constructor(ip: string, port: number) {
    this.socket = new WebSocket(`ws://${ip}:${port}`);

    this.socket.on('message', data => {
      const { type, payload } = JSON.parse(data.toString());
      this.onMessage(type, payload);
    });

    this.socket.on('close', () => {
      logger.err('Master service has closed...');
      process.exit();
    });
  }

  public connect() {
    logger.log('...connecting...');
  }

  public send(type: string, payload?: any) {
    this.socket.send(JSON.stringify({ type, payload }));
  }

  private async onMessage(type: string, payload?: any) {
    if (type === 'ACCEPTED') {
      this.send('REQUEST_PATCH');
    } else if (type === 'PATCH') {
      if (!payload) {
        git.stash();
        return;
      }

      git.apply(payload);
    } else if (type === 'COMPARE') {
      const diff = await git.getUntrackedDiff();

      if (diff == null || diff.raw === payload) {
        return;
      }

      this.send('REQUEST_PATCH');
    }
  }
}
