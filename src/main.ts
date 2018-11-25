#!/usr/bin/env node

/* tslint:disable:no-var-requires */
require('app-module-path').addPath(__dirname);
/* tslint:enable:no-var-requires */

import * as rsync from 'commander';
import master from 'commands/master';
import slave from 'commands/slave';

rsync
  .version('0.0.1')
  .description(
    'CLI for keeping git repositories in sync accross multiple devices.'
  );

rsync
  .command('master')
  .alias('m')
  .description('Act as the master in the rsync relationship.')
  .action(master);

rsync
  .command('slave [masterId]')
  .alias('s')
  .description('Act as the slave in the rsync relationship.')
  .action(slave);

rsync.parse(process.argv);

if (rsync.args.length === 0) {
  rsync.help();
}
