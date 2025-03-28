#!/usr/bin/env node

import { parseArguments } from './src/cli.js';
import { forgeResumes } from './src/forge.js';

const argv = parseArguments();
forgeResumes(argv);
