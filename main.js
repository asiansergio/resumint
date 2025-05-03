#!/usr/bin/env node

import cli from "./src/cli.js";
import generator from "./src/generator.js";

const argv = cli.parseArguments();
generator.generateResumes(argv);
