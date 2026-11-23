"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function PhotoUploader({
  hotelId,
  photos,
  onChange,
  label = "Photos",
}: {
  hotelId: string;
  photos: string[];
  onChange: (next: string[]) => void;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`${file.name} exceeds 5 MB.`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${hotelId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("hotel-photos")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          setError(uploadError.message);
          continue;
        }

        const { data } = supabase.storage.from("hotel-photos").getPublicUrl(path);
        if (data?.publicUrl) {
          uploadedUrls.push(data.publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...photos, ...uploadedUrls]);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-brand-ink">{label}</label>
        <label className="cursor-pointer rounded-full bg-night-bg px-3 py-1 text-[11px] font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white">
          {uploading ? "Uploading..." : "+ Upload Photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {photos.map((url) => (
            <div
              key={url}
              className="group relative h-20 overflow-hidden rounded-xl border border-brand-border bg-brand-bg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Uploaded" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((u) => u !== url))}
                aria-label="Remove photo"
                className="absolute top-1 right-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-brand-ink/80 text-[10px] font-bold text-white opacity-90 transition hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-brand-border bg-brand-bg/50 px-4 py-5 text-center text-xs text-brand-muted">
          No photos yet. Upload JPG, PNG, or WebP (max 5 MB).
        </div>
      )}
    </div>
  );
}
