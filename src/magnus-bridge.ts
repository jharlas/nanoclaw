import type { NewMessage, RegisteredGroup } from './types.js';

export interface MagnusBridgeIntent {
  operation: string;
  params: Record<string, string | number | boolean>;
}

export function classifyMagnusBridgeIntent(
  group: RegisteredGroup,
  messages: NewMessage[],
): MagnusBridgeIntent | null {
  if (!group.containerConfig?.magnusBridge?.enabled) return null;
  const latestUserMessage = [...messages]
    .reverse()
    .find((m) => !m.is_from_me && !m.is_bot_message);
  if (!latestUserMessage) return null;

  const text = latestUserMessage.content.trim();
  const lower = text.toLowerCase();

  if (
    /\b(interesting research|research worth reading|weekend reading|what should i read|best research today|what matters today)\b/.test(
      lower,
    )
  ) {
    return {
      operation: 'research_room',
      params: {},
    };
  }

  const researchQueryMatch =
    lower.match(
      /\b(?:research on|search research for|find notes on|notes on)\s+(.+)/i,
    ) || lower.match(/\b(?:research|notes)\s+(?:for|on)\s+(.+)/i);
  if (researchQueryMatch?.[1]) {
    return {
      operation: 'research_search',
      params: {
        query: text.slice(text.toLowerCase().indexOf(researchQueryMatch[1])),
        limit: 5,
      },
    };
  }

  const situationMatch = lower.match(
    /\b(?:situation room(?: for)?|war room(?: for)?)\s+(.+)/i,
  );
  if (situationMatch?.[1]) {
    return {
      operation: 'situation_room',
      params: {
        query: text.slice(text.toLowerCase().indexOf(situationMatch[1])),
      },
    };
  }

  const latestEventMatch =
    lower.match(
      /\b(?:latest update on|latest on|update on|status of)\s+(.+)/i,
    ) || lower.match(/\bwhat(?:'s| is) the latest(?: status)? of\s+(.+)/i);
  if (latestEventMatch?.[1]) {
    return {
      operation: 'event_update',
      params: {
        query: text.slice(text.toLowerCase().indexOf(latestEventMatch[1])),
      },
    };
  }

  if (/\bmorning brief\b/.test(lower)) {
    return {
      operation: 'morning_brief',
      params: {
        force_live: true,
      },
    };
  }

  if (/\b(start of day|show sod|sod)\b/.test(lower)) {
    return {
      operation: 'start_of_day',
      params: {},
    };
  }

  if (/\b(system health|health check|check health)\b/.test(lower)) {
    return {
      operation: 'system_health',
      params: {},
    };
  }

  if (/\b(portfolio|book|holdings|positions)\b/.test(lower)) {
    return {
      operation: 'portfolio_summary',
      params: {
        include_external: true,
      },
    };
  }

  return null;
}

function clip(text: unknown, maxLen = 1400): string {
  const value = String(text || '').trim();
  if (!value) return '';
  return value.length > maxLen ? `${value.slice(0, maxLen - 3)}...` : value;
}

function formatBulletList(
  items: unknown[],
  formatter: (item: unknown) => string,
): string[] {
  return items
    .slice(0, 5)
    .map((item) => formatter(item))
    .filter((line) => line.trim().length > 0);
}

export function formatMagnusBridgeResponse(
  operation: string,
  result: Record<string, unknown>,
): string {
  const lines: string[] = [];
  const summary = clip(result.summary, 500);
  if (summary) lines.push(summary);

  if (operation === 'research_room') {
    const fresh = Array.isArray(result.fresh_research)
      ? result.fresh_research
      : [];
    const bullets = formatBulletList(fresh, (raw) => {
      const item = (raw || {}) as Record<string, unknown>;
      const title = clip(item.title, 120);
      const source = clip(item.source, 40);
      if (!title) return '';
      return `• ${title}${source ? ` (${source})` : ''}`;
    });
    if (bullets.length) {
      lines.push('', 'Fresh research:', ...bullets);
    }
  } else if (operation === 'research_search') {
    const matches = Array.isArray(result.matches) ? result.matches : [];
    const bullets = formatBulletList(matches, (raw) => {
      const item = (raw || {}) as Record<string, unknown>;
      const title = clip(item.title, 120);
      const source = clip(item.source, 40);
      const note = clip(item.summary, 140);
      if (!title) return '';
      return `• ${title}${source ? ` (${source})` : ''}${note ? ` — ${note}` : ''}`;
    });
    if (bullets.length) {
      lines.push('', 'Matches:', ...bullets);
    }
  } else if (operation === 'event_update') {
    const narrative = clip(result.narrative, 1600);
    if (narrative) {
      lines.push('', narrative);
    }
  } else if (operation === 'morning_brief' || operation === 'start_of_day') {
    const primaryAction = (result.primary_action || {}) as Record<
      string,
      unknown
    >;
    const label = clip(primaryAction.label, 200);
    if (label) {
      lines.push('', `Primary action: ${label}`);
    }
  } else if (operation === 'portfolio_summary') {
    const total =
      result.total_portfolio_value_including_external ||
      result.total_portfolio_value;
    const cash = result.cash_usd;
    lines.push('', `Portfolio total: ${total}`, `Cash: ${cash}`);
  }

  return lines.join('\n').trim();
}

export async function callMagnusBridge(
  operation: string,
  params: Record<string, string | number | boolean>,
  context: {
    groupFolder: string;
    chatJid: string;
    assistantName: string;
  },
): Promise<string> {
  const bridgeUrl = process.env.MAGNUS_NANOCLAW_BRIDGE_URL || '';
  const bridgeToken = process.env.MAGNUS_NANOCLAW_BRIDGE_TOKEN || '';
  if (!bridgeUrl || !bridgeToken) {
    throw new Error('Magnus bridge is not configured');
  }

  const response = await fetch(new URL('/v1/query', bridgeUrl), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bridgeToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'nanoclaw-magnus-fastpath/1',
      'X-NanoClaw-Group': context.groupFolder,
      'X-NanoClaw-Chat': context.chatJid,
      'X-NanoClaw-Assistant': context.assistantName,
    },
    body: JSON.stringify({ operation, params }),
  });

  const payload = (await response.json()) as Record<string, unknown>;
  if (!response.ok) {
    const error = (payload.error || {}) as Record<string, unknown>;
    throw new Error(
      String(error.message || `Bridge request failed (${response.status})`),
    );
  }

  const result = (payload.result || {}) as Record<string, unknown>;
  return formatMagnusBridgeResponse(operation, result);
}
