"use client";

import { useState } from "react";
import { PRIORITIES, PROJECTS } from "@/lib/types";

export function IntakeForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setStatus("done");
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="success">
        <h2>Request received</h2>
        <p className="note">Thanks. The AKQA team will review it and follow up by email.</p>
        <p style={{ marginTop: 18 }}>
          <button className="btn btn-secondary" onClick={() => setStatus("idle")}>Submit another</button>
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="project">Project <span className="req">*</span></label>
        <select id="project" name="project" required defaultValue="">
          <option value="" disabled>Select a project</option>
          {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="field">
        <label htmlFor="context">Context <span className="req">*</span></label>
        <textarea id="context" name="context" required placeholder="What's the background? What prompted this request?" />
      </div>

      <div className="field">
        <label htmlFor="description">Description of Services <span className="req">*</span></label>
        <textarea id="description" name="description" required placeholder="What do you need AKQA to do?" />
      </div>

      <div className="field">
        <label htmlFor="deliverables">Deliverables <span className="req">*</span></label>
        <textarea id="deliverables" name="deliverables" required placeholder="What should be delivered at the end? Files, pages, assets, reports…" />
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="priority">Priority <span className="req">*</span></label>
          <select id="priority" name="priority" required defaultValue="">
            <option value="" disabled>Select</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="responseNeeded">Response Needed <span className="req">*</span></label>
          <input id="responseNeeded" name="responseNeeded" type="date" required min={today} />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="name">Name <span className="req">*</span></label>
          <input id="name" name="name" type="text" required autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email <span className="req">*</span></label>
          <input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
        <span className="note">All fields are required.</span>
        <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </form>
  );
}
