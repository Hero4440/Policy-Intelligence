/**
 * FHIR Client
 *
 * Handles connection to FHIR servers with bearer token authentication
 * and fetches paginated Patient/$everything bundles.
 */

import Client from 'fhir-kit-client';
import { FhirToken } from './types.js';

const DEFAULT_FHIR_SERVER = process.env.FHIR_SERVER_URL || 'https://fhir.promptopinion.ai';

/**
 * Creates a FHIR client instance with bearer token authentication
 */
export function createFhirClient(baseUrl: string, bearerToken: string): Client {
  return new Client({
    baseUrl,
    customHeaders: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });
}

/**
 * Fetches a complete Patient/$everything bundle, following pagination links
 */
export async function fetchPatientBundle(
  client: Client,
  patientId: string
): Promise<any> {
  let bundle: any = await client.request(`Patient/${patientId}/$everything`);

  // If there's no entry array, initialize it
  if (!bundle.entry) {
    bundle.entry = [];
  }

  // Follow pagination links to get complete patient data
  while (bundle.link) {
    const nextLink = bundle.link.find((link: any) => link.relation === 'next');
    if (!nextLink?.url) {
      break;
    }

    const nextBundle: any = await client.request(nextLink.url);

    if (nextBundle.entry && nextBundle.entry.length > 0) {
      bundle.entry.push(...nextBundle.entry);
    }

    bundle = nextBundle;
  }

  return bundle;
}

/**
 * Extracts FHIR token from patient context object
 * Supports multiple token field naming conventions
 */
export function extractFhirToken(
  patientContext: Record<string, any>
): FhirToken | null {
  const contexts = [
    patientContext,
    patientContext.sharp_context,
    patientContext.sharpContext,
    patientContext.context,
    patientContext.fhir,
    patientContext.fhir_context,
  ].filter((value): value is Record<string, any> => Boolean(value) && typeof value === 'object');

  const token = pickFirstString(contexts, [
    'fhir_token',
    'access_token',
    'token',
    'bearer_token',
    'bearerToken'
  ]);

  const patientId =
    pickFirstString(contexts, ['patient_id', 'patientId']) ||
    pickPatientId(contexts);

  const fhirServerUrl = pickFirstString(contexts, [
    'fhir_server_url',
    'fhirServerUrl',
    'server_url',
    'serverUrl',
    'base_url',
    'baseUrl'
  ]);

  if (!token || !patientId) {
    return null;
  }

  return {
    fhir_token: token,
    patient_id: patientId,
    fhir_server_url: fhirServerUrl || DEFAULT_FHIR_SERVER,
  };
}

function pickFirstString(
  candidates: Array<Record<string, any>>,
  keys: string[]
): string | undefined {
  for (const candidate of candidates) {
    for (const key of keys) {
      const value = candidate[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }

  return undefined;
}

function pickPatientId(candidates: Array<Record<string, any>>): string | undefined {
  for (const candidate of candidates) {
    const patient = candidate.patient;
    if (typeof patient === 'string' && patient.trim()) {
      return patient.trim();
    }

    if (patient && typeof patient === 'object' && typeof patient.id === 'string' && patient.id.trim()) {
      return patient.id.trim();
    }
  }

  return undefined;
}
