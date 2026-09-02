import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const candidatePaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(configDirectory, '../..', '.env'),
  path.resolve(configDirectory, '../../..', '.env')
];

for (const envPath of [...new Set(candidatePaths)]) {
  dotenv.config({ path: envPath, override: false });
}

