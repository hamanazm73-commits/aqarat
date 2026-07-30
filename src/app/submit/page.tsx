"use client";

import { useI18n } from "@/lib/i18n/context";
import { SubmitForm } from "@/components/submit-form";

export default function SubmitPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold">{t.submit.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.submit.subtitle}</p>
      <div className="mt-8">
        <SubmitForm />
      </div>
    </div>
  );
}
