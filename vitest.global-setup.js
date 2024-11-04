// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import process from 'node:process';

export default function setup() {
  process.env.TZ = 'Europe/Berlin';
}
