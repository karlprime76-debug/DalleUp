"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useImageUpload } from "@/hooks/use-image-upload";

export function ImageUpload({
  path,
  currentUrl,
  onUpload,
  label = "Ajouter une photo",
}: {
  path: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useImageUpload();
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    const result = await upload(file, path);
    if (result.url) {
      onUpload(result.url);
      setPreview(result.url);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative grid h-40 w-full place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 transition hover:bg-neutral-100"
      >
        {preview ? (
          <Image src={preview} alt={label} fill className="object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-500">
            <Camera size={28} />
            <span className="text-sm font-bold">{label}</span>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
            <span className="text-sm font-bold">Envoi...</span>
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
