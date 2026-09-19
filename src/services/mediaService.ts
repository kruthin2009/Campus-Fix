/**
 * mediaService
 * ============
 * Version 1 of CampusFix runs on the Firebase no-cost (Spark) plan, which does
 * not include Firebase Storage. All photo fields throughout the app are
 * therefore OPTIONAL, and the app must fully function with none of them ever
 * being set.
 *
 * This file is the *only* place that should ever know whether image upload is
 * actually available. Every screen that offers a photo picker calls
 * `isMediaUploadEnabled()` first and calls `uploadImage()` only if that is
 * true. If Storage is disabled (the default for v1), the UI shows
 * "Photo upload is currently unavailable" and the surrounding form still
 * submits normally with `photoUrl: null`.
 *
 * To enable photo upload later (once the project is upgraded to the Blaze
 * plan), implement the two functions below using `firebase/storage` — no
 * other file in the app needs to change, because every caller already
 * treats the photo URL as optional and already handles `uploadImage`
 * throwing/being disabled.
 */

// Flip this on only after Firebase Storage has been enabled for the project
// AND the functions below have been implemented against it.
const MEDIA_UPLOAD_ENABLED = false;

export function isMediaUploadEnabled(): boolean {
  return MEDIA_UPLOAD_ENABLED;
}

export interface UploadImageResult {
  url: string;
  path: string;
}

/**
 * Uploads an image and returns its public URL + storage path.
 * Not implemented in Version 1 (no Storage on the free plan).
 *
 * Future implementation sketch (once Storage/Blaze is enabled):
 *   import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
 *   const storage = getStorage(firebaseApp);
 *   const fileRef = ref(storage, path);
 *   await uploadBytes(fileRef, file);
 *   const url = await getDownloadURL(fileRef);
 *   return { url, path };
 */
export async function uploadImage(
  _file: File,
  _path: string
): Promise<UploadImageResult> {
  throw new Error(
    "Photo upload is currently unavailable. Firebase Storage is not enabled for this project."
  );
}

/**
 * Deletes a previously uploaded image by its storage path.
 * Not implemented in Version 1 (no Storage on the free plan).
 */
export async function deleteImage(_path: string): Promise<void> {
  throw new Error(
    "Photo deletion is currently unavailable. Firebase Storage is not enabled for this project."
  );
}
