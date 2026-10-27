import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { PRIORITIES, PROJECTS, type ChangeRequest } from "@/lib/types";
import { saveRequest } from "@/lib/store";
import { classifyRequest } from "@/lib/classify";

export const maxDuration = 60;

const Body = z.object({
  project: z.enum(PROJECTS),
  context: z.string().trim().min(1).max(20000),
  description: z.string().trim().min(1).max(20000),
  deliverables: z.string().trim().min(1).max(20000),
  priority: z.enum(PRIORITIES),
  responseNeeded: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field." }, { status: 400 });
  }

  const request: ChangeRequest = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...parsed.data,
    classification: null,
  };

  await saveRequest(request);

  try {
    request.classification = await classifyRequest(request);
  } catch (err) {
    request.classificationError = err instanceof Error ? err.message : String(err);
  }
  await saveRequest(request);

  return NextResponse.json({ ok: true, id: request.id });
}
