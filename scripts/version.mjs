// Keeps package.json's version ahead of what is on npm.
//
//   node scripts/version.mjs sync   pre-commit hook: set package.json to npm's
//                                   latest plus one patch, if it isn't ahead
//   node scripts/version.mjs check  pull request check: fail if it isn't ahead
//   node scripts/version.mjs next   release workflow: print the version to publish
//
// The rule: package.json higher than npm's latest is kept as it is, which is how
// a deliberate minor or major bump works. Otherwise npm's latest plus one patch.
// Only plain x.y.z versions are supported, not pre-releases.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;
const VERSION_LINE_PATTERN = /^(\s{2}"version":\s*")[^"]+(")/m;

/** Splits "1.2.3" into numbers, or throws if it isn't a plain x.y.z version. */
function parseVersion(version) {
  const match = VERSION_PATTERN.exec(version);
  if (!match) throw new Error(`"${version}" is not a plain x.y.z version.`);
  return match.slice(1).map(Number);
}

/** Returns a positive number if a is higher than b, negative if lower, 0 if equal. */
function compareVersions(a, b) {
  const [partsA, partsB] = [parseVersion(a), parseVersion(b)];
  for (let index = 0; index < 3; index += 1) {
    if (partsA[index] !== partsB[index]) return partsA[index] - partsB[index];
  }
  return 0;
}

/** Whether the repository's version is already ahead of npm's latest. */
export function isAheadOfNpm(repositoryVersion, npmVersion) {
  return compareVersions(repositoryVersion, npmVersion) > 0;
}

/** Decides the version to publish from package.json's version and npm's latest. */
export function chooseNextVersion(repositoryVersion, npmVersion) {
  if (isAheadOfNpm(repositoryVersion, npmVersion)) return repositoryVersion;
  const [major, minor, patch] = parseVersion(npmVersion);
  return `${major}.${minor}.${patch + 1}`;
}

/** Returns package.json text with its version line replaced. */
export function setVersionInText(packageJsonText, version) {
  if (!VERSION_LINE_PATTERN.test(packageJsonText)) {
    throw new Error("Couldn't find the version line in package.json.");
  }
  return packageJsonText.replace(VERSION_LINE_PATTERN, `$1${version}$2`);
}

/**
 * Reads npm's latest published version. Returns null if the package has never
 * been published, and throws for any other failure (offline, registry down).
 */
function readLatestNpmVersion(packageName) {
  try {
    return execFileSync("npm", ["view", packageName, "version"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    if (/E404|404 Not Found/.test(String(error.stderr))) return null;
    throw new Error(`Couldn't read ${packageName} from npm: ${error.message.split("\n")[0]}`);
  }
}

function readPackage() {
  const text = readFileSync("package.json", "utf8");
  const { name, version } = JSON.parse(text);
  return { text, name, version };
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

/** Pre-commit: never blocks a commit. CI is what enforces the version. */
function runSync() {
  const { text, name, version } = readPackage();
  let npmVersion;
  try {
    npmVersion = readLatestNpmVersion(name);
  } catch (error) {
    console.warn(`version sync skipped: ${error.message}`);
    return;
  }
  if (npmVersion === null) {
    console.log(`version sync skipped: ${name} isn't on npm yet.`);
    return;
  }
  if (isAheadOfNpm(version, npmVersion)) return;

  // Staging package.json also stages any other edits in it, so don't touch it
  // if it already has changes that aren't staged.
  if (git("diff", "--name-only", "--", "package.json")) {
    console.warn("version sync skipped: package.json has unstaged changes.");
    return;
  }

  const next = chooseNextVersion(version, npmVersion);
  writeFileSync("package.json", setVersionInText(text, next));
  git("add", "package.json");
  console.log(`version sync: package.json ${version} -> ${next} (npm has ${npmVersion}).`);
}

/** Pull request check: package.json must be ahead of npm. */
function runCheck() {
  const { name, version } = readPackage();
  const npmVersion = readLatestNpmVersion(name);
  if (npmVersion === null) {
    console.log(`${name} isn't on npm yet, so there is nothing to be ahead of.`);
    return;
  }
  if (!isAheadOfNpm(version, npmVersion)) {
    throw new Error(
      `package.json is at ${version} but npm already has ${npmVersion}. ` +
        "Run pnpm version:sync and commit the change.",
    );
  }
  console.log(`package.json ${version} is ahead of npm ${npmVersion}.`);
}

/** Release workflow: the version to publish. */
function runNext() {
  const { name, version } = readPackage();
  const npmVersion = readLatestNpmVersion(name);
  if (npmVersion === null) {
    throw new Error(
      `${name} isn't on npm yet. Publish the first version by hand with ` +
        "pnpm release, set up the trusted publisher on npmjs.com, then merge again.",
    );
  }
  console.log(chooseNextVersion(version, npmVersion));
}

const COMMANDS = { sync: runSync, check: runCheck, next: runNext };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = COMMANDS[process.argv[2]];
  if (!command) {
    console.error(`Usage: node scripts/version.mjs <${Object.keys(COMMANDS).join("|")}>`);
    process.exit(1);
  }
  try {
    command();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
