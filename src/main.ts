#!/usr/bin/env node

import cli from "./cli.js";
import template from "./template.js";
import { createGenerator } from "./generator.js";
import { getErrorMessage } from "./utils.js";

async function main() {
  try {
    const argv = await cli.parseArguments();
    template.registerHelpers();

    // Create a custom generator instance with custom configuration if needed
    const generator = createGenerator({
      // You can override specific dependencies here if needed
      // For example:
      // logger: createLogger(console),
    });

    await generator.generateResumes(argv as any);
  } catch (error) {
    getErrorMessage(error);
    process.exit(1);
  }
}

main();
