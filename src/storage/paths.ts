import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const PROJECT_ROOT = join(__dirname, '../..');
export const DATA_ROOT = join(PROJECT_ROOT, 'data');
export const POLICIES_RAW_DIR = join(DATA_ROOT, 'policies', 'raw');
export const POLICIES_STRUCTURED_DIR = join(DATA_ROOT, 'policies', 'structured');
export const POLICY_INDEX_PATH = join(DATA_ROOT, 'policies', 'index.json');
export const PATIENTS_DIR = join(DATA_ROOT, 'patients');
export const EVALUATIONS_DIR = join(DATA_ROOT, 'evaluations');

export function ensureDataDirectories(): void {
  mkdirSync(POLICIES_RAW_DIR, { recursive: true });
  mkdirSync(POLICIES_STRUCTURED_DIR, { recursive: true });
  mkdirSync(PATIENTS_DIR, { recursive: true });
  mkdirSync(EVALUATIONS_DIR, { recursive: true });
}
