import { NextResponse } from "next/server";

/**
 * Which commit is actually running here.
 *
 * A push is not a deploy. Code can sit correct on `origin` for hours while the
 * site keeps serving what it served this morning, and the only way anyone
 * found out was by opening the page and noticing the old words — which is a
 * bad way to find out, and cost an afternoon.
 *
 * Vercel puts the commit it built into the environment. Reporting it back
 * turns "did that go out?" into one request with a yes or no in it, from
 * either side, without an account on anybody's dashboard.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  return NextResponse.json(
    {
      commit: sha,
      short: sha ? sha.slice(0, 7) : null,
      branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
      env: process.env.VERCEL_ENV ?? "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
