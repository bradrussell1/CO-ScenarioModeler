# Replit Change Request portal

A Next.js app on Vercel with two faces:

- **`/`** — the public intake form ("Replit Change Request"). Submissions are stored in Vercel Blob and triaged by Claude into four buckets: Showstopper, Out of Scope - Discuss, Out of Scope - Include, In-Scope.
- **`/admin`** — admin-only board of every submission grouped by bucket. Open a request to read the AI reasoning, override the bucket, re-run triage, or download it pre-filled into the AKQA Short Form Change Request template (`templates/cr-template.docx`).
- **`/modeler`** — the original CO Scenario Modeler, admin-only.

## Environment variables

See `.env.example`. `BLOB_READ_WRITE_TOKEN` is injected by the linked Blob store. Admin sign-in uses Google OAuth (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, restricted to `ADMIN_EMAIL`) with an `ADMIN_PASSWORD` fallback for the same email.

## Local development

```bash
npm install
vercel env pull .env.local
npm run dev
```
