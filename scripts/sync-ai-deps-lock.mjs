import { readFileSync, writeFileSync } from "node:fs";

const path = "package-lock.json";
const lock = JSON.parse(readFileSync(path, "utf8"));
const dependencyName = "youtube-transcript";
const dependencyVersion = "1.3.1";

if (!lock.packages || !lock.packages[""]) {
  throw new Error("Unsupported package-lock.json structure; expected npm lockfile v2/v3.");
}

lock.packages[""].dependencies ??= {};
lock.packages[""].dependencies[dependencyName] = "^1.3.1";

const packageEntry = {
  version: dependencyVersion,
  resolved: "https://registry.npmjs.org/youtube-transcript/-/youtube-transcript-1.3.1.tgz",
  integrity: "sha512-NDCjwad113TGybbYF51y9Z4tcwzBHUZWQdF9veULNca18L+FdDbHHtTHIr69WVa3bB90l67S8kN0HtL2JO9fhg==",
  license: "MIT",
  engines: { node: ">=18.0.0" },
};

const packageKey = `node_modules/${dependencyName}`;
const entries = Object.entries(lock.packages).filter(([key]) => key !== packageKey);
const insertAt = entries.findIndex(([key]) => key === "node_modules/zod");
if (insertAt >= 0) entries.splice(insertAt, 0, [packageKey, packageEntry]);
else entries.push([packageKey, packageEntry]);
lock.packages = Object.fromEntries(entries);

writeFileSync(path, `${JSON.stringify(lock, null, 2)}\n`);
console.log(`Updated ${path} with ${dependencyName}@${dependencyVersion}.`);
