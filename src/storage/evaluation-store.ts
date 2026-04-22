import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { EVALUATIONS_DIR, ensureDataDirectories } from './paths.js';
import type { CoverageEvaluation } from './types.js';

function evaluationPath(evalId: string): string {
  return join(EVALUATIONS_DIR, `${evalId}.json`);
}

function now(): string {
  return new Date().toISOString();
}

export function saveEvaluation(
  input: Omit<CoverageEvaluation, 'evalId' | 'evaluatedAt'>
): CoverageEvaluation {
  ensureDataDirectories();
  const evaluation: CoverageEvaluation = {
    ...input,
    evalId: crypto.randomUUID(),
    evaluatedAt: now()
  };
  writeFileSync(evaluationPath(evaluation.evalId), JSON.stringify(evaluation, null, 2), 'utf-8');
  return evaluation;
}

export function getEvaluation(evalId: string): CoverageEvaluation | null {
  const filePath = evaluationPath(evalId);
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as CoverageEvaluation;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[evaluation-store] malformed:', evalId, message);
    return null;
  }
}

export function listEvaluations(filter?: {
  caseId?: string;
  policyId?: string;
}): CoverageEvaluation[] {
  ensureDataDirectories();
  if (!existsSync(EVALUATIONS_DIR)) {
    return [];
  }

  return readdirSync(EVALUATIONS_DIR)
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => getEvaluation(fileName.replace(/\.json$/, '')))
    .filter((entry): entry is CoverageEvaluation => entry !== null)
    .filter((entry) => (filter?.caseId ? entry.caseId === filter.caseId : true))
    .filter((entry) => (filter?.policyId ? entry.policyId === filter.policyId : true))
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt));
}

export function hasEvaluationsForCase(caseId: string): boolean {
  return listEvaluations({ caseId }).length > 0;
}
