// Hard stop before a real release. pnpm publish only asks "continue?" when the
// branch is wrong, and a stray "y" would publish from a feature branch.
import { execSync } from "node:child_process";

const run = (command) => execSync(command, { encoding: "utf8" }).trim();

const problems = [];

const branch = run("git branch --show-current");
if (branch !== "main") problems.push(`You're on "${branch}". Switch to main.`);

if (run("git status --porcelain")) {
  problems.push("The working tree isn't clean. Commit or stash your changes.");
}

run("git fetch origin main --quiet");
if (run("git rev-parse HEAD") !== run("git rev-parse origin/main")) {
  problems.push("main isn't the same as origin/main. Pull or push so they match.");
}

if (problems.length > 0) {
  console.error(`Release stopped:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

console.log("Release checks passed: on main, clean and up to date.");
