import { describe, expect, it, vi } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Permission, RequestContext } from "../../shared/index.js";
import { requireAllScope, requirePermission } from "./permission-guard.js";

function fakeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    userId: "user-1",
    orgId: "org-1",
    staffId: null,
    customerId: null,
    permissions: new Set<Permission>(),
    scope: "BRANCH",
    allowedBranchIds: [],
    ...overrides,
  };
}

function fakeReply() {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
}

describe("requirePermission", () => {
  it("rejects with 403 when the permission is missing", async () => {
    const request = { ctx: fakeCtx({ permissions: new Set<Permission>(["branch:view"]) }) } as FastifyRequest;
    const reply = fakeReply();

    await requirePermission("branch:create")(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
  });

  it("passes through when the permission is present", async () => {
    const request = { ctx: fakeCtx({ permissions: new Set<Permission>(["branch:create"]) }) } as FastifyRequest;
    const reply = fakeReply();

    await requirePermission("branch:create")(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });
});

describe("requireAllScope", () => {
  it("rejects a BRANCH-scoped caller with 403", async () => {
    const request = { ctx: fakeCtx({ scope: "BRANCH" }) } as FastifyRequest;
    const reply = fakeReply();

    await requireAllScope()(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
  });

  it("passes through an ALL-scoped caller", async () => {
    const request = { ctx: fakeCtx({ scope: "ALL" }) } as FastifyRequest;
    const reply = fakeReply();

    await requireAllScope()(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });
});
