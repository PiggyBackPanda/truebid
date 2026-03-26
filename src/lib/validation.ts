import { z } from "zod";

// ── Shared enums ──────────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum(["BUYER", "SELLER", "BOTH"]);

export const AustralianStateSchema = z.enum([
  "WA",
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "TAS",
  "ACT",
  "NT",
]);

export const PropertyTypeSchema = z.enum([
  "HOUSE",
  "APARTMENT",
  "TOWNHOUSE",
  "VILLA",
  "LAND",
  "RURAL",
  "OTHER",
]);

export const SaleMethodSchema = z.enum([
  "OPEN_OFFERS",
  "PRIVATE_OFFERS",
  "FIXED_PRICE",
]);

export const ConditionTypeSchema = z.enum([
  "UNCONDITIONAL",
  "SUBJECT_TO_FINANCE",
  "SUBJECT_TO_BUILDING_PEST",
  "SUBJECT_TO_BOTH",
  "SUBJECT_TO_SALE",
  "OTHER",
]);

const VALID_SETTLEMENT_DAYS = [14, 21, 30, 45, 60, 90, 120] as const;

// ── Auth schemas ──────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .regex(/^04\d{2}\s?\d{3}\s?\d{3}$/, "Invalid Australian phone number")
    .optional(),
  role: UserRoleSchema,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Listing schemas ───────────────────────────────────────────────────────────

export const createListingSchema = z
  .object({
    streetAddress: z.string().min(1),
    suburb: z.string().min(1),
    state: AustralianStateSchema,
    postcode: z.string().regex(/^\d{4}$/, "Postcode must be 4 digits"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    propertyType: PropertyTypeSchema,
    bedrooms: z.number().int().min(0).max(20),
    bathrooms: z.number().int().min(0).max(10),
    carSpaces: z.number().int().min(0).max(10),
    landSizeM2: z.number().int().positive().optional(),
    buildingSizeM2: z.number().int().positive().optional(),
    yearBuilt: z
      .number()
      .int()
      .min(1800)
      .max(new Date().getFullYear())
      .optional(),
    title: z.string().max(100).optional(),
    description: z
      .string()
      .min(50, "Description must be at least 50 characters")
      .max(5000, "Description must be at most 5000 characters"),
    guidePriceCents: z.number().int().positive().optional(),
    guideRangeMaxCents: z.number().int().positive().optional(),
    saleMethod: SaleMethodSchema,
    closingDate: z.string().datetime().optional(),
    minOfferCents: z.number().int().positive().optional(),
    requireDeposit: z.boolean().optional(),
    depositAmountCents: z.number().int().positive().optional(),
    features: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.guideRangeMaxCents && data.guidePriceCents) {
        return data.guideRangeMaxCents > data.guidePriceCents;
      }
      return true;
    },
    {
      message: "guideRangeMaxCents must be greater than guidePriceCents",
      path: ["guideRangeMaxCents"],
    }
  )
  .refine(
    (data) => {
      if (data.saleMethod === "OPEN_OFFERS") {
        if (!data.closingDate) return false;
        const closing = new Date(data.closingDate);
        const minDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
        return closing >= minDate;
      }
      return true;
    },
    {
      message:
        "Open Offers listings require a closing date at least 14 days in the future",
      path: ["closingDate"],
    }
  );

export const updateListingSchema = createListingSchema.partial();

// ── Offer schemas ─────────────────────────────────────────────────────────────

export const createOfferSchema = z
  .object({
    listingId: z.string().cuid(),
    amountCents: z
      .number()
      .int()
      .positive()
      .max(10_000_000_000, "Amount exceeds $100 million limit"),
    conditionType: ConditionTypeSchema,
    conditionText: z.string().min(1).max(500).optional(),
    settlementDays: z.number().int().refine(
      (v) => (VALID_SETTLEMENT_DAYS as readonly number[]).includes(v),
      { message: "Settlement days must be one of: 14, 21, 30, 45, 60, 90, 120" }
    ),
    personalNote: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.conditionType === "OTHER") {
        return !!data.conditionText;
      }
      return true;
    },
    {
      message: "Condition text is required when condition type is OTHER",
      path: ["conditionText"],
    }
  );

export const increaseOfferSchema = z
  .object({
    amountCents: z.number().int().positive(),
    conditionType: ConditionTypeSchema.optional(),
    conditionText: z.string().min(1).max(500).optional(),
    settlementDays: z
      .number()
      .int()
      .refine((v) => (VALID_SETTLEMENT_DAYS as readonly number[]).includes(v))
      .optional(),
  });

// ── Message schemas ───────────────────────────────────────────────────────────

export const createMessageSchema = z.object({
  recipientId: z.string().cuid(),
  listingId: z.string().cuid(),
  content: z.string().min(1).max(2000),
});

// ── Image reorder schema ──────────────────────────────────────────────────────

export const reorderImagesSchema = z.object({
  imageIds: z.array(z.string().cuid()).min(1),
});

// ── Pagination schema ─────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// ── Listing search/filter schema ──────────────────────────────────────────────

export const listingSearchSchema = paginationSchema.extend({
  suburb: z.string().optional(),
  postcode: z.string().optional(),
  state: AustralianStateSchema.optional(),
  propertyType: PropertyTypeSchema.optional(),
  saleMethod: SaleMethodSchema.optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  minBeds: z.coerce.number().int().optional(),
  maxBeds: z.coerce.number().int().optional(),
  minBaths: z.coerce.number().int().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "closing_soon"])
    .default("newest"),
  q: z.string().optional(),
});
