#!/usr/bin/env node

import cli from "./src/cli.js";
import template from "./src/template.js";
import { createGenerator } from "./src/generator.js";

async function main() {
  try {
    const argv = cli.parseArguments();
    template.registerHelpers();

    // Create a custom generator instance with custom configuration if needed
    const generator = createGenerator({
      // You can override specific dependencies here if needed
      // For example:
      // logger: createLogger(console),
    });

    await generator.generateResumes(argv);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
