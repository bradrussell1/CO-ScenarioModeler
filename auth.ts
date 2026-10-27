import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();

const providers: NextAuthConfig["providers"] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}

if (process.env.ADMIN_PASSWORD) {
  providers.push(
    Credentials({
      name: "Admin password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase();
        const password = String(creds?.password ?? "");
        if (email === adminEmail && password === process.env.ADMIN_PASSWORD) {
          return { id: "admin", email, name: "Admin" };
        }
        return null;
      },
    }),
  );
}

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
export const passwordEnabled = Boolean(process.env.ADMIN_PASSWORD);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    signIn({ user }) {
      return (user.email ?? "").toLowerCase() === adminEmail && adminEmail !== "";
    },
  },
});

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email || email !== adminEmail) return null;
  return session;
}
