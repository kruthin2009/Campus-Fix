import fs from "node:fs";
const app = fs.readFileSync("src/App.tsx", "utf8");
const expected = ["/", "/login", "/signup", "/forgot-password", "/profile-missing", "/privacy", "/terms", "/admin", "/student", "/worker"];
const missing = expected.filter((route) => !app.includes(`path="${route}"`));
if (missing.length) {
  console.error("Missing expected application routes:", missing.join(", "));
  process.exit(1);
}
console.log("Internal route check passed.");
