import fs from "node:fs";
import path from "node:path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { effectiveBucket, type ChangeRequest } from "./types";

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function buildChangeRequestDocx(r: ChangeRequest): Buffer {
  const templatePath = path.join(process.cwd(), "templates", "cr-template.docx");
  const zip = new PizZip(fs.readFileSync(templatePath));
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  const terms = [
    `Priority: ${r.priority}`,
    `Response needed by: ${fmtDate(r.responseNeeded)}`,
    `Submitted: ${fmtDate(r.createdAt)} by ${r.name} (${r.email})`,
    `Triage: ${effectiveBucket(r)}`,
    r.classification ? `Triage notes: ${r.classification.reasoning}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  doc.render({
    client: "Replit, Inc.",
    clientContact: `${r.name}, ${r.email}`,
    agencyContact: "",
    projectName: `Replit — ${r.project}`,
    jobCode: "",
    term: "",
    sowDate: "________",
    context: `Context\n${r.context}`,
    description: `Services\n${r.description}`,
    deliverables: `Deliverables\n${r.deliverables}`,
    additionalTerms: terms,
    agencyFee: "",
    passThrough: "",
    totalValue: "",
  });

  return doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
}
