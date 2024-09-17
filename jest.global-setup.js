import process from 'node:process';

export default async () => {
  process.env.TZ = 'Europe/Berlin';
};
