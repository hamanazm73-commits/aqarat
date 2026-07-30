"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import {
  fsListRoles,
  fsSetRole,
  fsDeleteRole,
  type RoleDoc,
} from "@/lib/firebase/db";
import { useAuth, OWNER_EMAIL } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";

export default function AdminsPage() {
  const { isOwner } = useAuth();
  const [roles, setRoles] = useState<RoleDoc[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRoles(await fsListRoles());
  }, []);

  useEffect(() => {
    if (isOwner) load().catch(() => setRoles([]));
  }, [isOwner, load]);

  if (!isOwner)
    return (
      <div className="py-20 text-center text-muted-foreground">
        تەنها خاوەنی ماڵپەڕ دەتوانێت بەڕێوەبەران بەڕێوەببات.
      </div>
    );

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!v) return;
    setBusy(true);
    try {
      await fsSetRole(v, { role: "admin", enabled: true });
      setEmail("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(r: RoleDoc) {
    await fsSetRole(r.email, { role: r.role, enabled: !r.enabled });
    await load();
  }

  async function remove(r: RoleDoc) {
    if (!confirm(`سڕینەوەی ${r.email}؟`)) return;
    await fsDeleteRole(r.email);
    await load();
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">بەڕێوەبەران</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        خاوەن: <span className="font-medium">{OWNER_EMAIL || "—"}</span> (لە
        <code> .env.local</code> دیاریدەکرێت)
      </p>

      <form onSubmit={addAdmin} className="mb-6 flex gap-2">
        <input
          type="email"
          className="input"
          placeholder="ئیمەیلی بەڕێوەبەری نوێ"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          زیادکردن
        </Button>
      </form>

      {roles === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : roles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
          هیچ بەڕێوەبەرێکی زیادکراو نییە.
        </p>
      ) : (
        <div className="space-y-2">
          {roles.map((r) => (
            <div key={r.email} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${r.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {r.enabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.email}</p>
                <p className="text-xs text-muted-foreground">{r.role} · {r.enabled ? "چالاک" : "ناچالاک"}</p>
              </div>
              <button onClick={() => toggle(r)} className="rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-muted cursor-pointer">
                {r.enabled ? "ناچالاککردن" : "چالاککردن"}
              </button>
              <button onClick={() => remove(r)} className="flex h-9 w-9 items-center justify-center rounded-lg text-danger hover:bg-muted cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
