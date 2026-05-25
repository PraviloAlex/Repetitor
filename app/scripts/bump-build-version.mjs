import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const filePath = path.join(root, "src", "buildMeta.ts");

const source = fs.readFileSync(filePath, "utf8");
const match = source.match(/APP_BUILD_VERSION\s*=\s*"(\d+\.\d+)"/);
if (!match) {
  throw new Error("APP_BUILD_VERSION not found in src/buildMeta.ts");
}

const current = Number(match[1]);
const next = (Math.round((current + 0.01) * 100) / 100).toFixed(2);
const updated = source.replace(match[0], `APP_BUILD_VERSION = "${next}"`);

fs.writeFileSync(filePath, updated, "utf8");
console.log(`Build version bumped: ${match[1]} -> ${next}`);

