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
 * Resized to 1600px on the long edge and re-encoded as JPEG at 82%, a typical
 * phone photo lands around 150KB: small enough that the free storage tier goes
 * roughly twenty times further, and fast enough to open on a phone signal.
 *
 * 1600px rather than something smaller because a buyer does open the gallery
 * full-screen, and 82% because the artefacts are invisible on a photograph
 * while the saving over 92% is large.
 *
 * Ported from the hotels site, which arrived at these numbers the hard way.
 */

const MAX_DIM = 1600;
const QUALITY = 0.82;

export async function compressImage(
  file: File,
  maxDim = MAX_DIM,
): Promise<File> {
  // Anything that isn't a raster photo — an SVG, a HEIC the browser can't
  // decode — is passed through untouched rather than corrupted.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  const source = await readAsDataURL(file);
  const image = await loadImage(source);

  let width = image.width || maxDim;
  let height = image.height || maxDim;
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

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  if (!blob) return file;

  // A photo already smaller than what we produced is left alone — re-encoding
  // it would only lose quality for no saving.
  if (blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode-failed"));
    img.src = src;
  });
}
