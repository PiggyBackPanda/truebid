"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, DivIcon } from "leaflet";

// Perth default centre
const PERTH_LAT = -31.9505;
const PERTH_LNG = 115.8605;
const PERTH_ZOOM = 11;

interface MapListing {
  id: string;
  streetAddress: string;
  suburb: string;
  state: string;
  status: string;
  closingDate: string | null;
  guidePriceCents: number | null;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number;
  bathrooms: number;
  coverImage?: { thumbnailUrl: string } | null;
}

export interface MapViewProps {
  listings: MapListing[];
}

function formatAbbreviatedPrice(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    const m = dollars / 1_000_000;
    return `$${parseFloat(m.toFixed(1))}m`;
  }
  if (dollars >= 1_000) {
    const k = dollars / 1_000;
    return `$${parseFloat(k.toFixed(0))}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

function markerColour(status: string, closingDate: string | null): string {
  if (status === "UNDER_OFFER" || status === "SOLD") return "#9ca3af";
  if (status === "COMING_SOON") return "#334766";
  if (status === "ACTIVE" && closingDate) {
    const msLeft = new Date(closingDate).getTime() - Date.now();
    if (msLeft > 0 && msLeft <= 24 * 60 * 60 * 1_000) return "#f97316";
  }
  return "#e8a838";
}

function offerStatusText(status: string, closingDate: string | null): string {
  if (status === "UNDER_OFFER") return "Under offer";
  if (status === "SOLD") return "Sold";
  if (status === "COMING_SOON") return "Coming soon";
  if (status === "ACTIVE" && closingDate) {
    const msLeft = new Date(closingDate).getTime() - Date.now();
    if (msLeft > 0 && msLeft <= 24 * 60 * 60 * 1_000) return "Closing soon";
    if (msLeft > 0) return "Offers open";
  }
  if (status === "ACTIVE") return "Offers open";
  return status;
}

function buildDivIcon(L: typeof import("leaflet"), colour: string, priceLabel: string | null): DivIcon {
  const size = priceLabel ? 44 : 16;
  const html = priceLabel
    ? `<div style="
        background:${colour};
        color:#fff;
        font-family:inherit;
        font-size:11px;
        font-weight:700;
        padding:4px 7px;
        border-radius:20px;
        white-space:nowrap;
        box-shadow:0 1px 4px rgba(0,0,0,0.25);
        border:2px solid rgba(255,255,255,0.9);
        line-height:1.2;
      ">${priceLabel}</div>`
    : `<div style="
        width:14px;
        height:14px;
        border-radius:50%;
        background:${colour};
        border:2.5px solid #fff;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);
      "></div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: priceLabel ? [size, 26] : [14, 14],
    iconAnchor: priceLabel ? [size / 2, 13] : [7, 7],
    popupAnchor: [0, priceLabel ? -16 : -10],
  });
}

export function MapView({ listings }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Dynamically import Leaflet to ensure it only runs client-side
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      // Prevent double-initialisation (React StrictMode)
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, {
        center: [PERTH_LAT, PERTH_LNG],
        zoom: PERTH_ZOOM,
        scrollWheelZoom: true,
      });

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "\u00a9 OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const mapped = listings.filter(
        (l): l is MapListing & { latitude: number; longitude: number } =>
          l.latitude !== null && l.longitude !== null
      );

      const bounds: Array<[number, number]> = [];

      for (const listing of mapped) {
        const colour = markerColour(listing.status, listing.closingDate);
        const priceLabel = listing.guidePriceCents
          ? formatAbbreviatedPrice(listing.guidePriceCents)
          : null;
        const icon = buildDivIcon(L, colour, priceLabel);
        const marker = L.marker([listing.latitude, listing.longitude], { icon }).addTo(map);

        const statusText = offerStatusText(listing.status, listing.closingDate);
        const imgHtml = listing.coverImage?.thumbnailUrl
          ? `<img src="${listing.coverImage.thumbnailUrl}" alt="" style="width:100%;max-width:120px;height:72px;object-fit:cover;border-radius:6px;display:block;margin-bottom:6px;" />`
          : "";

        const popupHtml = `
          <div style="font-family:inherit;font-size:13px;min-width:140px;max-width:160px;">
            ${imgHtml}
            <div style="font-weight:600;color:#0f1a2e;line-height:1.3;margin-bottom:2px;">${listing.streetAddress}</div>
            <div style="color:#334766;margin-bottom:4px;">${listing.suburb} ${listing.state}</div>
            <div style="color:#666;font-size:12px;margin-bottom:4px;">${listing.bedrooms} bed · ${listing.bathrooms} bath</div>
            <div style="color:${colour};font-size:11px;font-weight:600;margin-bottom:6px;">${statusText}</div>
            <a href="/listings/${listing.id}" style="display:inline-block;background:#0f1a2e;color:#fff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:6px;text-decoration:none;">View listing</a>
          </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 180 });

        bounds.push([listing.latitude, listing.longitude]);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "calc(100vh - 200px)", minHeight: 400, borderRadius: 12 }}
      className="md:h-[600px]"
    />
  );
}
