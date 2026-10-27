import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import { TopBar } from "@/components/Logo";
import { getRequest } from "@/lib/store";
import { effectiveBucket } from "@/lib/types";
import { BucketControls } from "./BucketControls";

export const dynamic = "force-dynamic";

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) redirect("/login");
  const { id } = await params;
  const r = await getRequest(id);
  if (!r) notFound();

  const bucket = effectiveBucket(r);
  const title = r.classification?.suggestedTitle ?? "Change request";

  return (
    <>
      <TopBar tagline="Admin" right={<Link href="/admin">← All requests</Link>} />
      <main className="container wide">
        <div className="toolbar">
          <div>
            <h1>{title}</h1>
            <p className="sub" style={{ margin: 0 }}>
              {r.project} · submitted {new Date(r.createdAt).toLocaleString("en-US")} by {r.name}
            </p>
          </div>
          <a className="btn btn-primary" href={`/api/docx/${r.id}`}>Download CR (.docx)</a>
        </div>

        <div className="detail">
          <div className="card section">
            <dl className="kv">
              <dt>Project</dt><dd>{r.project}</dd>
              <dt>Priority</dt><dd><span className={`chip ${r.priority.toLowerCase()}`}>{r.priority}</span></dd>
              <dt>Response needed</dt><dd>{r.responseNeeded}</dd>
              <dt>Submitted by</dt><dd>{r.name} · <a href={`mailto:${r.email}`}>{r.email}</a></dd>
            </dl>
            <h3>Context</h3>
            <p>{r.context}</p>
            <h3>Description of Services</h3>
            <p>{r.description}</p>
            <h3>Deliverables</h3>
            <p>{r.deliverables}</p>
          </div>

          <div className="stack">
            <div className="card">
              <h3 style={{ margin: "0 0 10px", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-3)" }}>Triage</h3>
              <div className="bucket-pill" style={{ marginBottom: 12 }}>{bucket}</div>
              {r.classification ? (
                <div className="reason">
                  <strong>AI reasoning</strong> ({r.classification.confidence} confidence)
                  <div style={{ marginTop: 6 }}>{r.classification.reasoning}</div>
                  {r.bucketOverride && (
                    <div style={{ marginTop: 8, color: "var(--ink-3)" }}>
                      AI suggested <em>{r.classification.bucket}</em>; overridden manually.
                    </div>
                  )}
                </div>
              ) : (
                <p className="note">
                  Not classified yet{r.classificationError ? `: ${r.classificationError}` : "."}
                </p>
              )}
            </div>
            <div className="card">
              <BucketControls id={r.id} current={bucket} />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
