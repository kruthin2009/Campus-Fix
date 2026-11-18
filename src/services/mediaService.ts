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

async function optimizeImage(file: File): Promise<{ file: File; contentType: string }> {
  // Resize large phone photos before upload to reduce mobile data use and
  // Firestore-backed page load delays. Fall back safely if browser decoding fails.
  if (typeof createImageBitmap !== "function") return { file, contentType: file.type };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 900 * 1024) { bitmap.close(); return { file, contentType: file.type }; }
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) { bitmap.close(); return { file, contentType: file.type }; }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!blob || blob.size >= file.size) return { file, contentType: file.type };
    return { file: new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp", lastModified: Date.now() }), contentType: "image/webp" };
  } catch { return { file, contentType: file.type }; }
}

export async function uploadImage(file: File, path: string): Promise<UploadImageResult> {
  if (!MEDIA_UPLOAD_ENABLED) throw new Error("Photo upload is currently unavailable.");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Please choose a JPG, PNG, or WebP image.");
  if (file.size > MAX_IMAGE_SIZE) throw new Error("Image must be 5 MB or smaller.");
  const optimized = await optimizeImage(file);
  const storageRef = ref(storage, path.replace(/\.[^/.]+$/, optimized.contentType === "image/webp" ? ".webp" : path.match(/\.[^/.]+$/)?.[0] ?? ""));
  await uploadBytes(storageRef, optimized.file, { contentType: optimized.contentType, cacheControl: "public,max-age=31536000,immutable" });
  const url = await getDownloadURL(storageRef);
  return { url, path: storageRef.fullPath };
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
