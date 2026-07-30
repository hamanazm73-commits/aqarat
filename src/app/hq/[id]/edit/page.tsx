"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Property } from "@/lib/types";
import { fsGetProperty } from "@/lib/firebase/db";
import { PropertyForm } from "@/components/admin/property-form";

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const [state, setState] = useState<
    { status: "loading" } | { status: "ok"; p: Property } | { status: "missing" }
  >({ status: "loading" });

  useEffect(() => {
    fsGetProperty(params.id)
      .then((p) => setState(p ? { status: "ok", p } : { status: "missing" }))
      .catch(() => setState({ status: "missing" }));
  }, [params.id]);

  if (state.status === "loading")
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );

  if (state.status === "missing")
    return (
      <div className="py-20 text-center text-muted-foreground">
        <p>خانووبەرەکە نەدۆزرایەوە.</p>
        <Link href="/hq" className="mt-4 inline-block text-primary hover:underline">
          ← گەڕانەوە
        </Link>
      </div>
    );

  return <PropertyForm initial={state.p} />;
}
