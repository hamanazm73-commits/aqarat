import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch,
  increment,
} from "firebase/firestore";
import { getFirebase } from "./client";
import type { Inquiry, Property, Submission } from "@/lib/types";
import { SEED_PROPERTIES } from "@/lib/data";

/** Role document stored at roles/{email}. */
export interface RoleDoc {
  email: string;
  /** A seller manages only their own listings; the other two manage every
      listing and everything around them. */
  role: "owner" | "admin" | "seller";
  enabled: boolean;
  createdAt: string;
  /** Sellers only. Their address is generated, so without somewhere to keep
      the real name the admin list would be a column of random strings. */
  name?: string;
  phone?: string;
  /** Which link signs this account in, so it can be copied again later. */
  token?: string;
}

function db() {
  const fb = getFirebase();
  if (!fb) throw new Error("Firebase is not configured");
  return fb.db;
}

/* ----------------------------- Properties ----------------------------- */

function toProperty(id: string, data: Record<string, unknown>): Property {
  return { ...(data as object), id } as Property;
}

export async function fsListProperties(): Promise<Property[]> {
  const snap = await getDocs(
    query(collection(db(), "properties"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => toProperty(d.id, d.data()));
}

export async function fsGetProperty(id: string): Promise<Property | null> {
  const d = await getDoc(doc(db(), "properties", id));
  return d.exists() ? toProperty(d.id, d.data()) : null;
}

export async function fsCreateProperty(
  data: Omit<Property, "id">,
): Promise<string> {
  const r = await addDoc(collection(db(), "properties"), data);
  return r.id;
}

export async function fsUpdateProperty(
  id: string,
  data: Partial<Property>,
): Promise<void> {
  const rest: Record<string, unknown> = { ...data };
  delete rest.id;
  await updateDoc(doc(db(), "properties", id), rest);
}

export async function fsDeleteProperty(id: string): Promise<void> {
  await deleteDoc(doc(db(), "properties", id));
}

/**
 * Count one look at a listing.
 *
 * `increment` rather than read-then-write: two people opening the same listing
 * at once would otherwise each read the same number and write the same number
 * back, and one of the views would vanish. The server does the addition.
 *
 * Failure is swallowed on purpose. This runs on every visit to a listing, and
 * a counter is never worth an error in front of someone trying to look at a
 * house — nor worth anything at all when Firebase is not configured and the
 * site is running on its seed data.
 */
export async function fsCountView(id: string): Promise<void> {
  try {
    if (!getFirebase()) return;
    await updateDoc(doc(db(), "properties", id), { views: increment(1) });
  } catch {
    /* a lost view is not worth telling anyone about */
  }
}

/** One-time helper: copy the local seed listings into Firestore. */
export async function fsImportSeed(): Promise<number> {
  const batch = writeBatch(db());
  for (const p of SEED_PROPERTIES) {
    const { id, ...rest } = p;
    batch.set(doc(db(), "properties", id), rest);
  }
  await batch.commit();
  return SEED_PROPERTIES.length;
}

/* ----------------------------- Inquiries ----------------------------- */

export async function fsCreateInquiry(
  data: Omit<Inquiry, "id">,
): Promise<void> {
  await addDoc(collection(db(), "inquiries"), data);
}

export async function fsListInquiries(): Promise<Inquiry[]> {
  const snap = await getDocs(
    query(collection(db(), "inquiries"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Inquiry) }));
}

/* --------------------------- Submissions --------------------------- */
// Properties submitted by the public, held for admin review.

export async function fsCreateSubmission(
  data: Omit<Submission, "id">,
): Promise<void> {
  await addDoc(collection(db(), "submissions"), data);
}

export async function fsListSubmissions(): Promise<Submission[]> {
  const snap = await getDocs(
    query(collection(db(), "submissions"), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Submission) }));
}

export async function fsDeleteSubmission(id: string): Promise<void> {
  await deleteDoc(doc(db(), "submissions", id));
}

/**
 * Whether a submission carries enough to become a listing.
 *
 * The public form asks for a name, a phone number and a city now — none of
 * which is a property anyone could browse. Those are leads: somebody rings
 * them and writes the listing properly in the dashboard. Only the older,
 * fuller submissions can go straight through.
 */
export function canPublishSubmission(s: Submission): boolean {
  return Boolean(s.title && s.purpose && s.type);
}

/** Publish a submission as a live property, then remove the submission. */
export async function fsApproveSubmission(s: Submission): Promise<void> {
  // Guarded rather than defaulted: inventing a purpose and a price to fill the
  // gaps would put a listing on the public site that nobody wrote.
  if (!canPublishSubmission(s)) throw new Error("submission has nothing to publish");

  const three = (v: string) => ({ ku: v, en: v, ar: v });
  const type = s.type!;
  const property: Omit<Property, "id"> = {
    title: three(s.title!),
    description: three(s.description ?? ""),
    purpose: s.purpose!,
    type,
    city: s.city,
    priceIQD: Number(s.priceIQD) || 0,
    area: Number(s.area) || 0,
    images: s.images?.length ? s.images : [`/img/${type}.svg`],
    amenities: [],
    agent: {
      name: s.name,
      phone: s.phone,
      ...(s.whatsapp ? { whatsapp: s.whatsapp } : {}),
    },
    createdAt: new Date().toISOString(),
    ...(typeof s.bedrooms === "number" ? { bedrooms: s.bedrooms } : {}),
    ...(typeof s.bathrooms === "number" ? { bathrooms: s.bathrooms } : {}),
    ...(s.district ? { district: three(s.district) } : {}),
  };
  const payload = JSON.parse(JSON.stringify(property)) as Omit<Property, "id">;
  await addDoc(collection(db(), "properties"), payload);
  if (s.id) await deleteDoc(doc(db(), "submissions", s.id));
}

/* ------------------------------- Roles ------------------------------- */

export async function fsGetRole(email: string): Promise<RoleDoc | null> {
  const d = await getDoc(doc(db(), "roles", email.toLowerCase()));
  return d.exists() ? (d.data() as RoleDoc) : null;
}

export async function fsListRoles(): Promise<RoleDoc[]> {
  const snap = await getDocs(collection(db(), "roles"));
  return snap.docs.map((d) => d.data() as RoleDoc);
}

export async function fsSetRole(
  email: string,
  data: Omit<RoleDoc, "email" | "createdAt">,
): Promise<void> {
  const key = email.toLowerCase();
  await setDoc(
    doc(db(), "roles", key),
    { email: key, createdAt: new Date().toISOString(), ...data },
    { merge: true },
  );
}

export async function fsDeleteRole(email: string): Promise<void> {
  await deleteDoc(doc(db(), "roles", email.toLowerCase()));
}

/* ------------------------------ Settings ----------------------------- */

/** Which cities appear in the public filters. Stored at settings/site. */
export async function fsGetEnabledCities(): Promise<string[] | null> {
  const d = await getDoc(doc(db(), "settings", "site"));
  if (!d.exists()) return null;
  const data = d.data() as { cities?: string[] };
  return Array.isArray(data.cities) ? data.cities : null;
}

export async function fsSetEnabledCities(cities: string[]): Promise<void> {
  await setDoc(doc(db(), "settings", "site"), { cities }, { merge: true });
}

/* ------------------------------ Storage ------------------------------ */

/**
 * Put a file in the bucket and hand back the path it is served from.
 *
 * This used to call Firebase Storage's uploadBytes. Firebase Storage has to
 * be provisioned before it exists, and when it is not there the SDK does not
 * fail — it retries for a couple of minutes while the seller watches a spinner
 * that never resolves. That is what "the upload is slow" turned out to be.
 *
 * It goes to this site's own /api/upload now, which writes to the same R2
 * bucket the hotels and shops sites have been using all along. Same
 * credentials, one bucket, split by key prefix.
 *
 * The name is kept: every caller passes a File and wants a URL back, and that
 * contract has not changed. Photographs uploaded before today are absolute
 * Firebase URLs still sitting in the same array, and they keep working.
 */
/**
 * Send a video straight to the bucket, past this site entirely.
 *
 * A function request body is capped at 4.5MB and a clip off a phone is many
 * times that, so /api/upload could never carry one. This asks for a signed
 * address and the browser writes to R2 itself, which has no such limit.
 *
 * Needs CORS on the bucket, because the browser is writing across an origin.
 * Without it this fails with "Failed to fetch" and nothing else — the message
 * a blocked cross-origin request always gives, and the one that cost the shops
 * site an evening.
 */
export async function fsUploadVideo(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const fb = getFirebase();
  const token = await fb?.auth.currentUser?.getIdToken();
  if (!token) throw new Error("not-signed-in");

  const signed = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-id-token": token },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  if (!signed.ok) {
    const { error } = (await signed.json().catch(() => ({}))) as { error?: string };
    throw new Error(error ?? "sign-failed");
  }
  const { uploadUrl, url } = (await signed.json()) as {
    uploadUrl: string;
    url: string;
  };

  // XHR rather than fetch: it is the only one that reports how far a body has
  // got, and on a 60MB clip over mobile data a seller needs to see it moving.
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`bucket-refused-${xhr.status}`));
    // No status, no body: this is what a blocked cross-origin PUT looks like.
    xhr.onerror = () => reject(new Error("bucket-unreachable-check-cors"));
    xhr.send(file);
  });

  return url;
}

export async function fsUploadImage(file: File): Promise<string> {
  const fb = getFirebase();
  const token = await fb?.auth.currentUser?.getIdToken();
  if (!token) throw new Error("not-signed-in");

  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": file.type, "x-id-token": token },
    body: file,
  });

  if (!res.ok) {
    // The route says which of the several things went wrong; passing it on
    // is the difference between fixing it and guessing at it.
    const { error, message } = (await res
      .json()
      .catch(() => ({}))) as { error?: string; message?: string };
    throw new Error(message ? `${error}: ${message}` : (error ?? "upload-failed"));
  }

  const { url } = (await res.json()) as { url?: string };
  if (!url) throw new Error("upload-failed");
  return url;
}

/* ---------------------------- Seller links ---------------------------- */

/**
 * A link that signs its holder in.
 *
 * A property owner should not have to be given a password, remember it, or
 * be trusted to pick a good one. Instead each gets a URL of their own; the
 * unguessable part of it is the key to a throwaway account created for them,
 * and opening it puts them straight in the dashboard looking at their own
 * listings.
 *
 * The token is the secret, so the document holding those credentials is
 * readable by its exact id and cannot be listed — see firestore.rules. That
 * is the same trade the hotels site makes: 32 random bytes are not guessed,
 * and a link nobody can enumerate is worth more here than a password
 * everybody writes on a receipt.
 */
export interface SellerLink {
  /** The synthetic account. Never receives mail; it exists to be signed in as. */
  email: string;
  password: string;
  /** What the person is called, so the admin list is readable. */
  name: string;
  phone?: string;
  createdAt: string;
}

export async function fsGetSellerLink(token: string): Promise<SellerLink | null> {
  const d = await getDoc(doc(db(), "accessLinks", token));
  return d.exists() ? (d.data() as SellerLink) : null;
}

export async function fsSaveSellerLink(
  token: string,
  link: SellerLink,
): Promise<void> {
  await setDoc(doc(db(), "accessLinks", token), link);
}

/** Every seller account, newest first. Roles are keyed by email. */
export async function fsListSellers(): Promise<RoleDoc[]> {
  const snap = await getDocs(collection(db(), "roles"));
  return snap.docs
    .map((d) => d.data() as RoleDoc)
    .filter((r) => r.role === "seller")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * Withdraw a seller's access.
 *
 * The role goes and the link stops working, which is what revoking means
 * here. Their listings stay: taking away someone's key should not delete
 * the property behind the door. Remove those separately if that is wanted.
 */
export async function fsRevokeSeller(email: string, token: string): Promise<void> {
  const batch = writeBatch(db());
  batch.delete(doc(db(), "roles", email.toLowerCase()));
  batch.delete(doc(db(), "accessLinks", token));
  await batch.commit();
}

/** Only the listings this seller entered. */
export async function fsListPropertiesBySeller(
  email: string,
): Promise<Property[]> {
  const all = await fsListProperties();
  const mine = email.toLowerCase();
  return all.filter((p) => (p.sellerEmail ?? "").toLowerCase() === mine);
}
