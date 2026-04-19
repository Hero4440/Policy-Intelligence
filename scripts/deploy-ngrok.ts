import ngrok from '@ngrok/ngrok';
import { spawn } from 'node:child_process';

const port = Number(process.env.PORT ?? '3000');

async function main(): Promise<void> {
  const listener = await ngrok.forward({
    addr: port,
    authtoken_from_env: true
  });

  const publicUrl = listener.url();
  console.error(`Tunnel established: ${publicUrl}`);
  console.error(`MCP endpoint: ${publicUrl}/mcp`);
  console.error(`Health check: ${publicUrl}/health`);
  console.error(`Prompt Opinion connection URL: ${publicUrl}/mcp`);

  const server = spawn(
    'npx',
    ['tsx', 'src/mcp/index.ts'],
    {
      env: {
        ...process.env,
        PORT: String(port),
        PUBLIC_BASE_URL: publicUrl
      },
      stdio: 'inherit'
    }
  );

  let shuttingDown = false;

  const shutdown = async (exitCode: number) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    server.kill('SIGINT');

    try {
      await ngrok.disconnect(publicUrl);
    } catch (error) {
      console.error(
        `ngrok disconnect failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    process.exit(exitCode);
  };

  process.on('SIGINT', () => {
    void shutdown(0);
  });

  process.on('SIGTERM', () => {
    void shutdown(0);
  });

  server.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    if (signal) {
      console.error(`MCP server exited from signal ${signal}`);
      void shutdown(1);
      return;
    }

    process.exit(code ?? 0);
  });
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
