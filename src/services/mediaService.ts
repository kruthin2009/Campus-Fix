import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase/config";

const MEDIA_UPLOAD_ENABLED = true;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isMediaUploadEnabled(): boolean {
  return MEDIA_UPLOAD_ENABLED;
}

export interface UploadImageResult {
  url: string;
  path: string;
}

export async function uploadImage(file: File, path: string): Promise<UploadImageResult> {
  if (!MEDIA_UPLOAD_ENABLED) {
    throw new Error("Photo upload is currently unavailable.");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Please choose a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteImage(path: string): Promise<void> {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
    if (code !== "storage/object-not-found") throw error;
  }
}
