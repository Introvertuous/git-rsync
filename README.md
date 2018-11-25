## Git Rsync

The purpose of this command line utility is to allow multiple devices to sync up changes within a particular git repository without the need to push and pull commits.

### Setup

Disclaimer: I would probably advise against using this tool at the moment, it is still in the prototype phase. If you do not mind this fact by all means:

```
npm install -g git-rsync
```

## Commands

- `git-rsync master`

- `git-rsync slave`

## Remarks

The CLI tries to be as non-destructure as is possible, so when the `slave` needs to become even with the `master`, uncommited changes are stashed.
