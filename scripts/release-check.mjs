import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const required = [
  'package.json', 'package-lock.json', 'index.html',
  'src/main.tsx', 'src/App.tsx', 'firestore.rules', 'storage.rules',
  'api/ai.ts', '.env.example', 'README.md',
];
const missing = required.filter((file) => !existsSync(resolve(file)));
if (missing.length) {
  console.error(`Release check failed. Missing required files: ${missing.join(', ')}`);
  process.exit(1);
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.version !== '2.0.4') {
  console.error(`Expected package version 2.0.4; found ${pkg.version ?? 'unset'}`);
  process.exit(1);
}
if (!pkg.scripts?.build || !pkg.scripts?.['check:links']) {
  console.error('Required build or route-check script is missing.');
  process.exit(1);
}
console.log('Release structure check passed. This does not replace the production build or live Firebase tests.');
