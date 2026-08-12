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

  let s3Res: Response;
  try {
    s3Res = await fetch(presigned.url, { method: "POST", body: form });
  } catch {
    // fetch only rejects here for network/CORS failures — S3 returning 4xx
    // still resolves. Naming that difference saves a lot of guesswork.
    throw new Error(
      "Could not reach storage. This is usually a network problem or a CORS rule on the bucket."
    );
  }

  if (!s3Res.ok) {
    // S3 replies with an XML body naming the exact policy condition that
    // failed. Surfacing it beats "please try again", which told nobody
    // anything and made this impossible to diagnose from a bug report.
    const body = await s3Res.text().catch(() => "");
    const code = /<Code>([^<]+)<\/Code>/.exec(body)?.[1];
    const message = /<Message>([^<]+)<\/Message>/.exec(body)?.[1];
    console.error("S3 upload rejected", { status: s3Res.status, code, message, body });
    throw new Error(
      code
        ? `Storage rejected the upload (${s3Res.status} ${code}): ${message ?? "no detail"}`
        : `Storage rejected the upload (${s3Res.status}).`
    );
  }

  return url as string;
}
