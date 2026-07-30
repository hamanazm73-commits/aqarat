"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn, AlertTriangle } from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-mark";

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginInner />
    </AuthProvider>
  );
}

function LoginInner() {
  const { signIn, configured } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.push("/hq");
    } catch {
      setError("ئیمەیل یان وشەی نهێنی هەڵەیە / Invalid email or password.");
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-[80vh] place-items-center overflow-hidden px-4 py-16">
      {/* the navy stage with drifting gold light, same as the sister site's
          sign-in — the one screen where the brand should feel like a vault */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-primary">
        <div className="aurora-blob absolute -top-32 start-0 size-[26rem] max-w-full rounded-full bg-primary-foreground/10" />
        <div className="aurora-blob absolute bottom-0 end-0 size-96 max-w-full rounded-full bg-gold/30 [animation-delay:-5s]" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-card/95 p-7 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandMark className="size-14" />
          <h1 className="mt-4 text-xl font-bold">بەڕێوەبردن · Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            چوونەژوورەوە بۆ داشبۆرد
          </p>
        </div>

        {!configured ? (
          <div className="flex items-start gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
            <div>
              <p className="font-medium">Firebase هێشتا ڕێکنەخراوە.</p>
              <p className="mt-1 text-muted-foreground">
                <code>.env.local</code> پڕبکەرەوە (بڕوانە README-AQARAT.md)،
                پاشان سێرڤەرەکە دووبارە دەستپێبکەوە.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              required
              type="email"
              placeholder="ئیمەیل / Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <input
              required
              type="password"
              placeholder="وشەی نهێنی / Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> ...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" /> چوونەژوورەوە
                </>
              )}
            </Button>
          </form>
        )}

        <Link
          href="/"
          className="mt-5 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← گەڕانەوە بۆ ماڵپەڕ
        </Link>
      </div>
    </div>
  );
}
