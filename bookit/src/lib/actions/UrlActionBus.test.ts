import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { URL_ACTION_SCHEMAS, buildActionUrl } from './UrlActionBus';

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const DATE = '2026-06-10';
const TIME = '14:30';

describe('URL_ACTION_SCHEMAS — booking:create', () => {
  const schema = URL_ACTION_SCHEMAS['booking:create'];

  it('accepts empty payload (all optional)', () => {
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('accepts valid full payload', () => {
    const r = schema.safeParse({ serviceId: UUID, clientId: UUID, date: DATE, startTime: TIME });
    expect(r.success).toBe(true);
  });

  it('rejects invalid UUID', () => {
    expect(schema.safeParse({ serviceId: 'not-a-uuid' }).success).toBe(false);
  });

  it('rejects bad date format', () => {
    expect(schema.safeParse({ date: '10-06-2026' }).success).toBe(false);
  });

  it('rejects bad time format', () => {
    expect(schema.safeParse({ startTime: '2:30 PM' }).success).toBe(false);
  });
});

describe('URL_ACTION_SCHEMAS — booking:reschedule', () => {
  const schema = URL_ACTION_SCHEMAS['booking:reschedule'];

  it('requires bookingId', () => {
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ bookingId: UUID }).success).toBe(true);
  });

  it('accepts optional date', () => {
    expect(schema.safeParse({ bookingId: UUID, date: DATE }).success).toBe(true);
  });

  it('rejects malformed bookingId', () => {
    expect(schema.safeParse({ bookingId: '123' }).success).toBe(false);
  });
});

describe('URL_ACTION_SCHEMAS — client:open', () => {
  const schema = URL_ACTION_SCHEMAS['client:open'];

  it('requires valid clientId', () => {
    expect(schema.safeParse({ clientId: UUID }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ clientId: 'bad' }).success).toBe(false);
  });
});

describe('URL_ACTION_SCHEMAS — marketing:broadcast', () => {
  const schema = URL_ACTION_SCHEMAS['marketing:broadcast'];

  it('accepts empty payload', () => {
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('accepts optional fields', () => {
    expect(schema.safeParse({ clientIds: 'uuid1,uuid2', templateId: 'tpl1' }).success).toBe(true);
  });

  it('strips extra fields (Zod default)', () => {
    const r = schema.safeParse({ unknown: 'field' });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('unknown');
  });
});

describe('URL_ACTION_SCHEMAS — ui:open_drawer', () => {
  const schema = URL_ACTION_SCHEMAS['ui:open_drawer'];

  it('requires drawerId', () => {
    expect(schema.safeParse({ drawerId: 'settings' }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it('accepts optional targetId', () => {
    expect(schema.safeParse({ drawerId: 'edit', targetId: UUID }).success).toBe(true);
  });
});

describe('URL_ACTION_SCHEMAS — flash:create', () => {
  const schema = URL_ACTION_SCHEMAS['flash:create'];

  it('accepts empty payload', () => {
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('accepts optional serviceId', () => {
    expect(schema.safeParse({ serviceId: UUID }).success).toBe(true);
  });

  it('rejects invalid serviceId', () => {
    expect(schema.safeParse({ serviceId: 'bad' }).success).toBe(false);
  });
});

describe('URL_ACTION_SCHEMAS — product:edit', () => {
  const schema = URL_ACTION_SCHEMAS['product:edit'];

  it('requires valid productId', () => {
    expect(schema.safeParse({ productId: UUID }).success).toBe(true);
    expect(schema.safeParse({}).success).toBe(false);
  });
});

describe('URL_ACTION_SCHEMAS — product:create', () => {
  const schema = URL_ACTION_SCHEMAS['product:create'];

  it('accepts empty payload', () => {
    expect(schema.safeParse({}).success).toBe(true);
  });
});

describe('buildActionUrl', () => {
  const OLD_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://bookit.com.ua';
  });

  afterAll(() => {
    process.env.NEXT_PUBLIC_SITE_URL = OLD_SITE_URL;
  });

  it('builds URL with action and payload params', () => {
    const url = buildActionUrl('/dashboard/bookings', 'booking:create', {
      serviceId: UUID,
      clientId: UUID,
    });
    expect(url).toContain('_action=booking%3Acreate');
    expect(url).toContain(`serviceId=${UUID}`);
    expect(url).toContain(`clientId=${UUID}`);
  });

  it('includes origin from env', () => {
    const url = buildActionUrl('/test', 'ui:open_drawer', { drawerId: 'x' });
    expect(url).toMatch(/^https:\/\/bookit\.com\.ua\/test\?_action=/);
  });

  it('omits undefined/empty values', () => {
    const url = buildActionUrl('/test', 'booking:create', {
      serviceId: undefined,
      clientId: undefined,
    });
    expect(url).not.toMatch(/serviceId|clientId/);
    expect(url).toContain('_action=booking%3Acreate');
  });

  it('encodes special characters in params', () => {
    const url = buildActionUrl('/test', 'marketing:broadcast', {
      clientIds: 'uuid1,uuid2',
    });
    expect(url).toContain('clientIds=uuid1%2Cuuid2');
  });
});
