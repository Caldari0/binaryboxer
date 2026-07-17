// ============================================================
// Binary Boxer — Bout routes (/api/fight/*)
// Thin zod-validated HTTP surface over the transactional command
// service. Replaces the old combat routes (whole-fight autoPick
// resolve + non-transactional complete), deleted in this commit.
// ============================================================

import { Hono, type Context } from 'hono';
import { reddit } from '@devvit/web/server';
import type { ZodType } from 'zod';
import { log } from '../logger';
import {
  AcknowledgeRequestSchema,
  AdvanceRequestSchema,
  StartBoutRequestSchema,
  errorResponse,
} from '../../shared/contracts';
import { DevvitStore } from '../persistence/devvitStore';
import {
  acknowledgeBout,
  advanceBout,
  currentBout,
  startBout,
  type ServiceResult,
} from '../fight/service';

export const fight = new Hono();

const store = new DevvitStore();

const parseBody = async <T>(
  c: { req: { json: () => Promise<unknown> } },
  schema: ZodType<T>,
): Promise<{ ok: true; data: T } | { ok: false; message: string }> => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return { ok: false, message: 'request body must be JSON' };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      message: issue ? `${issue.path.join('.') || 'body'}: ${issue.message}` : 'invalid body',
    };
  }
  return { ok: true, data: parsed.data };
};

const respond = <T>(c: Context, result: ServiceResult<T>): Response => {
  if (result.ok) return c.json(result.response as Record<string, unknown>, 200);
  return c.json(result.response as unknown as Record<string, unknown>, result.status);
};

const withUser = async (
  c: Context,
  route: string,
  handler: (username: string) => Promise<Response>,
): Promise<Response> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) {
      return c.json(errorResponse('UNAUTHENTICATED', 'could not determine username'), 401);
    }
    return await handler(username);
  } catch (error) {
    log.error(route, 'bout command failed', error);
    return c.json(errorResponse('INTERNAL', 'internal error'), 500);
  }
};

fight.post('/start', (c) =>
  withUser(c, '/api/fight/start', async (username) => {
    const body = await parseBody(c, StartBoutRequestSchema);
    if (!body.ok) return c.json(errorResponse('VALIDATION', body.message), 400);
    return respond(c, await startBout(store, username, body.data, Date.now()));
  }),
);

fight.post('/advance', (c) =>
  withUser(c, '/api/fight/advance', async (username) => {
    const body = await parseBody(c, AdvanceRequestSchema);
    if (!body.ok) return c.json(errorResponse('VALIDATION', body.message), 400);
    return respond(c, await advanceBout(store, username, body.data, Date.now()));
  }),
);

fight.post('/acknowledge', (c) =>
  withUser(c, '/api/fight/acknowledge', async (username) => {
    const body = await parseBody(c, AcknowledgeRequestSchema);
    if (!body.ok) return c.json(errorResponse('VALIDATION', body.message), 400);
    return respond(c, await acknowledgeBout(store, username, body.data, Date.now()));
  }),
);

fight.get('/current', (c) =>
  withUser(c, '/api/fight/current', async (username) =>
    respond(c, await currentBout(store, username)),
  ),
);
