import { describe, expect, it } from 'vitest';

import { classifyMagnusBridgeIntent } from './magnus-bridge.js';
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
