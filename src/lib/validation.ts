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

// API schema — what the register endpoint accepts
export const registerApiSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  phone: z
    .string()
    .regex(/^04\d{2}\s?\d{3}\s?\d{3}$/, "Invalid Australian phone number (e.g. 0412 345 678)")
    .optional()
    .or(z.literal("")),
  role: UserRoleSchema,
});

// Form schema — includes confirmPassword and terms for client-side validation
export const registerFormSchema = registerApiSchema
  .extend({
    confirmPassword: z.string(),
    agreedToTerms: z.literal(true, {
      error: "You must agree to the terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Keep old name as alias for backwards compat
export const registerSchema = registerApiSchema;

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
    councilRates: z.number().positive().optional(),
    waterRates: z.number().positive().optional(),
    occupancyType: z.enum(["owner_occupier", "investment"]).optional(),
    reasonForSelling: z.string().max(1000).optional(),
    currentRentalAmount: z.number().positive().optional(),
    titleType: z.enum(["own_title", "survey_strata"]).optional(),
    bodyCorporateFees: z.number().positive().optional(),
    inspectionTimes: z
      .array(
        z.object({
          date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
          startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
          endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
        })
      )
      .optional(),
    buildingPestReportUrl: z.string().url().optional(),
    floorplanUrl: z.string().url().optional(),
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

// updateListingSchema is a partial of the base object (without refinements)
// Refinements are re-applied at the API route level when needed
export const updateListingSchema = z.object({
  streetAddress: z.string().min(1).optional(),
  suburb: z.string().min(1).optional(),
  state: AustralianStateSchema.optional(),
  postcode: z.string().regex(/^\d{4}$/, "Postcode must be 4 digits").optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propertyType: PropertyTypeSchema.optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(10).optional(),
  carSpaces: z.number().int().min(0).max(10).optional(),
  landSizeM2: z.number().int().positive().optional(),
  buildingSizeM2: z.number().int().positive().optional(),
  yearBuilt: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  title: z.string().max(100).optional(),
  description: z.string().min(50).max(5000).optional(),
  guidePriceCents: z.number().int().positive().optional(),
  guideRangeMaxCents: z.number().int().positive().optional(),
  saleMethod: SaleMethodSchema.optional(),
  closingDate: z.union([z.string().datetime(), z.null()]).optional(),
  minOfferCents: z.number().int().positive().optional(),
  requireDeposit: z.boolean().optional(),
  depositAmountCents: z.number().int().positive().optional(),
  features: z.array(z.string()).optional(),
  requireInspection: z.boolean().optional(),
  addressVisibility: z.enum(["PUBLIC", "LOGGED_IN", "BOOKED_ONLY"]).optional(),
  councilRates: z.number().positive().optional().nullable(),
  waterRates: z.number().positive().optional().nullable(),
  occupancyType: z.enum(["owner_occupier", "investment"]).optional().nullable(),
  reasonForSelling: z.string().max(1000).optional().nullable(),
  currentRentalAmount: z.number().positive().optional().nullable(),
  titleType: z.enum(["own_title", "survey_strata"]).optional().nullable(),
  bodyCorporateFees: z.number().positive().optional().nullable(),
  inspectionTimes: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
        startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
      })
    )
    .optional()
    .nullable(),
  buildingPestReportUrl: z.string().url().optional().nullable(),
  floorplanUrl: z.string().url().optional().nullable(),
});

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
    amountCents: z.number().int().positive().max(10_000_000_000, "Amount exceeds $100 million limit"),
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

// ── Checklist schema ──────────────────────────────────────────────────────────

export const updateChecklistSchema = z.object({
  itemKey: z.string().min(1),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
});

// ── Account schemas ───────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).trim(),
  lastName: z.string().min(1, "Last name is required").max(50).trim(),
  phone: z
    .string()
    .regex(/^04\d{2}\s?\d{3}\s?\d{3}$/, "Invalid Australian phone number (e.g. 0412 345 678)")
    .optional()
    .or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const notificationPrefsSchema = z.object({
  newOffers: z.boolean(),
  offerUpdates: z.boolean(),
  messages: z.boolean(),
  listingActivity: z.boolean(),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE", {
    error: "You must type DELETE to confirm",
  }),
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

// ── Inspection slot schemas ───────────────────────────────────────────────────

export const createInspectionSlotSchema = z.object({
  type: z.enum(["OPEN_HOUSE", "SCHEDULED"]),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  maxGroups: z.number().int().min(1).max(20).optional(),
  notes: z.string().max(300).optional(),
});

export const updateInspectionSlotSchema = z.object({
  notes: z.string().max(300).optional(),
  maxGroups: z.number().int().min(1).max(20).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  status: z.enum(["CANCELLED"]).optional(),
});
