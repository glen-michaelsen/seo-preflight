import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import SignOutButton from "@/components/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader
        rightContent={
          <>
            <span className="text-sm text-white/60 hidden sm:block">
              {session.user.email}
            </span>
            <SignOutButton />
          </>
        }
      />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
