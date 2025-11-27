import { describe, it, expect, vi } from "vitest";
import { ZodError } from "zod";
import { makeCreateCandidate } from "./createCandidate";
import type { CandidateRepo } from "@/core/ports/CandidateRepo";
import type { CandidateListItem, CandidateStatus } from "@/core/models/Candidate";

describe("makeCreateCandidate", () => {
  const mockCandidate: CandidateListItem = {
    id: "candidate-123",
    fullName: "John Doe",
    email: "john@example.com",
    status: "new",
    source: null,
    offerId: null,
    tags: [],
    note: null,
    createdAt: "2024-01-01T00:00:00Z",
  };

  const createMockRepo = (): CandidateRepo => ({
    listByOrg: vi.fn(),
    create: vi.fn().mockResolvedValue(mockCandidate),
    updateNote: vi.fn(),
    getById: vi.fn(),
    attachCv: vi.fn(),
  });

  it("should validate and create a candidate with minimal data", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    const result = await createCandidate({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "John Doe",
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "John Doe",
      email: null,
      status: undefined,
      source: null,
      tags: [],
      note: null,
      offerId: null,
    });
    expect(result).toEqual(mockCandidate);
  });

  it("should validate and create a candidate with all fields", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    const result = await createCandidate({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "Jane Smith",
      email: "jane@example.com",
      status: "interview",
      source: "LinkedIn",
      tags: ["senior", "react"],
      note: "Great candidate",
      offerId: "987fcdeb-51a2-43f7-8b9c-123456789abc",
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "Jane Smith",
      email: "jane@example.com",
      status: "interview",
      source: "LinkedIn",
      tags: ["senior", "react"],
      note: "Great candidate",
      offerId: "987fcdeb-51a2-43f7-8b9c-123456789abc",
    });
    expect(result).toEqual(mockCandidate);
  });

  it("should reject invalid email format", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);
  
    await expect(
      createCandidate({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        fullName: "John Doe",
        email: "not-an-email",
      })
    ).rejects.toThrow(ZodError);
  
    expect(mockRepo.create).not.toHaveBeenCalled();
  });
  it("should trim and normalize email", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await createCandidate({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "John Doe",
      email: "  john@example.com  ",
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "john@example.com",
      })
    );
  });

  it("should filter empty tags", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await createCandidate({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "John Doe",
      tags: ["react", "", "  ", "typescript"],
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["react", "typescript"],
      })
    );
  });

  it("should reject invalid UUID for orgId", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await expect(
      createCandidate({
        orgId: "not-a-uuid",
        fullName: "John Doe",
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject fullName too short", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await expect(
      createCandidate({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        fullName: "A",
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject invalid email format", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await expect(
      createCandidate({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        fullName: "John Doe",
        email: "not-an-email",
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject invalid status", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await expect(
      createCandidate({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        fullName: "John Doe",
        status: "invalid-status" as unknown as CandidateStatus,
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject source too long", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await expect(
      createCandidate({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        fullName: "John Doe",
        source: "a".repeat(121),
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject note too long", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await expect(
      createCandidate({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        fullName: "John Doe",
        note: "a".repeat(2001),
      })
    ).rejects.toThrow(ZodError);
  });

  it("should handle null email", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await createCandidate({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "John Doe",
      email: null,
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: null,
      })
    );
  });

  it("should trim fullName", async () => {
    const mockRepo = createMockRepo();
    const createCandidate = makeCreateCandidate(mockRepo);

    await createCandidate({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      fullName: "  John Doe  ",
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "John Doe",
      })
    );
  });
});

