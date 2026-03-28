"use client";

import { useState } from "react";
import { PropertyImage } from "@/components/listings/PropertyImage";
import { getListingFallbackImage } from "@/lib/listing-images";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
}

interface PhotoGalleryClientProps {
  photos: Photo[];
  floorplanUrl: string | null;
  displayAddress: string;
  listingId: string;
}

export function PhotoGalleryClient({
  photos,
  floorplanUrl,
  displayAddress,
  listingId,
}: PhotoGalleryClientProps) {
  const [activeTab, setActiveTab] = useState<"photos" | "floorplan">("photos");
  const hasFloorplan = !!floorplanUrl;
  const isPdf = floorplanUrl?.toLowerCase().endsWith(".pdf") ?? false;

  return (
    <div>
      {/* Tabs — only shown when floorplan URL exists */}
      {hasFloorplan && (
        <div className="flex gap-1 mt-4 md:mt-6 mb-0">
          <button
            type="button"
            onClick={() => setActiveTab("photos")}
            className={`px-4 py-2 text-sm font-medium rounded-t-[8px] border border-b-0 transition-colors ${
              activeTab === "photos"
                ? "bg-white border-border text-navy"
                : "bg-transparent border-transparent text-text-muted hover:text-text"
            }`}
          >
            Photos{photos.length > 0 ? ` (${photos.length})` : ""}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("floorplan")}
            className={`px-4 py-2 text-sm font-medium rounded-t-[8px] border border-b-0 transition-colors ${
              activeTab === "floorplan"
                ? "bg-white border-border text-navy"
                : "bg-transparent border-transparent text-text-muted hover:text-text"
            }`}
          >
            Floorplan
          </button>
        </div>
      )}

      {/* Photos view */}
      {(activeTab === "photos" || !hasFloorplan) && (
        <>
          {photos.length > 0 ? (
            <>
              {/* Mobile: single hero */}
              <div
                className={`relative block md:hidden rounded-lg overflow-hidden ${hasFloorplan ? "" : "mt-4"}`}
                style={{ height: 240 }}
              >
                <PropertyImage
                  src={photos[0].url}
                  alt={`${displayAddress}, cover photo`}
                  className="object-cover"
                  priority
                />
              </div>

              {/* Desktop: multi-photo grid */}
              <div
                className={`hidden md:grid grid-cols-4 gap-2 rounded-[16px] overflow-hidden ${hasFloorplan ? "" : "mt-6"}`}
                style={{ height: 420 }}
              >
                <div className="relative col-span-2 row-span-2">
                  <PropertyImage
                    src={photos[0].url}
                    alt={`${displayAddress}, cover photo`}
                    className="object-cover"
                    priority
                  />
                </div>
                {photos.slice(1, 5).map((img, i) => (
                  <div key={img.id} className="relative overflow-hidden">
                    <PropertyImage
                      src={img.thumbnailUrl || img.url}
                      alt={`${displayAddress}, photo ${i + 2}`}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div
              className={`relative rounded-lg md:rounded-[16px] overflow-hidden ${hasFloorplan ? "" : "mt-4 md:mt-6"}`}
              style={{ height: 240 }}
            >
              <PropertyImage
                src={getListingFallbackImage(listingId)}
                alt={`${displayAddress}, cover photo`}
                className="object-cover"
                priority
              />
            </div>
          )}
        </>
      )}

      {/* Floorplan view */}
      {activeTab === "floorplan" && hasFloorplan && (
        <div className="border border-border rounded-b-[16px] rounded-tr-[16px] overflow-hidden bg-white">
          {isPdf ? (
            <div className="flex items-center justify-center" style={{ minHeight: 300 }}>
              <a
                href={floorplanUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 border border-border rounded-[12px] px-6 py-5 hover:border-slate transition-colors"
              >
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 8, background: "#fef2f2",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#e05252" }}>
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-navy">View floorplan</p>
                  <p className="text-xs text-text-muted">PDF (opens in new tab)</p>
                </div>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: "#9ca3af", marginLeft: 4 }}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            </div>
          ) : (
            <img
              src={floorplanUrl!}
              alt={`Floorplan, ${displayAddress}`}
              style={{ width: "100%", display: "block", maxHeight: 520, objectFit: "contain", background: "#f7f5f0" }}
            />
          )}
        </div>
      )}
    </div>
  );
}
