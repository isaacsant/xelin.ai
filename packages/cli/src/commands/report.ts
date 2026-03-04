import { Command } from "commander";
import chalk from "chalk";

export const reportCommand = new Command("report")
  .description("View stored visibility reports")
  .option("-b, --brand <name>", "Filter by brand name")
  .option("-n, --limit <n>", "Number of results", "10")
  .action(async (opts) => {
    console.log(
      chalk.yellow(
        "Report viewing requires a database connection. Use the API or dashboard for historical data."
      )
    );
    console.log(
      chalk.gray(
        "For quick checks, use: xelin check <brand> --competitors <a,b>"
      )
    );
  });
