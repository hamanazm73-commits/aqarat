"use client";

/**
 * Shrink a photo in the browser before it is ever uploaded.
 *
 * This is the difference between a site that works on Iraqi mobile data and
 * one that doesn't. A phone camera writes 4–6MB per shot; a listing card shows
 * it at a few hundred pixels wide. Sending the original means the seller waits
 * to upload it once and every buyer pays to download it forever — on a listing
 * page of twenty cards that is tens of megabytes for a single screen.
 *
 * Resized to 1600px on the long edge, a typical phone photo lands around
 * 100–150KB: small enough that the free storage tier goes roughly twenty times
 * further, and fast enough to open on a phone signal.
 *
 * 1600px rather than something smaller because a buyer does open the gallery
 * full-screen, and 82% because the artefacts are invisible on a photograph
 * while the saving over 92% is large.
 */

const MAX_DIM = 1600;
const QUALITY = 0.82;

/**
 * WebP where the browser can write it, JPEG where it cannot.
 *
 * At the same visible quality WebP lands roughly a quarter to a third smaller
 * than JPEG, and every byte saved is a byte the seller does not wait to send
 * on a phone signal. `toBlob` silently falls back to PNG when it does not know
 * a format — which would be several times *larger* — so the format is proved
 * once by encoding a 1×1 canvas and reading back what came out, rather than
 * assumed.
 */
let webpOk: boolean | null = null;
function canWriteWebp(): boolean {
  if (webpOk !== null) return webpOk;
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    webpOk = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpOk = false;
  }
  return webpOk;
}

export async function compressImage(
  file: File,
  maxDim = MAX_DIM,
): Promise<File> {
  // Anything that isn't a raster photo — an SVG, a HEIC the browser can't
  // decode — is passed through untouched rather than corrupted.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const bitmap = await decode(file);
  if (!bitmap) return file;

  let width = bitmap.width || maxDim;
  let height = bitmap.height || maxDim;
  const longest = Math.max(width, height);
  if (longest > maxDim) {
    const scale = maxDim / longest;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file; // no canvas: send the original rather than nothing

  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap) bitmap.close();

  const type = canWriteWebp() ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, QUALITY),
  );
  if (!blob) return file;

  // A photo already smaller than what we produced is left alone — re-encoding
  // it would only lose quality for no saving.
  if (blob.size >= file.size) return file;

  const ext = type === "image/webp" ? ".webp" : ".jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + ext;
  return new File([blob], name, { type });
}

/**
 * Get pixels out of the file, the cheap way where it exists.
 *
 * `createImageBitmap` decodes the File directly and off the main thread. The
 * old path read the whole thing into a base64 data URL first — a string a
 * third larger than the file, built on the main thread, then handed to an
 * <img> to parse a second time. On a 6MB photo that was most of the wait, and
 * it froze the page while it happened. Older Safari has no
 * `createImageBitmap(File)`, so a fallback stays.
 */
async function decode(
  file: File,
): Promise<ImageBitmap | HTMLImageElement | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* some browsers refuse certain formats here — fall through */
    }
  }
  try {
    return await loadViaObjectUrl(file);
  } catch {
    return null;
  }
}

/** Object URL rather than a data URL: no base64, nothing copied into a string. */
function loadViaObjectUrl(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode-failed"));
    };
    img.src = url;
  });
}
