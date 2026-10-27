import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, signOut } from "@/auth";
import { TopBar } from "@/components/Logo";
import { listRequests } from "@/lib/store";
import { BUCKETS, UNSORTED, effectiveBucket, type ChangeRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLORS: Record<string, string> = {
  Showstopper: "#dc2626",
  "Out of Scope - Discuss": "#d97706",
  "Out of Scope - Include": "#2563eb",
  "In-Scope": "#16a34a",
  Unsorted: "#9ca3af",
};

function Ticket({ r }: { r: ChangeRequest }) {
  const title = r.classification?.suggestedTitle ?? r.description.slice(0, 80);
  return (
    <Link href={`/admin/${r.id}`} className="ticket">
      <div className="t">{title}</div>
      <div className="m">
        <span>{r.project}</span>
        <span className={`chip ${r.priority.toLowerCase()}`}>{r.priority}</span>
        <span>Due {r.responseNeeded}</span>
        {r.bucketOverride && <span className="chip override">Manual</span>}
      </div>
      <div className="m" style={{ marginTop: 4 }}>
        <span>{r.name}</span>
        <span>{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
      </div>
    </Link>
  );
}

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  let requests: ChangeRequest[] = [];
  let loadError = "";
  try {
    requests = await listRequests();
  } catch (err) {
    loadError = err instanceof Error ? err.message : String(err);
  }

  const groups = new Map<string, ChangeRequest[]>();
  for (const b of [...BUCKETS, UNSORTED]) groups.set(b, []);
  for (const r of requests) groups.get(effectiveBucket(r))!.push(r);
  const unsorted = groups.get(UNSORTED)!;

  return (
    <>
      <TopBar
        tagline="Admin"
        right={
          <>
            <Link href="/">Intake form</Link>
            <Link href="/modeler">Scenario modeler</Link>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button className="btn btn-secondary btn-sm" type="submit">Sign out</button>
            </form>
          </>
        }
      />
      <main className="container wide">
        <div className="toolbar">
          <div>
            <h1>Change requests</h1>
            <p className="sub" style={{ margin: 0 }}>Sorted by AI into four buckets. Open a request to override or download the CR document.</p>
          </div>
          <div className="stats">
            <span>{requests.length} total</span>
            {unsorted.length > 0 && <span>{unsorted.length} unsorted</span>}
          </div>
        </div>

        {loadError && <p className="error">Could not load submissions: {loadError}</p>}

        <div className="board">
          {BUCKETS.map((b) => {
            const items = groups.get(b)!;
            return (
              <section className="col" key={b}>
                <div className="col-head">
                  <span><i className="dot" style={{ background: COLORS[b] }} />{b}</span>
                  <span className="count">{items.length}</span>
                </div>
                {items.length === 0 ? <div className="empty">Nothing here yet</div> : items.map((r) => <Ticket key={r.id} r={r} />)}
              </section>
            );
          })}
        </div>

        {unsorted.length > 0 && (
          <section className="col" style={{ marginTop: 16 }}>
            <div className="col-head">
              <span><i className="dot" style={{ background: COLORS.Unsorted }} />Unsorted (classifier did not run)</span>
              <span className="count">{unsorted.length}</span>
            </div>
            <div className="board">{unsorted.map((r) => <Ticket key={r.id} r={r} />)}</div>
          </section>
        )}
      </main>
    </>
  );
}
