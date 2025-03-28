#!/usr/bin/env node

import parseArguments from "./src/cli";
import forgeResumes from "./src/forge";

const argv = parseArguments();
forgeResumes(argv);
