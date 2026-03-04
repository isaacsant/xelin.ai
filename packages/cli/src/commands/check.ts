import { Command } from "commander";
import chalk from "chalk";
import Table from "cli-table3";
import ora from "ora";
import {
  XelinEngine,
  type ProviderConfig,
  type BrandFact,
  type VisibilityReport,
} from "@xelin/core";

export const checkCommand = new Command("check")
  .description("Run a visibility check for a brand")
  .argument("<brand>", "Brand name to check")
  .option("-c, --competitors <names>", "Comma-separated competitor names")
  .option("-d, --domain <domain>", "Brand domain (e.g. acme.com)")
  .option(
    "-p, --providers <providers>",
    "Comma-separated providers (openai,anthropic,google,perplexity,bedrock)",
    "openai"
  )
  .option(
    "-m, --models <models>",
    "Comma-separated models (matched 1:1 with providers)",
    "gpt-4o"
  )
  .option("--concurrency <n>", "Max concurrent requests", "3")
  .action(async (brand: string, opts) => {
    const spinner = ora("Preparing check...").start();

    try {
      const providerNames = opts.providers.split(",");
      const modelNames = opts.models.split(",");

      const providers: ProviderConfig[] = providerNames.map(
        (p: string, i: number) => ({
          provider: p.trim() as ProviderConfig["provider"],
          model: modelNames[i]?.trim() ?? modelNames[0].trim(),
        })
      );

      const competitors = opts.competitors
        ? opts.competitors.split(",").map((n: string) => ({ name: n.trim() }))
        : [];

      const engine = new XelinEngine({
        providers,
        concurrency: parseInt(opts.concurrency),
      });

      spinner.text = `Checking visibility for "${brand}" across ${providers.length} provider(s)...`;

      const report = await engine.runCheck({
        name: brand,
        domain: opts.domain,
        facts: [],
        competitors,
      });

      spinner.stop();
      renderReport(report);
    } catch (error) {
      spinner.fail("Check failed");
      console.error(
        chalk.red(
          error instanceof Error ? error.message : "Unknown error"
        )
      );
      process.exit(1);
    }
  });

function renderReport(report: VisibilityReport) {
  console.log();
  console.log(
    chalk.bold.cyan(`  Visibility Report: ${report.brand.name}`)
  );
  console.log(chalk.gray(`  ${report.timestamp.toISOString()}`));
  console.log();

  // ─── Overall Score ─────────────────────────────────────
  const scoreColor =
    report.visibility.overall >= 70
      ? chalk.green
      : report.visibility.overall >= 40
        ? chalk.yellow
        : chalk.red;

  console.log(
    `  ${chalk.bold("Visibility Score:")} ${scoreColor(`${report.visibility.overall.toFixed(1)}%`)}`
  );
  console.log(
    `  ${chalk.bold("Sentiment:")} ${formatSentiment(report.sentiment.average, report.sentiment.label)}`
  );
  console.log(
    `  ${chalk.bold("Accuracy:")} ${formatAccuracy(report.accuracy)}`
  );
  console.log(
    `  ${chalk.bold("Total Checks:")} ${report.totalChecks}`
  );
  console.log();

  // ─── Per-Provider Breakdown ─────────────────────────────
  if (Object.keys(report.visibility.byProvider).length > 0) {
    const providerTable = new Table({
      head: ["Provider", "Visibility", "Sentiment"].map((h) =>
        chalk.cyan(h)
      ),
      style: { head: [], border: [] },
    });

    for (const [provider, score] of Object.entries(
      report.visibility.byProvider
    )) {
      providerTable.push([
        provider,
        `${(score as number).toFixed(1)}%`,
        formatSentiment(report.sentiment.byProvider[provider] ?? 0),
      ]);
    }

    console.log(chalk.bold("  Provider Breakdown:"));
    console.log(providerTable.toString());
    console.log();
  }

  // ─── Share of Voice ─────────────────────────────────────
  if (report.shareOfVoice.length > 1) {
    const sovTable = new Table({
      head: ["Brand", "Share", "Mentions"].map((h) => chalk.cyan(h)),
      style: { head: [], border: [] },
    });

    for (const sov of report.shareOfVoice) {
      const isBrand = sov.brand === report.brand.name;
      const name = isBrand ? chalk.bold(sov.brand) : sov.brand;
      sovTable.push([name, `${sov.percentage.toFixed(1)}%`, sov.mentionCount]);
    }

    console.log(chalk.bold("  Share of Voice:"));
    console.log(sovTable.toString());
    console.log();
  }

  // ─── Hallucinations ─────────────────────────────────────
  if (report.hallucinations.length > 0) {
    console.log(
      chalk.bold.red(
        `  Hallucinations Found: ${report.hallucinations.length}`
      )
    );
    console.log();

    const hallTable = new Table({
      head: ["Severity", "Claim", "Expected", "Actual"].map((h) =>
        chalk.red(h)
      ),
      style: { head: [], border: [] },
      colWidths: [12, 30, 20, 20],
      wordWrap: true,
    });

    for (const h of report.hallucinations) {
      const severityColor =
        h.severity === "critical"
          ? chalk.bgRed.white
          : h.severity === "high"
            ? chalk.red
            : h.severity === "medium"
              ? chalk.yellow
              : chalk.gray;

      hallTable.push([
        severityColor(h.severity.toUpperCase()),
        h.claim,
        h.expectedValue ?? "-",
        h.actualValue ?? "-",
      ]);
    }

    console.log(hallTable.toString());
    console.log();
  } else {
    console.log(chalk.green("  No hallucinations detected"));
    console.log();
  }
}

function formatSentiment(score: number, label?: string): string {
  const displayLabel = label ?? (score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral");
  const color =
    displayLabel === "positive"
      ? chalk.green
      : displayLabel === "negative"
        ? chalk.red
        : chalk.gray;
  return color(`${score.toFixed(2)} (${displayLabel})`);
}

function formatAccuracy(accuracy: number): string {
  const pct = (accuracy * 100).toFixed(1);
  const color = accuracy >= 0.9 ? chalk.green : accuracy >= 0.7 ? chalk.yellow : chalk.red;
  return color(`${pct}%`);
}
