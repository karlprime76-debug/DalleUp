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

      console.log("[useImageUpload] uploading", { type, fileName: file.name, fileSize: file.size, fileType: file.type });

      const res = await fetch("/api/restaurant/upload", { method: "POST", body: formData });
      console.log("[useImageUpload] response status", res.status);

      let data: { ok?: boolean; url?: string; error?: string; message?: string } | null = null;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.warn("[useImageUpload] JSON parse failed", jsonError);
      }
      console.log("[useImageUpload] response data", data);

      if (!res.ok || !data?.ok) {
        const message = data?.error ?? data?.message ?? `Upload impossible (HTTP ${res.status}).`;
        setError(message);
        return { url: "", error: message };
      }

      return { url: data.url ?? "" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload impossible. Vérifiez votre connexion.";
      console.error("[useImageUpload] network/error", message);
      setError(message);
      return { url: "", error: message };
    } finally {
      setUploading(false);
    }
  }, []);

  return { upload, uploading, error };
}
