import { publishService } from 'lib/bonjour';
import { PORT } from 'lib/config';
import git from 'lib/git';
import logger from 'lib/logger';
import Server from 'lib/server';
import watcher from 'lib/watcher';
import * as shortid from 'shortid';

export default async function action() {
  await git.open();

  publishService('master').on('error', () => {
    logger.warn(`Automatic publish failed, attempting to use generated id...`);
    const id = shortid.generate();
    publishService(id);
    logger.log(`Your ID: ${id}`);
  });

  const server = new Server(PORT);
  server.start();
  watcher.onAnyChange(server.onAnyChange);
}
