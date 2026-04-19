type HealthResponse = {
  status?: string;
  tools?: number;
  policies?: number;
  timestamp?: string;
};

type JsonRpcResponse = {
  result?: {
    tools?: Array<{
      name?: string;
    }>;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
};

const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const expectedTools = [
  'get_drug_coverage',
  'get_prior_auth_criteria',
  'check_patient_readiness',
  'list_policies',
  'get_policy_summary',
  'compare_drug_across_payers',
  'ask_policy_question'
];

function fail(message: string): never {
  console.error(`FAIL: ${message}`);
  process.exit(1);
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    fail(`${url} returned ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchJsonRpc(url: string, init: RequestInit): Promise<JsonRpcResponse> {
  const response = await fetch(url, init);
  if (!response.ok) {
    fail(`${url} returned ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const payload = text.startsWith('event:')
    ? text
        .split('\n')
        .find(line => line.startsWith('data: '))
        ?.slice('data: '.length)
    : text;

  if (!payload) {
    fail(`no JSON-RPC payload found in response: ${text}`);
  }

  try {
    return JSON.parse(payload) as JsonRpcResponse;
  } catch (error) {
    fail(
      `unable to parse JSON-RPC payload: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function main(): Promise<void> {
  console.log(`Smoke testing MCP server at ${baseUrl}`);

  const health = await fetchJson<HealthResponse>(`${baseUrl}/health`);
  if (health.status !== 'ok') {
    fail(`health status was ${JSON.stringify(health.status)}`);
  }

  if (health.tools !== 7) {
    console.warn(`WARN: /health reported tools=${health.tools ?? 'unknown'} instead of 7`);
  }

  console.log(
    `PASS: /health responded with status=ok tools=${health.tools ?? 'unknown'} policies=${health.policies ?? 'unknown'}`
  );

  const toolsResponse = await fetchJsonRpc(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    })
  });

  if (toolsResponse.error) {
    fail(`tools/list returned JSON-RPC error ${toolsResponse.error.code}: ${toolsResponse.error.message}`);
  }

  const toolNames = (toolsResponse.result?.tools ?? [])
    .map(tool => tool.name)
    .filter((name): name is string => Boolean(name));

  for (const toolName of expectedTools) {
    if (!toolNames.includes(toolName)) {
      fail(`missing tool ${toolName}; found [${toolNames.join(', ')}]`);
    }
  }

  console.log(`PASS: tools/list returned ${toolNames.length} tools including ${expectedTools.join(', ')}`);

  const listPoliciesResponse = await fetchJsonRpc(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'list_policies',
        arguments: {}
      }
    })
  });

  if (listPoliciesResponse.error) {
    fail(
      `list_policies returned JSON-RPC error ${listPoliciesResponse.error.code}: ${listPoliciesResponse.error.message}`
    );
  }

  const contentEntry = listPoliciesResponse.result?.content?.find(entry => entry.type === 'text' && entry.text);
  if (!contentEntry?.text) {
    fail('list_policies response did not include a text content entry');
  }

  let parsedContent: { answer?: string };
  try {
    parsedContent = JSON.parse(contentEntry.text) as { answer?: string };
  } catch (error) {
    fail(
      `list_policies text content was not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (!parsedContent.answer) {
    fail('list_policies response JSON did not include an answer field');
  }

  console.log('PASS: list_policies tool call returned valid response');
  console.log('Smoke test passed');
}

main().catch(error => {
  fail(error instanceof Error ? error.message : String(error));
});
