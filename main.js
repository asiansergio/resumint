#!/usr/bin/env node

import cli from "./src/cli.js";
import generator from "./src/generator.js";
import template from "./src/template.js";

const argv = cli.parseArguments();
template.registerHelpers();
generator.generateResumes(argv);
