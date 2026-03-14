#!/usr/bin/env node

const bridgeUrl = process.env.MAGNUS_NANOCLAW_BRIDGE_URL || '';
const bridgeToken = process.env.MAGNUS_NANOCLAW_BRIDGE_TOKEN || '';
const bridgeEnabled = process.env.MAGNUS_NANOCLAW_BRIDGE_ENABLED === '1';
const groupFolder = process.env.NANOCLAW_GROUP_FOLDER || '';
const chatJid = process.env.NANOCLAW_CHAT_JID || '';
const assistantName = process.env.ASSISTANT_NAME || '';

function printUsage() {
  console.error(`Usage:
  node /workspace/global/tools/magnus_bridge.js health
  node /workspace/global/tools/magnus_bridge.js <operation> [--key value] [--json]

Examples:
  node /workspace/global/tools/magnus_bridge.js event_update --query "latest Iran update"
  node /workspace/global/tools/magnus_bridge.js research_search --query "oracle capex" --limit 5
  node /workspace/global/tools/magnus_bridge.js morning_brief --force_live true
`);
}

function parseScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

function parseArgs(argv) {
  const out = { operation: '', params: {}, jsonOnly: false };
  if (argv.length === 0) return out;
  out.operation = argv[0];
  for (let i = 1; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--json') {
      out.jsonOnly = true;
      continue;
    }
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument '${token}'`);
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next == null || next.startsWith('--')) {
      out.params[key] = true;
      continue;
    }
    out.params[key] = parseScalar(next);
    i += 1;
  }
  return out;
}

async function main() {
  const { operation, params, jsonOnly } = parseArgs(process.argv.slice(2));

  if (!operation) {
    printUsage();
    process.exit(2);
  }

  if (!bridgeEnabled) {
    console.error(
      'Magnus bridge is not enabled for this group. Configure containerConfig.magnusBridge.enabled first.',
    );
    process.exit(2);
  }

  if (!bridgeUrl) {
    console.error('MAGNUS_NANOCLAW_BRIDGE_URL is not set.');
    process.exit(2);
  }

  if (operation === 'health') {
    const response = await fetch(new URL('/health', bridgeUrl));
    const payload = await response.json();
    console.log(JSON.stringify(payload, null, 2));
    if (!response.ok) process.exit(1);
    return;
  }

  if (!bridgeToken) {
    console.error('MAGNUS_NANOCLAW_BRIDGE_TOKEN is not set.');
    process.exit(2);
  }

  const response = await fetch(new URL('/v1/query', bridgeUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridgeToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'nanoclaw-magnus-bridge/1',
      'X-NanoClaw-Group': groupFolder,
      'X-NanoClaw-Chat': chatJid,
      'X-NanoClaw-Assistant': assistantName,
    },
    body: JSON.stringify({
      operation,
      params,
    }),
  });

  const payload = await response.json();
  console.log(JSON.stringify(payload, null, 2));
  if (!response.ok) process.exit(1);
  if (!jsonOnly && payload?.result?.summary) {
    console.error(`Summary: ${payload.result.summary}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
