import { readFileSync, existsSync } from 'fs';
import * as yaml from 'js-yaml';
import { policySchema, type PolicyConfig } from './schema.js';

export function loadPolicy(path: string): PolicyConfig {
  if (!existsSync(path)) {
    throw new Error(`Policy file not found: ${path}`);
  }
  const raw = readFileSync(path, 'utf-8');
  const parsed = yaml.load(raw) as unknown;
  const result = policySchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Policy validation failed: ${result.error.message}`);
  }
  return result.data;
}

export function loadPolicyOrDefault(path?: string): PolicyConfig {
  const policyPath = path || process.env.ACTONCE_POLICY_PATH || './policies/starter-policy.yaml';
  return loadPolicy(policyPath);
}
