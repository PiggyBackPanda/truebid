"use client";

import dynamic from "next/dynamic";
import type { MapViewProps } from "./MapView";

const MapView = dynamic(
  () => import("@/components/listings/MapView").then((m) => ({ default: m.MapView })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full flex items-center justify-center bg-bg border border-border rounded-lg" style={{ height: 500 }}>
        <div className="w-8 h-8 border-2 border-amber border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export function MapViewClient(props: MapViewProps) {
  return <MapView {...props} />;
}
