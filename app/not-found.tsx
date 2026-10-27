import Link from "next/link";
import { TopBar } from "@/components/Logo";

export default function NotFound() {
  return (
    <>
      <TopBar />
      <main className="container"><h1>Not found</h1><p className="sub"><Link href="/">Back to the intake form</Link></p></main>
    </>
  );
}
