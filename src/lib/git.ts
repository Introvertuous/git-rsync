import findUp from 'find-up';
import Git from 'nodegit';
import path from 'path';
import tmp from 'tmp';
import { exec } from './child_promise';
import { readFile, writeFile } from './fs';
import logger from './logger';

let repository: Git.Repository | null = null;

async function getPath() {
  const gitPath = await findUp('.git');

  if (gitPath == null) {
    logger.err(`You are not inside a git repository...`);
    return process.exit();
  }

  return gitPath;
}

async function open() {
  const gitPath = await getPath();
  repository = await Git.Repository.open(gitPath);
}

async function getUntrackedDiff() {
  if (repository == null) {
    return null;
  }

  const refreshIndex = await repository.refreshIndex();
  const options = {
    flags:
      Git.Diff.OPTION.SHOW_UNTRACKED_CONTENT |
      Git.Diff.OPTION.RECURSE_UNTRACKED_DIRS,
  };
  const diff = await Git.Diff.indexToWorkdir(repository, refreshIndex, options);
  const patch = await diff.toBuf(Git.Diff.FORMAT.PATCH);
  const raw = await diff.toBuf(Git.Diff.FORMAT.RAW);

  return { patch, raw };
}

async function getStatus() {
  if (repository == null) {
    return [];
  }

  const files = await repository.getStatus();
  return files.reduce<string[]>((acc, file) => {
    acc = [...acc, ...file.status()];
    return acc;
  }, []);
}

function stash() {
  // TODO: use nodegit instead of child_process
  return exec('git stash');
}

async function apply(patch: string) {
  const tempFile = tmp.fileSync();
  await writeFile(tempFile.name, patch);
  // TODO: use nodegit instead of child_process
  await exec(`git apply ${tempFile.name}`);
}

// TODO: support multiple .gitignore at any level
async function getIgnore() {
  const gitPath = await getPath();
  const gitignorePath = path.resolve(gitPath, '..', '.gitignore');

  const gitignore = await readFile(gitignorePath);

  return gitignore
    .toString()
    .split(/\r?\n/)
    .filter(l => l.trim() !== '' && l.charAt(0) !== '#');
}

export default {
  apply,
  getIgnore,
  getPath,
  getStatus,
  getUntrackedDiff,
  open,
  stash,
};
