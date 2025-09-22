#!/usr/bin/env node

import cli from "./cli.js";
import { ResumeGenerator } from "./generator.js";

async function main() {
  const argv = await cli.parseArguments();
  const generator = new ResumeGenerator();
  await generator.generateResumes(argv as any);
}

main();
