"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CreateListingProgress } from "@/components/listings/CreateListingProgress";

const PROPERTY_TYPES = ["HOUSE", "APARTMENT", "TOWNHOUSE", "VILLA", "LAND", "RURAL", "OTHER"] as const;
const STATES = ["WA", "NSW", "VIC", "QLD", "SA", "TAS", "ACT", "NT"] as const;
const FEATURE_SUGGESTIONS = [
  "Renovated kitchen", "Pool", "Solar panels", "Air conditioning", "Garden",
  "Garage", "Near beach", "Near schools", "Near shops", "Near transport",
  "Views", "Quiet street", "Corner block", "Granny flat", "Home office",
];

interface InspectionTime {
  date: string;
  startTime: string;
  endTime: string;
}

function NumberPicker({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text hover:bg-bg transition-colors font-semibold"
          disabled={value <= min}
        >
          −
        </button>
        <span className="text-sm font-semibold text-text w-6 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-text hover:bg-bg transition-colors font-semibold"
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}

async function uploadDocument(
  listingId: string,
  file: File,
  documentType: "buildingPestReport" | "floorplan"
): Promise<string> {
  const urlRes = await fetch(`/api/listings/${listingId}/documents/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      documentType,
    }),
  });
  if (!urlRes.ok) throw new Error("Failed to get upload URL");
  const { uploadUrl, publicUrl } = await urlRes.json();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
    xhr.onerror = reject;
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });

  return publicUrl as string;
}

function SellerResponsibilitiesNotice() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8 rounded-[10px] border border-border bg-surface text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-text-muted hover:text-text transition-colors"
        aria-expanded={open}
      >
        <span className="font-medium text-text-muted">Important: Your responsibilities as a seller</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul className="px-4 pb-4 flex flex-col gap-2.5 text-text-muted leading-relaxed list-disc list-inside marker:text-text-muted">
          <li>
            You are responsible for complying with your state&apos;s vendor disclosure obligations (for example, a Section 10 notice in WA or Section 32 Vendor&apos;s Statement in VIC). TrueBid does not prepare these documents.
          </li>
          <li>
            All information in your listing must be accurate and not misleading. You are responsible for its content.
          </li>
          <li>
            You will need a licensed conveyancer or settlement agent to prepare and manage the Contract of Sale. TrueBid does not provide legal or conveyancing services.
          </li>
        </ul>
      )}
    </div>
  );
}

function DetailsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get("id");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");

  // Address fields
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState<string>("WA");
  const [postcode, setPostcode] = useState("");

  // Property details
  const [propertyType, setPropertyType] = useState<string>("HOUSE");
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(1);
  const [carSpaces, setCarSpaces] = useState(1);
  const [landSizeM2, setLandSizeM2] = useState("");
  const [buildingSizeM2, setBuildingSizeM2] = useState("");
  const [yearBuilt, setYearBuilt] = useState("");

  // Description
  const [description, setDescription] = useState("");
  const descRef = useRef<HTMLTextAreaElement>(null);

  // Additional property details
  const [councilRates, setCouncilRates] = useState("");
  const [waterRates, setWaterRates] = useState("");
  const [occupancyType, setOccupancyType] = useState<"" | "owner_occupier" | "investment">("");
  const [reasonForSelling, setReasonForSelling] = useState("");
  const [currentRentalAmount, setCurrentRentalAmount] = useState("");
  const [titleType, setTitleType] = useState<"" | "own_title" | "survey_strata">("");
  const [bodyCorporateFees, setBodyCorporateFees] = useState("");
  const [inspectionTimes, setInspectionTimes] = useState<InspectionTime[]>([]);
  const [pestReportFile, setPestReportFile] = useState<File | null>(null);
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null);
  const pestReportInputRef = useRef<HTMLInputElement>(null);
  const floorplanInputRef = useRef<HTMLInputElement>(null);

  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (!existingId) return;
    setLoadingExisting(true);
    fetch(`/api/listings/${existingId}`)
      .then((r) => r.json())
      .then((data: { listing?: Record<string, unknown> }) => {
        const l = data.listing;
        if (!l) return;
        if (typeof l.streetAddress === "string") setStreetAddress(l.streetAddress);
        if (typeof l.suburb === "string") setSuburb(l.suburb);
        if (typeof l.state === "string") setState(l.state);
        if (typeof l.postcode === "string") setPostcode(l.postcode);
        if (typeof l.propertyType === "string") setPropertyType(l.propertyType);
        if (typeof l.bedrooms === "number") setBedrooms(l.bedrooms);
        if (typeof l.bathrooms === "number") setBathrooms(l.bathrooms);
        if (typeof l.carSpaces === "number") setCarSpaces(l.carSpaces);
        if (l.landSizeM2 != null) setLandSizeM2(String(l.landSizeM2));
        if (l.buildingSizeM2 != null) setBuildingSizeM2(String(l.buildingSizeM2));
        if (l.yearBuilt != null) setYearBuilt(String(l.yearBuilt));
        if (typeof l.description === "string") setDescription(l.description);
        if (Array.isArray(l.features)) setFeatures(l.features as string[]);
        if (l.councilRates != null) setCouncilRates(String(l.councilRates));
        if (l.waterRates != null) setWaterRates(String(l.waterRates));
        if (typeof l.occupancyType === "string") setOccupancyType(l.occupancyType as "" | "owner_occupier" | "investment");
        if (typeof l.reasonForSelling === "string") setReasonForSelling(l.reasonForSelling);
        if (l.currentRentalAmount != null) setCurrentRentalAmount(String(l.currentRentalAmount));
        if (typeof l.titleType === "string") setTitleType(l.titleType as "" | "own_title" | "survey_strata");
        if (l.bodyCorporateFees != null) setBodyCorporateFees(String(l.bodyCorporateFees));
      })
      .finally(() => setLoadingExisting(false));
  }, [existingId]);

  function addFeature(f: string) {
    const trimmed = f.trim();
    if (trimmed && !features.includes(trimmed) && features.length < 20) {
      setFeatures((prev) => [...prev, trimmed]);
    }
  }

  function removeFeature(f: string) {
    setFeatures((prev) => prev.filter((x) => x !== f));
  }

  function addInspectionTime() {
    setInspectionTimes((prev) => [...prev, { date: "", startTime: "", endTime: "" }]);
  }

  function updateInspectionTime(index: number, field: keyof InspectionTime, value: string) {
    setInspectionTimes((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeInspectionTime(index: number) {
    setInspectionTimes((prev) => prev.filter((_, i) => i !== index));
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!streetAddress.trim()) newErrors.streetAddress = "Street address is required";
    if (!suburb.trim()) newErrors.suburb = "Suburb is required";
    if (!postcode.match(/^\d{4}$/)) newErrors.postcode = "Postcode must be 4 digits";
    if (description.length < 50) newErrors.description = "Description must be at least 50 characters";
    if (description.length > 5000) newErrors.description = "Description must be at most 5000 characters";
    if (yearBuilt && (parseInt(yearBuilt) < 1800 || parseInt(yearBuilt) > new Date().getFullYear())) {
      newErrors.yearBuilt = `Year must be between 1800 and ${new Date().getFullYear()}`;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      // Collect valid inspection times (skip incomplete entries)
      const validInspectionTimes = inspectionTimes.filter(
        (t) => t.date && t.startTime && t.endTime
      );

      const baseBody = {
        streetAddress: streetAddress.trim(),
        suburb: suburb.trim(),
        state,
        postcode,
        propertyType,
        bedrooms,
        bathrooms,
        carSpaces,
        landSizeM2: landSizeM2 ? parseInt(landSizeM2) : undefined,
        buildingSizeM2: buildingSizeM2 ? parseInt(buildingSizeM2) : undefined,
        yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
        description: description.trim(),
        features: features.length > 0 ? features : undefined,
        // Additional property details
        councilRates: councilRates ? parseFloat(councilRates) : undefined,
        waterRates: waterRates ? parseFloat(waterRates) : undefined,
        occupancyType: occupancyType || undefined,
        reasonForSelling: reasonForSelling.trim() || undefined,
        currentRentalAmount:
          occupancyType === "investment" && currentRentalAmount
            ? parseFloat(currentRentalAmount)
            : undefined,
        titleType: titleType || undefined,
        bodyCorporateFees:
          titleType === "survey_strata" && bodyCorporateFees
            ? parseFloat(bodyCorporateFees)
            : undefined,
        inspectionTimes: validInspectionTimes.length > 0 ? validInspectionTimes : undefined,
        // Temporary default: overridden in Step 3 (Sale Method)
        saleMethod: "FIXED_PRICE",
      };

      let listingId = existingId;

      if (listingId) {
        // Update existing draft
        const res = await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baseBody),
        });
        if (!res.ok) {
          const data = await res.json();
          const detail = data.details?.[0];
          const fieldHint = detail ? ` (${detail.path?.join(".") ?? "unknown field"}: ${detail.message})` : "";
          setErrors({ form: (data.error ?? "Failed to save listing") + fieldHint });
          return;
        }
      } else {
        // Create new draft
        const res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baseBody),
        });

        if (!res.ok) {
          const data = await res.json();
          const detail = data.details?.[0];
          const fieldHint = detail ? ` (${detail.path?.join(".") ?? "unknown field"}: ${detail.message})` : "";
          setErrors({ form: (data.error ?? "Failed to save listing") + fieldHint });
          return;
        }

        const data = await res.json();
        listingId = data.listing.id;
      }

      // Upload documents if selected, then PATCH listing with URLs
      const documentPatches: Record<string, string> = {};
      const uploadErrors: string[] = [];

      if (pestReportFile) {
        try {
          const url = await uploadDocument(listingId!, pestReportFile, "buildingPestReport");
          documentPatches.buildingPestReportUrl = url;
        } catch {
          uploadErrors.push("Building & Pest Report failed to upload");
        }
      }

      if (floorplanFile) {
        try {
          const url = await uploadDocument(listingId!, floorplanFile, "floorplan");
          documentPatches.floorplanUrl = url;
        } catch {
          uploadErrors.push("Floorplan failed to upload");
        }
      }

      if (Object.keys(documentPatches).length > 0) {
        await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(documentPatches),
        });
      }

      if (uploadErrors.length > 0) {
        setErrors({ form: uploadErrors.join(". ") + ". Other details saved. You can re-upload on the next visit." });
        // Still navigate forward
      }

      router.push(`/listings/create/photos?id=${listingId}`);
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <CreateListingProgress />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 className="font-serif text-2xl text-navy mb-1">Property details</h1>
        <p className="text-sm text-text-muted mb-4">Tell buyers about your property. You can edit this later.</p>

        <SellerResponsibilitiesNotice />

        {loadingExisting && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8" style={{ display: loadingExisting ? "none" : undefined }}>
          {errors.form && (
            <div className="bg-red/10 border border-red/30 rounded-[10px] px-4 py-3 text-sm text-red">
              {errors.form}
            </div>
          )}

          {/* Address */}
          <section>
            <h2 className="text-base font-semibold text-navy mb-4">Address</h2>
            <div className="flex flex-col gap-4">
              <Input
                label="Street address"
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                error={errors.streetAddress}
                placeholder="e.g. 42 Harbour View Drive"
                maxLength={200}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Input
                    label="Suburb"
                    required
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    error={errors.suburb}
                    placeholder="e.g. Cottesloe"
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-text block mb-1.5">
                    State <span className="text-red ml-1" aria-hidden>*</span>
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-white border border-border rounded-[10px] px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                  >
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    label="Postcode"
                    required
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    error={errors.postcode}
                    placeholder="6011"
                    inputMode="numeric"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Property details */}
          <section>
            <h2 className="text-base font-semibold text-navy mb-4">Property details</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">
                  Property type <span className="text-red ml-1" aria-hidden>*</span>
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full bg-white border border-border rounded-[10px] px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase().replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <NumberPicker label="Bedrooms" value={bedrooms} min={0} max={20} onChange={setBedrooms} />
                <NumberPicker label="Bathrooms" value={bathrooms} min={0} max={10} onChange={setBathrooms} />
                <NumberPicker label="Car spaces" value={carSpaces} min={0} max={10} onChange={setCarSpaces} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Land size (m²)"
                  value={landSizeM2}
                  onChange={(e) => setLandSizeM2(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 450"
                  inputMode="numeric"
                />
                <Input
                  label="Building size (m²)"
                  value={buildingSizeM2}
                  onChange={(e) => setBuildingSizeM2(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 180"
                  inputMode="numeric"
                />
                <Input
                  label="Year built"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  error={errors.yearBuilt}
                  placeholder="e.g. 1998"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-navy">Description</h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your property: its features, lifestyle appeal, and what makes it special..."
                rows={8}
                maxLength={5000}
                className={`w-full bg-white border rounded-[10px] px-4 py-3 text-sm text-text placeholder:text-text-light transition-colors focus:outline-none focus:ring-2 resize-y ${
                  errors.description
                    ? "border-red focus:border-red focus:ring-red/20"
                    : "border-border focus:ring-sky/20 focus:border-sky"
                }`}
              />
              <div className="flex justify-between">
                {errors.description ? (
                  <p className="text-xs text-red" role="alert">{errors.description}</p>
                ) : (
                  <p className="text-xs text-text-muted">Minimum 50 characters</p>
                )}
                <p className={`text-xs ${description.length > 4800 ? "text-red" : "text-text-muted"}`}>
                  {description.length}/5000
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-base font-semibold text-navy mb-4">Features</h2>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {FEATURE_SUGGESTIONS.map((f) => {
                  const selected = features.includes(f);
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => selected ? removeFeature(f) : addFeature(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? "bg-amber text-navy border-amber"
                          : "bg-white text-text border-border hover:border-slate"
                      }`}
                    >
                      {selected ? "✓ " : ""}{f}
                    </button>
                  );
                })}
              </div>

              {features.filter((f) => !FEATURE_SUGGESTIONS.includes(f)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {features.filter((f) => !FEATURE_SUGGESTIONS.includes(f)).map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber text-navy border border-amber flex items-center gap-1"
                    >
                      {f}
                      <button type="button" onClick={() => removeFeature(f)} className="hover:opacity-75">×</button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature(featureInput);
                      setFeatureInput("");
                    }
                  }}
                  placeholder="Add custom feature and press Enter"
                  maxLength={50}
                  className="flex-1 bg-white border border-border rounded-[10px] px-4 py-2.5 text-sm text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { addFeature(featureInput); setFeatureInput(""); }}
                >
                  Add
                </Button>
              </div>
            </div>
          </section>

          {/* Additional Property Details */}
          <section>
            <h2 className="text-base font-semibold text-navy mb-1">Additional Property Details</h2>
            <p className="text-sm text-text-muted mb-4">All fields in this section are optional.</p>

            <div className="flex flex-col gap-5">
              {/* Council & Water Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Annual Council Rates ($)"
                  value={councilRates}
                  onChange={(e) => setCouncilRates(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="e.g. 1800"
                  inputMode="decimal"
                />
                <Input
                  label="Annual Water Rates ($)"
                  value={waterRates}
                  onChange={(e) => setWaterRates(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="e.g. 1200"
                  inputMode="decimal"
                />
              </div>

              {/* Occupancy Type */}
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Occupancy Type</label>
                <select
                  value={occupancyType}
                  onChange={(e) => {
                    setOccupancyType(e.target.value as "" | "owner_occupier" | "investment");
                    if (e.target.value !== "investment") setCurrentRentalAmount("");
                  }}
                  className="w-full bg-white border border-border rounded-[10px] px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                >
                  <option value="">Select occupancy type</option>
                  <option value="owner_occupier">Owner Occupied</option>
                  <option value="investment">Investment Property</option>
                </select>
              </div>

              {/* Current Rental Amount: only shown for Investment */}
              {occupancyType === "investment" && (
                <Input
                  label="Current Weekly Rent ($)"
                  value={currentRentalAmount}
                  onChange={(e) => setCurrentRentalAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="e.g. 500"
                  inputMode="decimal"
                />
              )}

              {/* Reason for Selling */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Reason for Selling</label>
                <textarea
                  value={reasonForSelling}
                  onChange={(e) => setReasonForSelling(e.target.value)}
                  placeholder="e.g. Upsizing to accommodate a growing family"
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-white border border-border rounded-[10px] px-4 py-3 text-sm text-text placeholder:text-text-light transition-colors focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky resize-y"
                />
              </div>

              {/* Title Type */}
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Title Type</label>
                <select
                  value={titleType}
                  onChange={(e) => {
                    setTitleType(e.target.value as "" | "own_title" | "survey_strata");
                    if (e.target.value !== "survey_strata") setBodyCorporateFees("");
                  }}
                  className="w-full bg-white border border-border rounded-[10px] px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                >
                  <option value="">Select title type</option>
                  <option value="own_title">Green Title</option>
                  <option value="survey_strata">Survey Strata / Strata Title</option>
                </select>
              </div>

              {/* Body Corporate Fees: only shown for Survey Strata */}
              {titleType === "survey_strata" && (
                <Input
                  label="Quarterly Body Corporate Fees ($)"
                  value={bodyCorporateFees}
                  onChange={(e) => setBodyCorporateFees(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="e.g. 800"
                  inputMode="decimal"
                />
              )}

              {/* Open for Inspection Times */}
              <div>
                <label className="text-sm font-medium text-text block mb-2">Open for Inspection Times</label>
                {inspectionTimes.length > 0 && (
                  <div className="flex flex-col gap-3 mb-3">
                    {inspectionTimes.map((slot, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end bg-bg border border-border rounded-[10px] p-3"
                      >
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-text-muted">Date</label>
                          <input
                            type="date"
                            value={slot.date}
                            onChange={(e) => updateInspectionTime(index, "date", e.target.value)}
                            className="bg-white border border-border rounded-[8px] px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-text-muted">Start Time</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateInspectionTime(index, "startTime", e.target.value)}
                            className="bg-white border border-border rounded-[8px] px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-text-muted">End Time</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateInspectionTime(index, "endTime", e.target.value)}
                            className="bg-white border border-border rounded-[8px] px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-sky/20 focus:border-sky transition-colors"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeInspectionTime(index)}
                          className="text-xs text-red hover:underline whitespace-nowrap pb-2 md:pb-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={addInspectionTime}
                  className="inline-flex items-center gap-2 text-sm text-slate hover:text-navy transition-colors border border-border rounded-[10px] px-4 py-2 bg-white hover:border-slate"
                >
                  <span className="text-base leading-none">+</span>
                  Add{inspectionTimes.length > 0 ? " Another" : ""} Time
                </button>
              </div>

              {/* Building & Pest Report */}
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">
                  Building &amp; Pest Inspection Report (PDF)
                </label>
                {pestReportFile ? (
                  <div className="flex items-center gap-3 bg-bg border border-border rounded-[10px] p-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red flex-shrink-0">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span className="text-sm text-text flex-1 truncate">{pestReportFile.name}</span>
                    <button
                      type="button"
                      onClick={() => { setPestReportFile(null); if (pestReportInputRef.current) pestReportInputRef.current.value = ""; }}
                      className="text-xs text-red hover:underline flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white border border-border rounded-[10px] px-4 py-2 text-sm text-text hover:border-slate transition-colors">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    Upload report
                    <input
                      ref={pestReportInputRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) setPestReportFile(e.target.files[0]); }}
                    />
                  </label>
                )}
                <p className="text-xs text-text-muted mt-1.5">PDF only · max 20 MB</p>
              </div>

              {/* Floorplan */}
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Floorplan</label>
                {floorplanFile ? (
                  <div className="flex items-center gap-3 bg-bg border border-border rounded-[10px] p-3">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-navy flex-shrink-0">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                    <span className="text-sm text-text flex-1 truncate">{floorplanFile.name}</span>
                    <button
                      type="button"
                      onClick={() => { setFloorplanFile(null); if (floorplanInputRef.current) floorplanInputRef.current.value = ""; }}
                      className="text-xs text-red hover:underline flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-white border border-border rounded-[10px] px-4 py-2 text-sm text-text hover:border-slate transition-colors">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                    </svg>
                    Upload floorplan
                    <input
                      ref={floorplanInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) setFloorplanFile(e.target.files[0]); }}
                    />
                  </label>
                )}
                <p className="text-xs text-text-muted mt-1.5">JPG, PNG, WebP or PDF · max 20 MB</p>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" loading={submitting}>
              Continue to Photos
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DetailsPage() {
  return (
    <Suspense>
      <DetailsForm />
    </Suspense>
  );
}
