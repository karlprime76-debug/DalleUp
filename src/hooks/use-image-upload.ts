"use client";

import { useCallback, useState } from "react";

export type UploadResult = { url: string; error?: string };

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, type: "cover" | "logo" | "product" = "cover", productId?: string): Promise<UploadResult> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      if (productId) formData.append("productId", productId);

      const res = await fetch("/api/restaurant/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const message = data?.error ?? data?.message ?? "Upload impossible.";
        setError(message);
        setUploading(false);
        return { url: "", error: message };
      }

      setUploading(false);
      return { url: data.url ?? "" };
    } catch {
      const message = "Upload impossible. Vérifiez votre connexion.";
      setError(message);
      setUploading(false);
      return { url: "", error: message };
    }
  }, []);

  return { upload, uploading, error };
}
