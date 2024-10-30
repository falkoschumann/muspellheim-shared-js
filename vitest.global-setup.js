import process from 'node:process';

export default function setup() {
  process.env.TZ = 'Europe/Berlin';
}
