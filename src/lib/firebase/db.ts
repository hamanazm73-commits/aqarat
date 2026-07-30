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
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getStorage } from "firebase/storage";
import { getFirebase } from "./client";
import type { Inquiry, Property, Submission } from "@/lib/types";
import { SEED_PROPERTIES } from "@/lib/data";

/** Role document stored at roles/{email}. */
export interface RoleDoc {
  email: string;
  role: "owner" | "admin";
  enabled: boolean;
  createdAt: string;
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

/** Publish a submission as a live property, then remove the submission. */
export async function fsApproveSubmission(s: Submission): Promise<void> {
  const three = (v: string) => ({ ku: v, en: v, ar: v });
  const property: Omit<Property, "id"> = {
    title: three(s.title),
    description: three(s.description ?? ""),
    purpose: s.purpose,
    type: s.type,
    city: s.city,
    priceIQD: Number(s.priceIQD) || 0,
    area: Number(s.area) || 0,
    images: s.images.length ? s.images : [`/img/${s.type}.svg`],
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

export async function fsUploadImage(file: File): Promise<string> {
  const fb = getFirebase();
  if (!fb) throw new Error("Firebase is not configured");
  const storage = getStorage(fb.app);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `properties/${Date.now()}-${safe}`;
  const snap = await uploadBytes(ref(storage, path), file);
  return getDownloadURL(snap.ref);
}
