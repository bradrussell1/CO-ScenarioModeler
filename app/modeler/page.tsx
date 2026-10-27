import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/auth";
import { TopBar } from "@/components/Logo";
import { Modeler } from "./Modeler";

export default async function ModelerPage() {
  const session = await requireAdmin();
  if (!session) redirect("/login");
  return (
    <>
      <TopBar tagline="CO Scenario Modeler" right={<Link href="/admin">← All requests</Link>} />
      <Modeler />
    </>
  );
}
