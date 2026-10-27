"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BUCKETS, type Bucket } from "@/lib/types";

export function BucketControls({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "save" | "reclassify">("");
  const [value, setValue] = useState<string>(BUCKETS.includes(current as Bucket) ? current : "");
  const [msg, setMsg] = useState("");

  async function call(body: object, kind: "save" | "reclassify") {
    setBusy(kind);
    setMsg("");
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    setBusy("");
    if (!res.ok) {
      setMsg(j.error ?? "Failed");
      return;
    }
    setMsg(kind === "save" ? "Saved." : "Re-classified.");
    router.refresh();
  }

  return (
    <div className="stack">
      <label htmlFor="bucket">Override bucket</label>
      <select id="bucket" value={value} onChange={(e) => setValue(e.target.value)}>
        <option value="">Use AI suggestion</option>
        {BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <button className="btn btn-primary btn-sm" disabled={busy !== ""} onClick={() => call({ bucketOverride: value || null }, "save")}>
        {busy === "save" ? "Saving…" : "Save bucket"}
      </button>
      <button className="btn btn-secondary btn-sm" disabled={busy !== ""} onClick={() => call({ reclassify: true }, "reclassify")}>
        {busy === "reclassify" ? "Running AI…" : "Run AI triage again"}
      </button>
      {msg && <span className="note">{msg}</span>}
    </div>
  );
}
