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
  // Try multiple possible token field names
  const token =
    patientContext.fhir_token ||
    patientContext.access_token ||
    patientContext.token;

  const patientId = patientContext.patient_id || patientContext.patientId;

  if (!token || !patientId) {
    return null;
  }

  return {
    fhir_token: token,
    patient_id: patientId,
    fhir_server_url: patientContext.fhir_server_url || DEFAULT_FHIR_SERVER,
  };
}
