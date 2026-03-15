import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  callMagnusBridge,
  classifyMagnusBridgeIntent,
  formatMagnusBridgeResponse,
} from './magnus-bridge.js';
import type { RegisteredGroup } from './types.js';

const magnusGroup: RegisteredGroup = {
  name: 'Magnus',
  folder: 'whatsapp_magnus',
  trigger: '@Claw',
  added_at: '2026-03-14T00:00:00Z',
  requiresTrigger: false,
  containerConfig: {
    magnusBridge: {
      enabled: true,
    },
  },
};

describe('classifyMagnusBridgeIntent', () => {
  it('routes weekend research prompts to research_room', () => {
    const intent = classifyMagnusBridgeIntent(magnusGroup, [
      {
        id: '1',
        chat_jid: 'x@g.us',
        sender: 'user',
        sender_name: 'Jaakko',
        content: 'Any interesting research to read over the weekend',
        timestamp: '2026-03-14T00:00:00Z',
      },
    ]);
    expect(intent).toEqual({ operation: 'research_room', params: {} });
  });

  it('routes latest event prompts to event_update', () => {
    const intent = classifyMagnusBridgeIntent(magnusGroup, [
      {
        id: '1',
        chat_jid: 'x@g.us',
        sender: 'user',
        sender_name: 'Jaakko',
        content: 'Latest update on Iran',
        timestamp: '2026-03-14T00:00:00Z',
      },
    ]);
    expect(intent).toEqual({
      operation: 'event_update',
      params: { query: 'Iran' },
    });
  });
});

describe('callMagnusBridge', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('MAGNUS_NANOCLAW_BRIDGE_TOKEN', 'bridge-secret');
    delete process.env.MAGNUS_NANOCLAW_BRIDGE_HOST_URL;
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('defaults host-side bridge calls to localhost', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          summary: 'Research Room is green.',
          fresh_research: [],
        },
      }),
    });

    await callMagnusBridge(
      'research_room',
      {},
      {
        groupFolder: 'whatsapp_magnus',
        chatJid: 'x@g.us',
        assistantName: 'Claw',
      },
    );

    const requestUrl = fetchMock.mock.calls[0]?.[0];
    expect(String(requestUrl)).toBe('http://127.0.0.1:8787/v1/query');
  });

  it('uses explicit host bridge override when configured', async () => {
    vi.stubEnv('MAGNUS_NANOCLAW_BRIDGE_HOST_URL', 'http://10.0.0.5:9001');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        result: {
          summary: 'Research Room is green.',
          fresh_research: [],
        },
      }),
    });

    await callMagnusBridge(
      'research_room',
      {},
      {
        groupFolder: 'whatsapp_magnus',
        chatJid: 'x@g.us',
        assistantName: 'Claw',
      },
    );

    const requestUrl = fetchMock.mock.calls[0]?.[0];
    expect(String(requestUrl)).toBe('http://10.0.0.5:9001/v1/query');
  });
});

describe('formatMagnusBridgeResponse', () => {
  it('formats research room responses as book-aware reading bullets', () => {
    const text = formatMagnusBridgeResponse('research_room', {
      summary: 'Research Room has fresh evidence.',
      fresh_research: [
        {
          title: 'ORCL capex note',
          source: 'GS',
          why_it_matters:
            'Read-through to active expressions GOOG, MSFT across hyperscaler platform.',
        },
      ],
    });

    expect(text).toContain('Top reads for your book:');
    expect(text).toContain('ORCL capex note (GS)');
    expect(text).toContain('GOOG, MSFT');
    expect(text).not.toContain('Research Room has fresh evidence.');
  });
});
