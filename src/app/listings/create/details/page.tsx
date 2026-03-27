"use client";

import { useState, useRef, Suspense } from "react";
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

function DetailsForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get("id");

  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  function addFeature(f: string) {
    const trimmed = f.trim();
    if (trimmed && !features.includes(trimmed) && features.length < 20) {
      setFeatures((prev) => [...prev, trimmed]);
    }
  }

  function removeFeature(f: string) {
    setFeatures((prev) => prev.filter((x) => x !== f));
  }

  async function handleGenerateDescription() {
    setGenerating(true);
    setDescription("");

    try {
      const res = await fetch("/api/listings/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streetAddress,
          suburb,
          state,
          propertyType,
          bedrooms,
          bathrooms,
          carSpaces,
          landSizeM2: landSizeM2 ? parseInt(landSizeM2) : undefined,
          buildingSizeM2: buildingSizeM2 ? parseInt(buildingSizeM2) : undefined,
          yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
          features,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to generate description");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setDescription(text);
      }
    } catch {
      // Silently fail — user can type manually
    } finally {
      setGenerating(false);
    }
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
      const body = {
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
        // Temporary defaults for required fields — overridden in Step 3
        saleMethod: "OPEN_OFFERS",
      };

      let listingId = existingId;

      if (listingId) {
        // Update existing draft
        await fetch(`/api/listings/${listingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        // Create new draft
        const res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json();
          setErrors({ form: data.error ?? "Failed to save listing" });
          return;
        }

        const data = await res.json();
        listingId = data.listing.id;
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
        <p className="text-sm text-text-muted mb-8">Tell buyers about your property. You can edit this later.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-navy">Description</h2>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateDescription}
                loading={generating}
                disabled={!streetAddress || !suburb || generating}
              >
                ✨ Generate with AI
              </Button>
            </div>
            <div className="flex flex-col gap-1.5">
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your property — its features, lifestyle appeal, and what makes it special..."
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

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" loading={submitting}>
              Continue to Photos →
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
