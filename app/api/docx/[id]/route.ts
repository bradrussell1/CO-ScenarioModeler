import { NextResponse } from "next/server";
import { requireAdmin } from "@/auth";
import { getRequest } from "@/lib/store";
import { buildChangeRequestDocx } from "@/lib/docx";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const r = await getRequest(id);
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buf = buildChangeRequestDocx(r);
  const safe = (r.classification?.suggestedTitle ?? r.project).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "content-disposition": `attachment; filename="AKQA_CR_Replit_${safe || "request"}.docx"`,
    },
  });
}
