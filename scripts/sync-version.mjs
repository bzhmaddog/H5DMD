// Keeps the hardcoded `Dmd.version` in src/dmd.ts in sync with package.json.
//
// npm runs this via the "version" lifecycle script AFTER bumping package.json
// but BEFORE creating the version commit/tag, so both files land together.
import { readFileSync, writeFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));

const file = "src/dmd.ts";
const source = readFileSync(file, "utf8");

const pattern = /static readonly version(\s*:\s*string)? = '[^']*'/;
if (!pattern.test(source)) {
    console.error(`sync-version: could not find "static readonly version" in ${file}`);
    process.exit(1);
}

const updated = source.replace(pattern, `static readonly version: string = '${version}'`);

if (updated !== source) {
    writeFileSync(file, updated);
    console.log(`sync-version: set Dmd.version to ${version} in ${file}`);
} else {
    console.log(`sync-version: ${file} already at ${version}`);
}
