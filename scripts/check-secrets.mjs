import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scannerPath = path.resolve(root, "scripts", "check-secrets.mjs");
const forbidden = /(PRIVATE_KEY|SERVICE_ACCOUNT|CLIENT_SECRET|OPENAI_API_KEY|GEMINI_API_KEY|ANTHROPIC_API_KEY|STRIPE_SECRET_KEY|AWS_SECRET_ACCESS_KEY)/i;
const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (["node_modules", ".git", "dist"].includes(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|mjs|json|env|local|html|md)$/.test(name) && !name.includes(".example")) files.push(full);
  }
}
walk(root);
const hits = [];
for (const file of files) {
  // Exclude this scanner itself using normalized absolute paths. On Windows,
  // path.join() produces backslashes, so endsWith("scripts/check-secrets.mjs")
  // incorrectly treated the scanner source as an application file.
  if (path.resolve(file) === scannerPath) continue;
  const text = fs.readFileSync(file, "utf8");
  if (forbidden.test(text)) hits.push(path.relative(root, file));
}
if (hits.length) {
  console.error("Potential private secret names found in tracked project files:");
  hits.forEach((x) => console.error(` - ${x}`));
  process.exit(1);
}
console.log("Secret-name scan passed.");
