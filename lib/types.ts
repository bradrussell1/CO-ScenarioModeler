export const PROJECTS = [
  "Brand",
  "Brand Tracker",
  "A4 Campaign",
  "Brand Campaign",
  "Website Phase 1",
  "Website Phase 2",
  "Website SLA",
] as const;
export type Project = (typeof PROJECTS)[number];

export const PRIORITIES = ["Immediate", "High", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const BUCKETS = [
  "Showstopper",
  "Out of Scope - Discuss",
  "Out of Scope - Include",
  "In-Scope",
] as const;
export type Bucket = (typeof BUCKETS)[number];
export const UNSORTED = "Unsorted" as const;

export type Classification = {
  bucket: Bucket;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  suggestedTitle: string;
  classifiedAt: string;
  model: string;
};

export type ChangeRequest = {
  id: string;
  createdAt: string;
  project: Project;
  context: string;
  description: string;
  deliverables: string;
  priority: Priority;
  responseNeeded: string; // YYYY-MM-DD
  name: string;
  email: string;
  classification: Classification | null;
  classificationError?: string;
  bucketOverride?: Bucket | null;
  bucketOverrideBy?: string;
};

export function effectiveBucket(r: ChangeRequest): Bucket | typeof UNSORTED {
  return r.bucketOverride ?? r.classification?.bucket ?? UNSORTED;
}
