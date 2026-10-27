import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { BUCKETS, type ChangeRequest, type Classification } from "./types";

const MODEL = "claude-opus-5-5";

const Schema = z.object({
  bucket: z.enum(BUCKETS),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string(),
  suggestedTitle: z.string(),
});

const SYSTEM = `You triage inbound change requests from Replit (the client) against AKQA's fixed-fee statements of work. The projects are: Brand, Brand Tracker, A4 Campaign, Brand Campaign, Website Phase 1, Website Phase 2, Website SLA.

Sort each request into exactly one bucket:

- "Showstopper": the request blocks a launch, a critical-path deliverable, or a committed date, or the submitter marks it Immediate with a near-term response date and the ask is clearly urgent. These need a same-day conversation regardless of scope.
- "Out of Scope - Discuss": the work is not covered by the project's current SOW and is material enough (new workstream, new deliverable type, new roles, meaningful hours, or it shifts the delivery date) that AKQA should discuss a change order before committing.
- "Out of Scope - Include": the work is technically outside the SOW but small and absorbable at no fee: one extra review round, a minor copy or asset tweak, a small addition using existing components, no critical-path impact.
- "In-Scope": the work is plainly covered by the existing deliverables and services for that project.

Weigh the Context, Description of Services, and Deliverables fields together. Priority and the requested response date inform urgency, not scope. When torn between In-Scope and Out of Scope, lean toward Out of Scope - Discuss so a human reviews it. Keep the reasoning to two or three plain sentences a producer can read in ten seconds. The suggestedTitle is a short noun phrase (under 10 words) naming the request.`;

export async function classifyRequest(r: ChangeRequest): Promise<Classification> {
  const client = new Anthropic();
  const body = [
    `Project: ${r.project}`,
    `Priority: ${r.priority}`,
    `Response needed by: ${r.responseNeeded}`,
    `Submitted by: ${r.name} <${r.email}>`,
    ``,
    `Context:\n${r.context}`,
    ``,
    `Description of Services:\n${r.description}`,
    ``,
    `Deliverables:\n${r.deliverables}`,
  ].join("\n");

  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    output_config: { effort: "medium", format: zodOutputFormat(Schema) },
    system: SYSTEM,
    messages: [{ role: "user", content: body }],
  });

  if (res.stop_reason === "refusal" || !res.parsed_output) {
    throw new Error(`Classifier returned no result (stop_reason=${res.stop_reason})`);
  }
  return { ...res.parsed_output, classifiedAt: new Date().toISOString(), model: MODEL };
}
