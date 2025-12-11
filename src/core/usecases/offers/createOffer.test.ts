import { describe, it, expect, vi } from "vitest";
import { ZodError } from "zod";
import { makeCreateOffer } from "./createOffer";
import type { OfferRepo } from "@/core/ports/OfferRepo";
import type { Offer, OfferStatus } from "@/core/models/Offer";

describe("makeCreateOffer", () => {
  const mockOffer: Offer = {
    id: "offer-123",
    orgId: "123e4567-e89b-12d3-a456-426614174000",
    title: "Senior Developer",
    description: "Great opportunity",
    status: "draft",
    createdAt: "2024-01-01T00:00:00Z",
    city: "Paris",
    country: "France",
    isRemote: false,
    remotePolicy: "hybrid",
    contractType: "CDI",
    salaryMin: 100000,
    salaryMax: 150000,
    currency: "EUR",
    createdBy: "123e4567-e89b-12d3-a456-426614174000",
    responsibleUserId: "123e4567-e89b-12d3-a456-426614174000",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  const createMockRepo = (): OfferRepo => ({
    listByOrg: vi.fn(),
    getById: vi.fn(),
    create: vi.fn().mockResolvedValue(mockOffer),
    update: vi.fn(),
    deleteById: vi.fn(),
  });

  it("should validate and create an offer with minimal data", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    const result = await createOffer({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Senior Developer",
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Senior Developer",
      description: null,
      status: undefined,
    });
    expect(result).toEqual(mockOffer);
  });

  it("should validate and create an offer with all fields", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    const result = await createOffer({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Senior Developer",
      description: "Great opportunity for experienced developers",
      status: "published",
      city: "Paris",
      country: "France",
      isRemote: false,
      remotePolicy: "hybrid",
      contractType: "CDI",
      salaryMin: 100000,
      salaryMax: 150000,
      currency: "EUR",
      createdBy: "123e4567-e89b-12d3-a456-426614174000",
      responsibleUserId: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(mockRepo.create).toHaveBeenCalledWith({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Senior Developer",
      description: "Great opportunity for experienced developers",
      status: "published",
      city: "Paris",
      country: "France",
      isRemote: false,
      remotePolicy: "hybrid",
      contractType: "CDI",
      salaryMin: 100000,
      salaryMax: 150000,
      currency: "EUR",
      createdBy: "123e4567-e89b-12d3-a456-426614174000",
      responsibleUserId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(result).toEqual(mockOffer);
  });

  it("should trim title", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    await createOffer({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      title: "  Senior Developer  ",
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Senior Developer",
      })
    );
  });

  it("should trim description", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    await createOffer({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Senior Developer",
      description: "  Great opportunity  ",
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Great opportunity",
      })
    );
  });

  it("should reject invalid UUID for orgId", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    await expect(
      createOffer({
        orgId: "not-a-uuid",
        title: "Senior Developer",
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject title too short", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    await expect(
      createOffer({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        title: "AB",
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject title too long", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    await expect(
      createOffer({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        title: "a".repeat(121),
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject description too long", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    await expect(
      createOffer({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Senior Developer",
        description: "a".repeat(5001),
      })
    ).rejects.toThrow(ZodError);
  });

  it("should reject invalid status", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    await expect(
      createOffer({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Senior Developer",
        status: "invalid-status" as unknown as OfferStatus,
      })
    ).rejects.toThrow(ZodError);
  });

  it("should handle null description", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    await createOffer({
      orgId: "123e4567-e89b-12d3-a456-426614174000",
      title: "Senior Developer",
      description: null,
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
      })
    );
  });

  it("should accept all valid statuses", async () => {
    const mockRepo = createMockRepo();
    const createOffer = makeCreateOffer(mockRepo);

    const statuses = ["draft", "published", "archived"] as const;

    for (const status of statuses) {
      await createOffer({
        orgId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Senior Developer",
        status,
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status,
        })
      );
    }
  });
});

