import { redirect } from "next/navigation";
import { auth, googleEnabled, passwordEnabled, signIn } from "@/auth";
import { TopBar } from "@/components/Logo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await auth();
  if (session?.user) redirect("/admin");
  const { error } = await searchParams;

  return (
    <>
      <TopBar tagline="Admin" />
      <main className="container">
        <div className="card login-box">
          <h1 style={{ fontSize: 22 }}>Admin sign in</h1>
          <p className="sub">Only the AKQA admin account can view submissions.</p>

          {googleEnabled && (
            <form action={async () => { "use server"; await signIn("google", { redirectTo: "/admin" }); }}>
              <button className="btn btn-secondary" type="submit" style={{ width: "100%" }}>
                Continue with Google
              </button>
            </form>
          )}

          {googleEnabled && passwordEnabled && <div className="divider">or</div>}

          {passwordEnabled && (
            <form
              action={async (fd: FormData) => {
                "use server";
                await signIn("credentials", {
                  email: fd.get("email"),
                  password: fd.get("password"),
                  redirectTo: "/admin",
                });
              }}
            >
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required defaultValue={process.env.ADMIN_EMAIL ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" required />
              </div>
              <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>Sign in</button>
            </form>
          )}

          {!googleEnabled && !passwordEnabled && (
            <p className="error">No sign-in method is configured. Set AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET or ADMIN_PASSWORD.</p>
          )}

          {error && <p className="error">Sign-in failed. Check the account and try again.</p>}
        </div>
      </main>
    </>
  );
}
