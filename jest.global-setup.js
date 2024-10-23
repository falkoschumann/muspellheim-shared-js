import process from 'node:process';

export default () => {
  process.env.TZ = 'Europe/Berlin';
};
