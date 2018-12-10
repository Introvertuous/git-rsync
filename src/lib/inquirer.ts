import inquirer from 'inquirer';

export interface Question {
  type: string;
  name: string;
  message: string;
}

let pendingPrompts: Array<Promise<any>> = [];

async function prompt<A>(questions: Question[]) {
  await Promise.all(pendingPrompts);
  pendingPrompts = [];

  const answerPromise = inquirer.prompt<A>(questions);
  pendingPrompts.push(answerPromise);
  return answerPromise;
}

export default {
  prompt,
};
