"use client";

import { useCallback, useState } from "react";
import { uploadRestaurantImage, type UploadResult } from "@/lib/supabase/storage";

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, path: string): Promise<UploadResult> => {
    setUploading(true);
    setError(null);
    const result = await uploadRestaurantImage(file, path);
    if (result.error) setError(result.error);
    setUploading(false);
    return result;
  }, []);

  return { upload, uploading, error };
}
