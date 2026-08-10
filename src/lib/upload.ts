import { clientApi } from "./api";

const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

/**
 * Upload an image to S3 and return its public URL.
 *
 * Flow (same as the mobile app): ask the backend for a presigned POST via the
 * same-origin proxy, then upload the file DIRECTLY to S3 with that policy. The
 * binary never passes through the Next.js proxy (which only forwards text).
 */
export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Image is too large (max 15 MB).");
  }

  // 1. Presigned POST (auth via the httpOnly cookie the proxy injects).
  const presignRes = await clientApi("/upload/presigned", {
    method: "POST",
    body: JSON.stringify({ filename: file.name, content_type: file.type }),
  });
  if (!presignRes.ok) {
    const d = await presignRes.json().catch(() => ({}));
    throw new Error(d?.detail || "Could not start the upload.");
  }
  const { presigned, url } = await presignRes.json();

  // 2. Upload straight to S3. AWS requires the "file" field last.
  const form = new FormData();
  Object.entries(presigned.fields as Record<string, string>).forEach(([k, v]) =>
    form.append(k, v)
  );
  form.append("file", file);

  const s3Res = await fetch(presigned.url, { method: "POST", body: form });
  if (!s3Res.ok) throw new Error("Upload to storage failed. Please try again.");

  return url as string;
}
