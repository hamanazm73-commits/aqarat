"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Building2,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  MapPin,
  ShieldCheck,
  Users,
  AlertTriangle,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/lib/firebase/auth";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {children}
    </div>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isOwner, isSeller, loading, configured, signOutUser } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && configured && !user) router.replace("/login");
  }, [loading, configured, user, router]);

  if (!configured) {
    return (
      <Centered>
        <AlertTriangle className="h-10 w-10 text-accent-foreground" />
        <h1 className="mt-4 text-lg font-semibold">Firebase هێشتا ڕێکنەخراوە</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <code>.env.local</code> پڕبکەرەوە (README-AQARAT.md) پاشان سێرڤەرەکە
          دووبارە دەستپێبکەوە.
        </p>
        <Link href="/" className="mt-6 text-sm text-primary hover:underline">
          ← ماڵپەڕ
        </Link>
      </Centered>
    );
  }

  if (loading) {
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Centered>
    );
  }

  if (!user) return <Centered><Loader2 className="h-8 w-8 animate-spin text-primary" /></Centered>;

  // A seller belongs here too, on a smaller version of it.
  if (!isAdmin && !isSeller) {
    return (
      <Centered>
        <ShieldCheck className="h-10 w-10 text-danger" />
        <h1 className="mt-4 text-lg font-semibold">دەستپێگەیشتنت نییە</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ئەم هەژمارە ({user.email}) ڕێگەی پێنەدراوە بۆ داشبۆرد.
        </p>
        <button
          onClick={() => signOutUser()}
          className="mt-6 text-sm text-primary hover:underline cursor-pointer"
        >
          دەرچوون
        </button>
      </Centered>
    );
  }

  // A seller gets one entry, because everything else on this list is about
  // other people's listings or the shape of the site itself.
  const nav = isSeller
    ? [{ href: "/hq", label: "موڵکەکانم", icon: Building2, exact: true }]
    : [
        { href: "/hq", label: "خانووبەرەکان", icon: Building2, exact: true },
        { href: "/hq/sellers", label: "نووسینگەکان", icon: KeyRound },
        { href: "/hq/cities", label: "شارەکان", icon: MapPin },
        ...(isOwner
          ? [{ href: "/hq/admins", label: "بەڕێوەبەران", icon: Users }]
          : []),
      ];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[230px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="flex items-center gap-2.5 border-b border-border px-3 pb-3 pt-1">
            <BrandMark className="size-9" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">چوونەژوورەوە وەک</p>
              <p className="truncate text-sm font-medium">{user.email}</p>
            </div>
          </div>
          <nav className="mt-2 space-y-1">
            {nav.map((n) => {
              const active = n.exact
                ? pathname === n.href
                : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/70 hover:bg-muted",
                  )}
                >
                  <n.icon className="h-4 w-4" /> {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-2 border-t border-border pt-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/70 hover:bg-muted"
            >
              <Home className="h-4 w-4" /> ماڵپەڕ
            </Link>
            <button
              onClick={() => signOutUser()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger hover:bg-muted cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> دەرچوون
            </button>
          </div>
        </div>
      </aside>

      <div>{children}</div>
    </div>
  );
}
