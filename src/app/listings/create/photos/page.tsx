"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CreateListingProgress } from "@/components/listings/CreateListingProgress";

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  displayOrder: number;
  mediaType: string;
}

interface UploadingImage {
  localId: string;
  file: File;
  progress: number;
  error?: string;
}

function PhotosForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get("id");

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState<UploadingImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!listingId) router.replace("/listings/create/details");
  }, [listingId, router]);

  const uploadFile = useCallback(async (file: File, mediaType: "photo" | "floorplan" = "photo") => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    const localId = `${Date.now()}-${Math.random()}`;
    setUploading((prev) => [...prev, { localId, file, progress: 0 }]);

    try {
      // Step 1: Get presigned URL
      const urlRes = await fetch(`/api/listings/${listingId}/images/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, mediaType }),
      });

      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, s3Key } = await urlRes.json();

      // Step 2: Upload to S3
      const xhr = new XMLHttpRequest();
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 90);
            setUploading((prev) =>
              prev.map((u) => u.localId === localId ? { ...u, progress: pct } : u)
            );
          }
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject());
        xhr.onerror = reject;
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Step 3: Confirm upload
      setUploading((prev) =>
        prev.map((u) => u.localId === localId ? { ...u, progress: 95 } : u)
      );

      const confirmRes = await fetch(`/api/listings/${listingId}/images/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ s3Key, mediaType }),
      });

      if (!confirmRes.ok) throw new Error("Failed to confirm upload");
      const { image } = await confirmRes.json();

      setImages((prev) => [...prev, image]);
      setUploading((prev) => prev.filter((u) => u.localId !== localId));
    } catch {
      setUploading((prev) =>
        prev.map((u) => u.localId === localId ? { ...u, error: "Upload failed", progress: 0 } : u)
      );
    }
  }, [listingId]);

  function handleFiles(files: FileList) {
    const remaining = 15 - images.length - uploading.filter((u) => !u.error).length;
    Array.from(files).slice(0, remaining).forEach((f) => uploadFile(f));
  }

  async function handleDeleteImage(imageId: string) {
    await fetch(`/api/listings/${listingId}/images/${imageId}`, { method: "DELETE" });
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const updated = reordered.map((img, i) => ({ ...img, displayOrder: i }));
    setImages(updated);

    await fetch(`/api/listings/${listingId}/images/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageIds: updated.map((img) => img.id) }),
    });
  }

  function handleContinue() {
    if (images.length === 0) {
      setError("Please upload at least one photo before continuing.");
      return;
    }
    setSubmitting(true);
    router.push(`/listings/create/method?id=${listingId}`);
  }

  return (
    <div>
      <CreateListingProgress listingId={listingId ?? undefined} />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 className="font-serif text-2xl text-navy mb-1">Photos</h1>
        <p className="text-sm text-text-muted mb-8">
          Upload photos of your property. Listings with more photos get significantly more views.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[12px] p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors mb-6 ${
            dragOver ? "border-amber bg-amber/5" : "border-border bg-white hover:border-slate hover:bg-bg"
          }`}
        >
          <div className="text-4xl">📸</div>
          <p className="text-sm font-medium text-text">Drag photos here, or click to browse</p>
          <p className="text-xs text-text-muted">JPG, PNG or WebP — max 10MB per photo — up to 15 photos</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }}
          />
        </div>

        {error && (
          <p className="text-sm text-red mb-4" role="alert">{error}</p>
        )}

        {images.length > 0 && images.length < 5 && (
          <div className="bg-amber/10 border border-amber/30 rounded-[10px] px-4 py-3 text-sm text-amber-900 mb-4">
            Listings with more photos get 3× more views. Add at least 5 for best results.
          </div>
        )}

        {/* Uploading progress */}
        {uploading.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {uploading.map((u) => (
              <div key={u.localId} className="flex items-center gap-3 bg-white border border-border rounded-[10px] p-3">
                <div className="flex-1">
                  <p className="text-xs font-medium text-text mb-1">{u.file.name}</p>
                  {u.error ? (
                    <p className="text-xs text-red">{u.error}</p>
                  ) : (
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber transition-all duration-300 rounded-full"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {u.error && (
                  <button
                    type="button"
                    onClick={() => setUploading((prev) => prev.filter((x) => x.localId !== u.localId))}
                    className="text-xs text-text-muted hover:text-text"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Photo grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {images.map((img, index) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                onDragEnd={() => {
                  if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
                    handleReorder(draggedIndex, dragOverIndex);
                  }
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={`relative aspect-square rounded-[10px] overflow-hidden group cursor-grab ${
                  dragOverIndex === index ? "ring-2 ring-amber" : ""
                }`}
              >
                <Image
                  src={img.thumbnailUrl}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-amber text-navy text-xs font-semibold px-2 py-0.5 rounded-full">
                    Cover
                  </div>
                )}
                <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                    className="bg-red text-white rounded-full p-1.5 hover:opacity-90"
                    title="Delete photo"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/80 rounded p-1">
                    <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className="text-navy">
                      <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
                      <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                      <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floor plan section */}
        <div className="border border-border rounded-[12px] p-4 mb-8">
          <h3 className="text-sm font-semibold text-navy mb-2">Floor plan (optional)</h3>
          <p className="text-xs text-text-muted mb-3">Upload a floor plan image to give buyers a better sense of the layout.</p>
          <label className="inline-flex items-center gap-2 cursor-pointer bg-bg border border-border rounded-[10px] px-4 py-2 text-sm text-text hover:border-slate transition-colors">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload floor plan
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "floorplan"); }}
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/listings/create/details?id=${listingId}`)}
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            ← Back
          </button>
          <Button size="lg" onClick={handleContinue} loading={submitting}>
            Continue to Sale Method →
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PhotosPage() {
  return (
    <Suspense>
      <PhotosForm />
    </Suspense>
  );
}
