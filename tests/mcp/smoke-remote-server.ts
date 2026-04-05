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
  'check_patient_readiness'
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
  console.log('Smoke test passed');
}

main().catch(error => {
  fail(error instanceof Error ? error.message : String(error));
});
