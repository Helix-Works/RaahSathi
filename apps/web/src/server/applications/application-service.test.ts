import { Prisma, type PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { assertResourceOwner } from "@/server/auth/authorization";

import {
  assertExpectedRevision,
  completionDecision,
  deriveApplicationPresentation,
  listApplications,
} from "./application-service";

describe("durable application workflow", () => {
  it("derives status, progress, and next action only from completed backend sections", () => {
    expect(deriveApplicationPresentation([])).toEqual({ statusCode: "DRAFT", progressPercent: 0, nextActionCode: "COMPLETE_PERSONAL_DETAILS" });
    expect(deriveApplicationPresentation(["PERSONAL_DETAILS", "ADDRESS"])).toEqual({ statusCode: "IN_PROGRESS", progressPercent: 50, nextActionCode: "COMPLETE_SERVICE_DETAILS" });
    expect(deriveApplicationPresentation(["PERSONAL_DETAILS", "ADDRESS", "SERVICE_DETAILS", "DECLARATION"])).toEqual({
      statusCode: "READY_FOR_IDENTITY", progressPercent: 100, nextActionCode: "VERIFY_IDENTITY", blockingReasonCode: "IDENTITY_VERIFICATION_REQUIRED",
    });
    expect(deriveApplicationPresentation(["PERSONAL_DETAILS", "ADDRESS", "SERVICE_DETAILS", "DECLARATION"], true)).toEqual({
      statusCode: "READY_FOR_PAYMENT", progressPercent: 100, nextActionCode: "PAY_FEES", blockingReasonCode: "PAYMENT_REQUIRED",
    });
    expect(deriveApplicationPresentation(["PERSONAL_DETAILS", "ADDRESS", "SERVICE_DETAILS", "DECLARATION"], true, true)).toEqual({
      statusCode: "READY_FOR_APPOINTMENT", progressPercent: 100, nextActionCode: "NONE",
    });
  });

  it("rejects cross-applicant ownership", () => {
    expect(() => assertResourceOwner("applicant-a", { sessionId: "session", applicantId: "applicant-b" })).toThrowError(/ACCESS_DENIED/);
  });

  it("rejects stale revisions instead of silently overwriting another saved draft", () => {
    expect(() => assertExpectedRevision(1, 2)).toThrowError(/APPLICATION_REVISION_CONFLICT/);
    expect(() => assertExpectedRevision(2, 2)).not.toThrow();
  });

  it("rejects out-of-order completion and makes duplicate completion idempotent", () => {
    expect(() => completionDecision("ADDRESS", ["ADDRESS"], [])).toThrowError(/APPLICATION_TRANSITION_INVALID/);
    expect(completionDecision("PERSONAL_DETAILS", ["PERSONAL_DETAILS"], [])).toBe("complete");
    expect(completionDecision("PERSONAL_DETAILS", ["PERSONAL_DETAILS"], ["PERSONAL_DETAILS"])).toBe("already-complete");
  });

  it("retries application-list reconstruction once after P1017", async () => {
    let executions = 0;
    const database = {
      application: {
        findMany: async () => {
          executions += 1;
          if (executions === 1) {
            throw new Prisma.PrismaClientKnownRequestError("Server has closed the connection.", {
              code: "P1017",
              clientVersion: Prisma.prismaVersion.client,
            });
          }
          return [];
        },
      },
    } as unknown as PrismaClient;

    await expect(listApplications(
      { sessionId: crypto.randomUUID(), applicantId: crypto.randomUUID() },
      database,
    )).resolves.toEqual([]);
    expect(executions).toBe(2);
  });
});
