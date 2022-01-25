#!/usr/bin/env node

import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { exports } = require('../package');

const { default: start } = await import(`.${exports}`);

async function main() {
  await start({ argv: process.argv });
}

await main();
