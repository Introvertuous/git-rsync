import * as ip from 'ip';
import { findService } from 'lib/bonjour';
import Client from 'lib/client';
import { PORT } from 'lib/config';
import git from 'lib/git';
import logger from 'lib/logger';

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

  const client = new Client(addresses[0], PORT);
  client.connect();
}
