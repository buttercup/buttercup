#!/usr/bin/env node --no-warnings --loader ts-node/esm

import { resolve as resolveDirectory } from "node:path";
import chalk from "chalk";
import minimist from "minimist";
import { z, ZodError } from "zod";
import { fetchTargetDependencies } from "./package.js";
import { buildPackagesConcurrently } from "./build.js";

function formatError(error: unknown): string {
    if (error instanceof ZodError) {
      return error.errors.map(err => {
        const path = err.path.join(".");
        const pathStr = path ? `${chalk.cyan(path)}: ` : "";
        return `${chalk.red("✘")} ${pathStr}${err.message}`;
      }).join("\n");
    }

    // Handle standard errors
    if (error instanceof Error) {
      return chalk.red(error.message);
    }

    // Handle unknown error types
    return chalk.red("An unknown error occurred");
  }

async function init() {
    const argv = minimist(process.argv.slice(2));

    const {
        _: appPaths,
        command: commands,
        root
    } = z.object({
        _: z.array(z.string()).min(1, "An application path is required").max(1, "Only 1 application path is expected"),
        command: z.preprocess(
            (value: unknown) => typeof value === "string" ? [value] : value,
            z.array(z.string())
        ),
        root: z.string()
    }).parse(argv);

    const applicationPath = resolveDirectory(process.cwd(), appPaths[0]);

    const workspacePackages = await fetchTargetDependencies(applicationPath, root);
    if (!workspacePackages) {
        console.log(`${chalk.yellow("No dependencies")}: No workspace dependencies found for target application`);
        return;
    }

    console.log(chalk.bgWhite.black.bold(" PkgBuild "));
    console.log(chalk.green("┌────────────────────────────────────────»"));
    console.log(chalk.green("│ ") + chalk.bold("Application:"));
    console.log(chalk.green("│ ") + chalk.blueBright(" · ") + applicationPath);
    console.log(chalk.green("│ ") + chalk.bold("Packages:"));
    for (const pkg of workspacePackages) {
        console.log(chalk.green("│ ") + chalk.blueBright(" · ") + pkg.name);
    }
    console.log(chalk.green("└────────────────────────────────────────»"));

    await buildPackagesConcurrently(workspacePackages, {
        extraCommands: commands
    });
}

init().catch(err => {
    console.error(formatError(err));
    process.exit(1);
});
