import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/auth";
import { getRequest, saveRequest } from "@/lib/store";
import { classifyRequest } from "@/lib/classify";
import { BUCKETS } from "@/lib/types";

export const maxDuration = 60;

const Body = z.object({
  bucketOverride: z.enum(BUCKETS).nullable().optional(),
  reclassify: z.boolean().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const r = await getRequest(id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  if ("bucketOverride" in parsed.data) {
    r.bucketOverride = parsed.data.bucketOverride ?? null;
    r.bucketOverrideBy = session.user?.email ?? "admin";
  }
  if (parsed.data.reclassify) {
    try {
      r.classification = await classifyRequest(r);
      r.classificationError = undefined;
    } catch (err) {
      r.classificationError = err instanceof Error ? err.message : String(err);
      await saveRequest(r);
      return NextResponse.json({ error: r.classificationError }, { status: 502 });
    }
  }
  await saveRequest(r);
  return NextResponse.json({ ok: true });
}
