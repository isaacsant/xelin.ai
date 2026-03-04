#!/usr/bin/env node

import { Command } from "commander";
import { checkCommand } from "./commands/check.js";
import { reportCommand } from "./commands/report.js";

const program = new Command();

program
  .name("xelin")
  .description("AI visibility tracker with hallucination detection")
  .version("0.1.0");

program.addCommand(checkCommand);
program.addCommand(reportCommand);

program.parse();
