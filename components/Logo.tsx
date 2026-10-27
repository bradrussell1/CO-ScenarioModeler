import Link from "next/link";

export function TopBar({ right, tagline }: { right?: React.ReactNode; tagline?: string }) {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Replit change requests home">
        <img src="/replit-logo.png" alt="Replit" />
        <span>{tagline ?? "Change Requests"}</span>
      </Link>
      <nav>{right}</nav>
    </header>
  );
}
