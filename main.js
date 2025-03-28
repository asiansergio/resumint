#!/usr/bin/env node

import cli from "./src/cli.js";
import forge from "./src/forge.js";

const argv = cli.parseArguments();
forge.forgeResumes(argv);
