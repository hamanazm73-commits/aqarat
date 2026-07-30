"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { fsCreateInquiry } from "@/lib/firebase/db";
import { Button } from "./ui/button";

type Status = "idle" | "sending" | "success" | "error";

export function InquiryForm({ propertyId }: { propertyId: string }) {
  const { t } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({ name: "", phone: "", message: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      if (isFirebaseConfigured()) {
        // Write straight to Firestore (rules validate the payload).
        await fsCreateInquiry({
          propertyId,
          name: form.name.trim(),
          phone: form.phone.trim(),
          createdAt: new Date().toISOString(),
          // Omit message when empty — Firestore rejects undefined values.
          ...(form.message.trim() ? { message: form.message.trim() } : {}),
        });
      } else {
        const res = await fetch("/api/inquiries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, ...form }),
        });
        if (!res.ok) throw new Error("failed");
      }
      setStatus("success");
      setForm({ name: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <p className="font-medium text-foreground">{t.inquiry.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold">{t.inquiry.title}</h3>
        <p className="text-sm text-muted-foreground">{t.inquiry.subtitle}</p>
      </div>

      <input
        required
        placeholder={t.inquiry.name}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="input"
      />
      <input
        required
        type="tel"
        placeholder={t.inquiry.phone}
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="input"
      />
      <textarea
        rows={3}
        placeholder={t.inquiry.message}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="input h-auto py-2.5 resize-none"
      />

      {status === "error" && (
        <p className="text-sm text-danger">{t.inquiry.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={status === "sending"}>
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> {t.inquiry.sending}
          </>
        ) : (
          t.inquiry.send
        )}
      </Button>
    </form>
  );
}
