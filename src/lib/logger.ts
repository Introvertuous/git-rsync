import chalk from 'chalk';

const chalked = (
  logFn: (message?: any, ...optionalParams: any[]) => void,
  color: string
) => (message?: any) => logFn(chalk.hex(color)(message));

const log = chalked(console.log, '#00ff00');
const err = chalked(console.error, '#ff0000');
const warn = chalked(console.warn, '#ffa500');

export default {
  err,
  log,
  warn,
};
