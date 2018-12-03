import * as chokidar from 'chokidar';
import * as path from 'path';
import git from './git';

async function onAnyChange(handler: (...args: any[]) => void) {
  const gitPath = await git.getPath();
  const root = path.resolve(gitPath, '..');
  const gitignore = await git.getIgnore();
  const ignored = [...gitignore, 'node_modules', '.git'];

  chokidar
    .watch(root, {
      ignoreInitial: true,
      ignored: ignored.map(entry => path.resolve(root, entry)),
    })
    .on('all', handler);
}

export default {
  onAnyChange,
};
