import Link from "next/link";
import { TopBar } from "@/components/Logo";
import { IntakeForm } from "./IntakeForm";

export default function PortalPage() {
  return (
    <>
      <TopBar right={<Link href="/admin">Admin</Link>} />
      <main className="container">
        <h1>Replit Change Request</h1>
        <p className="sub">Tell us what you need and we&apos;ll come back with scope, timing, and next steps.</p>
        <div className="card">
          <IntakeForm />
        </div>
      </main>
    </>
  );
}
